import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from app.database import get_db
from app.models import Company, Meeting
from app.schemas.meeting import MeetingListItem, MeetingDetail
from app.schemas.common import PaginatedResponse
from app.api.deps import get_current_company

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.get("", response_model=PaginatedResponse[MeetingListItem])
async def list_meetings(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(get_current_company),
):
    query = select(Meeting).where(Meeting.company_id == company.id)
    if status:
        query = query.where(Meeting.status == status)
    query = query.order_by(Meeting.meeting_date.desc().nullslast(), Meeting.ingested_at.desc())

    # Count
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # Paginate
    query = query.offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(query)).scalars().all()

    items = [
        MeetingListItem(
            id=m.id,
            meeting_title=m.meeting_title,
            meeting_date=m.meeting_date,
            status=m.status,
            participants_count=len(m.participants_json or []),
            action_items_count=len(m.action_items_json or []),
            drive_file_url=m.drive_file_url,
            ingested_at=m.ingested_at,
            external_meeting_id=m.external_meeting_id,
            version=m.version,
        )
        for m in rows
    ]
    return PaginatedResponse(items=items, total=total, page=page, per_page=per_page)


@router.get("/{meeting_id}", response_model=MeetingDetail)
async def get_meeting(
    meeting_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(get_current_company),
):
    result = await db.execute(
        select(Meeting).where(Meeting.id == meeting_id, Meeting.company_id == company.id)
    )
    meeting = result.scalar_one_or_none()
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    return MeetingDetail.model_validate(meeting)


@router.post("/{meeting_id}/reprocess", status_code=202)
async def reprocess_meeting(
    meeting_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(get_current_company),
):
    result = await db.execute(
        select(Meeting).where(Meeting.id == meeting_id, Meeting.company_id == company.id)
    )
    meeting = result.scalar_one_or_none()
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    if not meeting.source_payload_json:
        raise HTTPException(400, "No source payload available for reprocessing")

    from app.worker.tasks.ingestion import process_meeting
    process_meeting.delay(str(company.id), meeting.source_payload_json, force_reprocess=True)
    return {"status": "reprocessing queued"}


@router.delete("/{meeting_id}", status_code=204)
async def delete_meeting(
    meeting_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(get_current_company),
):
    result = await db.execute(
        select(Meeting).where(Meeting.id == meeting_id, Meeting.company_id == company.id)
    )
    meeting = result.scalar_one_or_none()
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    await db.delete(meeting)
    await db.commit()
