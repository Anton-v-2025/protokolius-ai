import json
import secrets
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Company, Integration
from app.schemas.integration import (
    ReadAIUpdate, GoogleDriveUpdate, LLMUpdate, TelegramUpdate,
    IntegrationResponse, StatusCheck
)
from app.api.deps import get_current_company
from app.services.crypto import crypto
from app.config import settings

router = APIRouter(prefix="/integrations", tags=["integrations"])


async def _get_or_create_integration(db: AsyncSession, company: Company) -> Integration:
    result = await db.execute(
        select(Integration).where(Integration.company_id == company.id)
    )
    integration = result.scalar_one_or_none()
    if not integration:
        integration = Integration(company_id=company.id)
        db.add(integration)
        await db.flush()
    return integration


def _mask_key(key: str | None) -> str | None:
    if not key:
        return None
    return key[:8] + "****" if len(key) > 8 else "****"


def _build_integration_response(integration: Integration) -> IntegrationResponse:
    # Decrypt LLM key to mask it for display
    llm_key_masked = None
    if integration.llm_api_key_enc:
        try:
            decrypted = crypto.decrypt(integration.llm_api_key_enc)
            llm_key_masked = _mask_key(decrypted)
        except Exception:
            llm_key_masked = "****"

    return IntegrationResponse(
        id=integration.id,
        company_id=integration.company_id,
        read_ai_enabled=integration.read_ai_enabled,
        read_ai_webhook_secret=integration.read_ai_webhook_secret,
        google_drive_enabled=integration.google_drive_enabled,
        google_drive_folder_id=integration.google_drive_folder_id,
        llm_provider=integration.llm_provider,
        llm_model=integration.llm_model,
        llm_api_key_masked=llm_key_masked,
        llm_base_url=integration.llm_base_url,
        llm_embedding_model=integration.llm_embedding_model,
        assistant_prompt=integration.assistant_prompt,
        llm_enabled=integration.llm_enabled,
        telegram_bot_username=integration.telegram_bot_username,
        telegram_enabled=integration.telegram_enabled,
        created_at=integration.created_at,
        updated_at=integration.updated_at,
    )


@router.get("", response_model=IntegrationResponse)
async def get_integrations(
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(get_current_company),
):
    integration = await _get_or_create_integration(db, company)
    await db.commit()
    return _build_integration_response(integration)


@router.patch("/readai", response_model=IntegrationResponse)
async def update_readai(
    payload: ReadAIUpdate,
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(get_current_company),
):
    integration = await _get_or_create_integration(db, company)
    if payload.read_ai_webhook_secret is not None:
        integration.read_ai_webhook_secret = payload.read_ai_webhook_secret
    integration.read_ai_enabled = payload.read_ai_enabled
    await db.commit()
    await db.refresh(integration)
    return _build_integration_response(integration)


@router.post("/readai/generate-secret")
async def generate_readai_secret(
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(get_current_company),
):
    integration = await _get_or_create_integration(db, company)
    secret = secrets.token_hex(32)
    integration.read_ai_webhook_secret = secret
    integration.read_ai_enabled = True
    await db.commit()
    return {"webhook_secret": secret}


@router.patch("/google-drive", response_model=IntegrationResponse)
async def update_google_drive(
    payload: GoogleDriveUpdate,
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(get_current_company),
):
    integration = await _get_or_create_integration(db, company)
    if payload.google_drive_folder_id is not None:
        integration.google_drive_folder_id = payload.google_drive_folder_id
    if payload.google_credentials_json is not None:
        integration.google_credentials_enc = crypto.encrypt(
            json.dumps(payload.google_credentials_json)
        )
        integration.google_drive_enabled = True
    await db.commit()
    await db.refresh(integration)
    return _build_integration_response(integration)


@router.get("/google-drive/auth")
async def google_drive_auth(company: Company = Depends(get_current_company)):
    from google_auth_oauthlib.flow import Flow
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
            }
        },
        scopes=["https://www.googleapis.com/auth/drive.file"],
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
    )
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        state=str(company.id),
    )
    return {"auth_url": auth_url}


