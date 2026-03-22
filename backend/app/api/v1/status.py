from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Company, Integration
from app.schemas.integration import StatusCheck
from app.api.deps import get_current_company
from app.services.crypto import crypto

router = APIRouter(prefix="/status", tags=["status"])


async def _check_readai(integration: Integration) -> StatusCheck:
    if not integration or not integration.read_ai_enabled:
        return StatusCheck(service="readai", status="not_configured", message="Webhook not configured")
    return StatusCheck(
        service="readai",
        status="connected",
        message=f"Webhook active",
        last_checked=datetime.utcnow(),
    )


async def _check_drive(integration: Integration) -> StatusCheck:
    if not integration or not integration.google_drive_enabled:
        return StatusCheck(service="google_drive", status="not_configured", message="Google Drive not connected")
    try:
        import json
        creds_json = json.loads(crypto.decrypt(integration.google_credentials_enc))
        return StatusCheck(
            service="google_drive",
            status="connected",
            message="Google Drive connected",
            last_checked=datetime.utcnow(),
        )
    except Exception as e:
        return StatusCheck(service="google_drive", status="error", message=str(e))


async def _check_llm(integration: Integration) -> StatusCheck:
    if not integration or not integration.llm_enabled:
        return StatusCheck(service="llm", status="not_configured", message="LLM not configured")
    try:
        from app.services.llm import LLMService
        svc = LLMService(integration)
        await svc.complete([{"role": "user", "content": "ping"}])
        return StatusCheck(
            service="llm",
            status="connected",
            message=f"{integration.llm_provider} / {integration.llm_model}",
            last_checked=datetime.utcnow(),
        )
    except Exception as e:
        return StatusCheck(service="llm", status="error", message=str(e)[:200])


async def _check_telegram(integration: Integration) -> StatusCheck:
    if not integration or not integration.telegram_enabled:
        return StatusCheck(service="telegram", status="not_configured", message="Telegram bot not configured")
    try:
        import httpx
        token = crypto.decrypt(integration.telegram_bot_token_enc)
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"https://api.telegram.org/bot{token}/getMe")
        if r.status_code == 200:
            return StatusCheck(
                service="telegram",
                status="connected",
                message=f"@{integration.telegram_bot_username}",
                last_checked=datetime.utcnow(),
            )
        return StatusCheck(service="telegram", status="error", message="Bot token invalid")
    except Exception as e:
        return StatusCheck(service="telegram", status="error", message=str(e)[:200])


@router.get("", response_model=list[StatusCheck])
async def get_status(
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(get_current_company),
):
    result = await db.execute(
        select(Integration).where(Integration.company_id == company.id)
    )
    integration = result.scalar_one_or_none()

    checks = await _check_readai(integration)
    drive_check = await _check_drive(integration)
    llm_check = await _check_llm(integration)
    tg_check = await _check_telegram(integration)

    return [checks, drive_check, llm_check, tg_check]
