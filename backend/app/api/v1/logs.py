import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import Company, IngestionLog
from app.schemas.meeting import IngestionLogResponse
from app.schemas.common import PaginatedResponse
from app.api.deps import get_current_company

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("", response_model=PaginatedResponse[IngestionLogResponse])
async def list_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(get_current_company),
):
    query = select(IngestionLog).where(
        IngestionLog.company_id == company.id
    ).order_by(IngestionLog.created_at.desc())

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    query = query.offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(query)).scalars().all()

    return PaginatedResponse(
        items=[IngestionLogResponse.model_validate(r) for r in rows],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{meeting_id}", response_model=list[IngestionLogResponse])
async def get_meeting_logs(
    meeting_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(get_current_company),
):
    result = await db.execute(
        select(IngestionLog).where(
            IngestionLog.meeting_id == meeting_id,
            IngestionLog.company_id == company.id,
        ).order_by(IngestionLog.created_at.asc())
    )
    return [IngestionLogResponse.model_validate(r) for r in result.scalars().all()]