@router.get("/google-drive/callback")
async def google_drive_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    from google_auth_oauthlib.flow import Flow
    result = await db.execute(
        select(Company).where(Company.id == state)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(400, "Invalid state")

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI],
            }
        },
        scopes=["https://www.googleapis.com/auth/drive.file"],
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
    )
    flow.fetch_token(code=code)
    credentials = flow.credentials

    integration = await _get_or_create_integration(db, company)
    creds_json = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": list(credentials.scopes),
    }
    integration.google_credentials_enc = crypto.encrypt(json.dumps(creds_json))
    integration.google_drive_enabled = True
    await db.commit()

    return RedirectResponse(url=f"{settings.FRONTEND_URL}/w/{company.workspace_token}/integrations/drive?connected=true")


@router.patch("/llm", response_model=IntegrationResponse)
async def update_llm(
    payload: LLMUpdate,
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(get_current_company),
):
    integration = await _get_or_create_integration(db, company)
    if payload.llm_provider is not None:
        integration.llm_provider = payload.llm_provider
    if payload.llm_model is not None:
        integration.llm_model = payload.llm_model
    if payload.llm_api_key is not None:
        integration.llm_api_key_enc = crypto.encrypt(payload.llm_api_key)
    if payload.llm_base_url is not None:
        integration.llm_base_url = payload.llm_base_url or None
    if payload.llm_embedding_model is not None:
        integration.llm_embedding_model = payload.llm_embedding_model
    if payload.assistant_prompt is not None:
        integration.assistant_prompt = payload.assistant_prompt

    has_required = all([integration.llm_provider, integration.llm_model, integration.llm_api_key_enc])
    integration.llm_enabled = bool(has_required)
    await db.commit()
    await db.refresh(integration)
    return _build_integration_response(integration)


@router.post("/llm/test")
async def test_llm(
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(get_current_company),
):
    integration = await _get_or_create_integration(db, company)
    if not integration.llm_enabled:
        raise HTTPException(400, "LLM not configured")
    from app.services.llm import LLMService
    svc = LLMService(integration)
    try:
        response = await svc.complete([{"role": "user", "content": "Say 'OK' in one word."}])
        return {"status": "connected", "response": response[:100]}
    except Exception as e:
        return {"status": "error", "error": str(e)}


@router.patch("/telegram", response_model=IntegrationResponse)
async def update_telegram(
    payload: TelegramUpdate,
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(get_current_company),
):
    integration = await _get_or_create_integration(db, company)
    if payload.telegram_bot_token is not None:
        # Verify token before saving
        import httpx
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://api.telegram.org/bot{payload.telegram_bot_token}/getMe"
            )
        if r.status_code != 200:
            raise HTTPException(400, "Invalid Telegram bot token")
        bot_info = r.json().get("result", {})
        integration.telegram_bot_token_enc = crypto.encrypt(payload.telegram_bot_token)
        integration.telegram_bot_username = bot_info.get("username")
        integration.telegram_enabled = True

    if payload.assistant_prompt is not None:
        integration.assistant_prompt = payload.assistant_prompt
    await db.commit()
    await db.refresh(integration)

    # Hot-reload bot via BotManager
    if integration.telegram_enabled and integration.telegram_bot_token_enc:
        try:
            from app.bot.manager import bot_manager
            token = crypto.decrypt(integration.telegram_bot_token_enc)
            await bot_manager.start_bot(
                str(company.id), token, integration, company.company_name
            )
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Bot hot-reload failed: {e}")

    return _build_integration_response(integration)


@router.post("/telegram/verify")
async def verify_telegram(token: str, company: Company = Depends(get_current_company)):
    import httpx
    async with httpx.AsyncClient() as client:
        r = await client.get(f"https://api.telegram.org/bot{token}/getMe")
    if r.status_code != 200:
        raise HTTPException(400, "Invalid token")
    return r.json().get("result", {})
