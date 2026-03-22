"""
Bot lifecycle manager.
Runs bots as background tasks within the FastAPI process.
Handles startup, shutdown, health checks, and auto-recovery.
"""

import asyncio
import logging
from datetime import datetime
from typing import Optional

from telegram.ext import Application, CommandHandler, MessageHandler, filters
from app.bot.handlers import cmd_start, cmd_help, cmd_latest, cmd_actions, handle_message

logger = logging.getLogger(__name__)


class BotInstance:
    """Tracks state of a single tenant bot."""

    def __init__(self, company_id: str, company_name: str, bot_token: str, integration):
        self.company_id = company_id
        self.company_name = company_name
        self.bot_token = bot_token
        self.integration = integration
        self.task: Optional[asyncio.Task] = None
        self.app: Optional[Application] = None
        self.started_at: Optional[datetime] = None
        self.restart_count: int = 0
        self.last_error: Optional[str] = None

    @property
    def is_running(self) -> bool:
        return self.task is not None and not self.task.done()


class BotManager:
    """
    Manages all tenant bots. Integrates with FastAPI lifespan.
    Auto-restarts crashed bots up to MAX_RESTARTS times.
    """

    MAX_RESTARTS = 5
    RESTART_DELAY = 10  # seconds
    HEALTH_CHECK_INTERVAL = 60  # seconds

    def __init__(self):
        self._bots: dict[str, BotInstance] = {}
        self._health_task: Optional[asyncio.Task] = None
        self._running = False

    async def start(self):
        """Load all bots from DB and start them + health checker."""
        self._running = True
        await self._load_and_start_all()
        self._health_task = asyncio.create_task(self._health_loop())
        logger.info("BotManager started")

    async def stop(self):
        """Gracefully stop all bots."""
        self._running = False
        if self._health_task:
            self._health_task.cancel()
        for bot in self._bots.values():
            await self._stop_bot(bot)
        self._bots.clear()
        logger.info("BotManager stopped")

    async def start_bot(self, company_id: str, bot_token: str, integration, company_name: str):
        """Start or restart a single bot."""
        # Stop existing if running
        if company_id in self._bots:
            await self._stop_bot(self._bots[company_id])

        instance = BotInstance(company_id, company_name, bot_token, integration)
        self._bots[company_id] = instance
        await self._launch_bot(instance)

    async def stop_bot(self, company_id: str):
        """Stop a specific bot."""
        if company_id in self._bots:
            await self._stop_bot(self._bots.pop(company_id))

    def get_status(self) -> list[dict]:
        """Get status of all bots for monitoring."""
        return [
            {
                "company_id": bot.company_id,
                "company_name": bot.company_name,
                "running": bot.is_running,
                "started_at": bot.started_at.isoformat() if bot.started_at else None,
                "restart_count": bot.restart_count,
                "last_error": bot.last_error,
            }
            for bot in self._bots.values()
        ]

    # ── Internal ────────────────────────────────────────────

    async def _load_and_start_all(self):
        """Load enabled bots from DB and start them."""
        from app.database import AsyncSessionLocal
        from app.models import Company, Integration
        from app.services.crypto import crypto
        from sqlalchemy import select

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Company, Integration)
                .join(Integration, Integration.company_id == Company.id)
                .where(Integration.telegram_enabled == True, Company.is_active == True)
            )
            rows = result.all()

        started = 0
        for company, integration in rows:
            try:
                token = crypto.decrypt(integration.telegram_bot_token_enc)
                instance = BotInstance(str(company.id), company.company_name, token, integration)
                self._bots[str(company.id)] = instance
                await self._launch_bot(instance)
                started += 1
            except Exception as e:
                logger.error(f"Failed to start bot for {company.company_name}: {e}")

        logger.info(f"Loaded {started}/{len(rows)} bots from DB")

    async def _launch_bot(self, instance: BotInstance):
        """Create and start a bot task."""
        instance.task = asyncio.create_task(
            self._run_bot(instance),
            name=f"bot-{instance.company_id[:8]}",
        )
        instance.started_at = datetime.utcnow()

    async def _run_bot(self, instance: BotInstance):
        """Run a single bot with error handling."""
        try:
            app = Application.builder().token(instance.bot_token).build()
            instance.app = app

            app.bot_data["company_id"] = instance.company_id
            app.bot_data["integration"] = instance.integration
            app.bot_data["company_name"] = instance.company_name

            app.add_handler(CommandHandler("start", cmd_start))
            app.add_handler(CommandHandler("help", cmd_help))
            app.add_handler(CommandHandler("latest", cmd_latest))
            app.add_handler(CommandHandler("actions", cmd_actions))
            app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

            logger.info(f"Bot started: {instance.company_name}")
            await app.initialize()
            await app.start()
            await app.updater.start_polling(drop_pending_updates=True)

            # Keep alive
            await asyncio.Event().wait()

        except asyncio.CancelledError:
            logger.info(f"Bot cancelled: {instance.company_name}")
        except Exception as e:
            instance.last_error = str(e)[:200]
            logger.error(f"Bot crashed: {instance.company_name} — {e}")
        finally:
            if instance.app:
                try:
                    if instance.app.updater and instance.app.updater.running:
                        await instance.app.updater.stop()
                    if instance.app.running:
                        await instance.app.stop()
                    await instance.app.shutdown()
                except Exception:
                    pass
                instance.app = None

    async def _stop_bot(self, instance: BotInstance):
        """Cancel a bot task and wait for cleanup."""
        if instance.task and not instance.task.done():
            instance.task.cancel()
            try:
                await asyncio.wait_for(instance.task, timeout=5)
            except (asyncio.CancelledError, asyncio.TimeoutError):
                pass

    async def _health_loop(self):
        """Periodically check bots and restart crashed ones."""
        while self._running:
            try:
                await asyncio.sleep(self.HEALTH_CHECK_INTERVAL)
                for instance in list(self._bots.values()):
                    if not instance.is_running and instance.restart_count < self.MAX_RESTARTS:
                        instance.restart_count += 1
                        logger.warning(
                            f"Restarting bot {instance.company_name} "
                            f"(attempt {instance.restart_count}/{self.MAX_RESTARTS})"
                        )
                        await asyncio.sleep(self.RESTART_DELAY)
                        await self._launch_bot(instance)
                    elif not instance.is_running:
                        logger.error(
                            f"Bot {instance.company_name} exceeded max restarts, giving up"
                        )
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Health check error: {e}")


# Singleton
bot_manager = BotManager()
