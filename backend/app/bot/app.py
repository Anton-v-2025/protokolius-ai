"""
Telegram bot runner.
Each company bot runs in its own Application instance using polling.
Designed to run in a separate process/thread per tenant.
"""

import asyncio
import logging
from telegram.ext import Application, CommandHandler, MessageHandler, filters
from app.bot.handlers import (
    cmd_start, cmd_help, cmd_latest, cmd_actions, handle_message
)

logger = logging.getLogger(__name__)


async def run_bot(company_id: str, bot_token: str, integration, company_name: str):
    """Start polling for a single tenant bot."""
    app = (
        Application.builder()
        .token(bot_token)
        .build()
    )

    # Store tenant context
    app.bot_data["company_id"] = company_id
    app.bot_data["integration"] = integration
    app.bot_data["company_name"] = company_name

    # Register handlers
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("latest", cmd_latest))
    app.add_handler(CommandHandler("actions", cmd_actions))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    logger.info(f"Starting bot for company {company_name} (id={company_id})")
    await app.initialize()
    await app.start()
    await app.updater.start_polling(drop_pending_updates=True)

    # Keep running
    try:
        await asyncio.Event().wait()
    finally:
        await app.updater.stop()
        await app.stop()
        await app.shutdown()


async def start_all_bots():
    """
    Load all configured bots from DB and start polling.
    Runs as a long-lived async task (launched from a separate process).
    """
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

    tasks = []
    for company, integration in rows:
        try:
            token = crypto.decrypt(integration.telegram_bot_token_enc)
            task = asyncio.create_task(
                run_bot(str(company.id), token, integration, company.company_name)
            )
            tasks.append(task)
        except Exception as e:
            logger.error(f"Failed to start bot for {company.company_name}: {e}")

    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)
    else:
        logger.info("No configured Telegram bots found.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(start_all_bots())
