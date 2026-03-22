"""
Full meeting ingestion pipeline as a Celery task chain.

Steps:
1. Parse payload (ReadAI → NormalizedMeeting)
2. Duplicate check / versioning
3. Save to DB
4. Save normalized JSON to Google Drive
5. Chunk + embed + store vectors
6. Finalize status
"""

import asyncio
import uuid
from datetime import datetime
from app.worker.celery_app import celery_app


def _run(coro):
    """Run async code inside Celery's sync context."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            raise RuntimeError
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


@celery_app.task(
    name="app.worker.tasks.ingestion.process_meeting",
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    queue="ingestion",
)
def process_meeting(self, company_id: str, raw_payload: dict, force_reprocess: bool = False):
    """Main ingestion entry point — runs the full pipeline."""
    try:
        _run(_process_meeting_async(self, company_id, raw_payload, force_reprocess))
    except Exception as exc:
        raise self.retry(exc=exc)


async def _process_meeting_async(task, company_id_str: str, raw_payload: dict, force_reprocess: bool):
    from app.database import AsyncSessionLocal
    from app.models import Company, Integration, Meeting, IngestionLog
    from app.models.meeting import MeetingStatus
    from app.models.ingestion_log import LogStatus
    from app.services.readai_parser import ReadAIParser
    from sqlalchemy import select

    company_id = uuid.UUID(company_id_str)
    start_time = datetime.utcnow()

    async with AsyncSessionLocal() as db:
        # Load company + integration
        company_result = await db.execute(select(Company).where(Company.id == company_id))
        company = company_result.scalar_one_or_none()
        if not company:
            return

        int_result = await db.execute(select(Integration).where(Integration.company_id == company_id))
        integration = int_result.scalar_one_or_none()

        # ── STEP 1: Parse ──────────────────────────────────────────
        parser = ReadAIParser()
        try:
            parsed = parser.parse(raw_payload)
        except Exception as e:
            await _log(db, company_id, None, None, "normalize", LogStatus.failed, error=str(e))
            return

        external_id = parsed.external_id

        # ── STEP 2: Duplicate check ────────────────────────────────
        existing_result = await db.execute(
            select(Meeting).where(
                Meeting.company_id == company_id,
                Meeting.external_meeting_id == external_id,
            ).order_by(Meeting.version.desc())
        )
        existing = existing_result.scalars().all()

        if existing:
            latest = existing[0]
            if not force_reprocess:
                # Check if payload is identical to skip
                if latest.source_payload_json == raw_payload and latest.status == MeetingStatus.completed:
                    await _log(
                        db, company_id, external_id, latest.id,
                        "duplicate_check", LogStatus.duplicate,
                        payload={"reason": "identical payload, already completed"}
                    )
                    return
            version = latest.version + 1
        else:
            version = 1

        # ── STEP 3: Create/update meeting in DB ───────────────────
        normalized = _build_normalized_json(company_id_str, parsed)

        meeting = Meeting(
            company_id=company_id,
            external_meeting_id=external_id,
            version=version,
            meeting_title=parsed.title,
            meeting_date=parsed.meeting_date,
            duration_seconds=parsed.duration_seconds,
            transcript_full=parsed.transcript_full,
            meeting_notes_full=parsed.meeting_notes_full,
            summary=parsed.summary,
            action_items_json=[
                {"task": a.task, "owner": a.owner, "due_date": a.due_date}
                for a in parsed.action_items
            ],
            participants_json=[
                {"name": p.name, "email": p.email}
                for p in parsed.participants
            ],
            normalized_json=normalized,
            source_payload_json=raw_payload,
            status=MeetingStatus.processing,
        )
        db.add(meeting)
        await db.flush()

        await _log(db, company_id, external_id, meeting.id, "normalize", LogStatus.success)

        # ── STEP 4: Google Drive ───────────────────────────────────
        if integration and integration.google_drive_enabled:
            try:
                from app.services.drive import GoogleDriveService
                drive = GoogleDriveService(integration)
                file_id, file_url, drive_path = await drive.upload_meeting_json_async(
                    company_name=company.company_name,
                    meeting_id=external_id,
                    version=version,
                    meeting_date=parsed.meeting_date,
                    normalized_json=normalized,
                )
                meeting.drive_file_id = file_id
                meeting.drive_file_url = file_url
                meeting.drive_path = drive_path
                meeting.status = MeetingStatus.drive_saved
                await _log(db, company_id, external_id, meeting.id, "drive_save", LogStatus.success)
            except Exception as e:
                await _log(
                    db, company_id, external_id, meeting.id,
                    "drive_save", LogStatus.failed, error=str(e)
                )
                # Don't abort — continue to embedding

        # ── STEP 5: Chunk + Embed + Store vectors ──────────────────
        if integration and integration.llm_enabled:
            try:
                from app.services.chunker import MeetingChunker
                from app.services.embeddings import EmbeddingService
                from app.services.vector_store import VectorStore

                chunker = MeetingChunker()
                chunks = chunker.chunk_meeting(meeting)

                embed_svc = EmbeddingService(integration)
                texts = [c.text for c in chunks]
                embeddings = await embed_svc.embed_texts(texts)

                vector_store = VectorStore()
                # Delete old chunks if reprocessing
                await vector_store.delete_meeting_chunks(db, meeting.id)
                await vector_store.store_chunks(db, company_id, meeting.id, chunks, embeddings)

                meeting.status = MeetingStatus.indexed
                await _log(
                    db, company_id, external_id, meeting.id,
                    "embed", LogStatus.success,
                    payload={"chunks": len(chunks)}
                )
            except Exception as e:
                await _log(
                    db, company_id, external_id, meeting.id,
                    "embed", LogStatus.failed, error=str(e)
                )

        # ── STEP 6: Finalize ───────────────────────────────────────
        meeting.status = MeetingStatus.completed
        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        await _log(
            db, company_id, external_id, meeting.id,
            "completed", LogStatus.success,
            payload={"duration_ms": duration_ms}
        )
        await db.commit()


def _build_normalized_json(company_id: str, parsed) -> dict:
    from datetime import datetime as dt
    return {
        "tenant_id": company_id,
        "meeting_id": parsed.external_id,
        "source": "read_ai",
        "meeting_title": parsed.title,
        "meeting_date": parsed.meeting_date.isoformat() if parsed.meeting_date else None,
        "participants": [
            {"name": p.name, "email": p.email} for p in parsed.participants
        ],
        "transcript_full": parsed.transcript_full,
        "meeting_notes_full": parsed.meeting_notes_full,
        "summary": parsed.summary,
        "action_items": [
            {"task": a.task, "owner": a.owner, "due_date": a.due_date}
            for a in parsed.action_items
        ],
        "metadata": parsed.metadata,
        "ingested_at": dt.utcnow().isoformat() + "Z",
        "updated_at": dt.utcnow().isoformat() + "Z",
    }


async def _log(db, company_id, external_id, meeting_id, event_type, status, payload=None, error=None):
    from app.models import IngestionLog
    log = IngestionLog(
        company_id=company_id,
        external_meeting_id=external_id,
        meeting_id=meeting_id,
        event_type=event_type,
        status=status,
        payload_json=payload,
        error_message=error,
    )
    db.add(log)
    await db.flush()
