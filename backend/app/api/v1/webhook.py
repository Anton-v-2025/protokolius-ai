import hmac
import hashlib
import json
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import Company, Integration, IngestionLog
from app.models.ingestion_log import LogStatus
from app.rate_limit import limiter

router = APIRouter(tags=["webhook"])


async def _log_event(
    db: AsyncSession,
    company_id,
    external_meeting_id: str | None,
    event_type: str,
    status: LogStatus,
    payload: dict | None = None,
    error: str | None = None,
):
    log = IngestionLog(
        company_id=company_id,
        external_meeting_id=external_meeting_id,
        event_type=event_type,
        status=status,
        payload_json=payload,
        error_message=error,
    )
    db.add(log)
    await db.commit()


@router.post("/webhook/readai/{tenant_slug}", status_code=202)
@limiter.limit("30/minute")
async def receive_readai_webhook(
    tenant_slug: str,
    request: Request,
    background_tasks: BackgroundTasks,
):
    raw_body = await request.body()

    async with AsyncSessionLocal() as db:
        # 1. Fetch tenant
        result = await db.execute(
            select(Company).where(
                Company.company_slug == tenant_slug,
                Company.is_active == True,
            )
        )
        company = result.scalar_one_or_none()
        if not company:
            raise HTTPException(404, "Tenant not found")

        # 2. Fetch integration
        int_result = await db.execute(
            select(Integration).where(Integration.company_id == company.id)
        )
        integration = int_result.scalar_one_or_none()

        # 3. Validate HMAC signature
        if integration and integration.read_ai_webhook_secret:
            import base64

            # Read AI uses x-read-signature header with plain hex (no sha256= prefix)
            # and base64-decoded secret as HMAC key
            signature = request.headers.get("x-read-signature", "")

            try:
                secret_bytes = base64.b64decode(integration.read_ai_webhook_secret)
            except Exception:
                secret_bytes = integration.read_ai_webhook_secret.encode()

            expected = hmac.new(secret_bytes, raw_body, hashlib.sha256).hexdigest()

            if not hmac.compare_digest(signature, expected):
                raise HTTPException(401, "Invalid webhook signature")

        # 4. Parse payload
        try:
            payload = json.loads(raw_body)
        except json.JSONDecodeError:
            raise HTTPException(400, "Invalid JSON payload")

        # Extract meeting id for logging
        meeting_obj = payload.get("meeting", payload)
        external_id = meeting_obj.get("id") or meeting_obj.get("meeting_id") or "unknown"

        # 5. Log receipt
        await _log_event(
            db, company.id, external_id, "webhook_received", LogStatus.started, payload
        )

    # 6. Enqueue Celery task (async, non-blocking)
    from app.worker.tasks.ingestion import process_meeting
    process_meeting.delay(str(company.id), payload)

    return {"status": "accepted", "meeting_id": external_id}
