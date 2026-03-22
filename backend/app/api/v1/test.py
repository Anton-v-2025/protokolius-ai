import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import Company
from app.schemas.meeting import TestQueryRequest, TestQueryResponse
from app.api.deps import get_current_company

router = APIRouter(prefix="/test", tags=["test"])

SAMPLE_PAYLOAD = {
    "meeting": {
        "id": "test_meeting_001",
        "title": "Test Weekly Sync",
        "start_time": "2026-03-18T10:00:00Z",
        "end_time": "2026-03-18T11:00:00Z",
        "duration": 3600,
        "participants": [
            {"name": "Anna Smith", "email": "anna@company.com"},
            {"name": "Bob Lee", "email": "bob@company.com"},
        ],
        "transcript": {
            "segments": [
                {"speaker_name": "Anna Smith", "text": "Good morning everyone. Let's start with the budget review."},
                {"speaker_name": "Bob Lee", "text": "Sure. I've prepared the Q2 numbers. We're at 85% of target."},
                {"speaker_name": "Anna Smith", "text": "Great. Bob, can you prepare the full budget draft by Friday?"},
                {"speaker_name": "Bob Lee", "text": "Absolutely, I'll have it ready."},
            ]
        },
        "notes": "Discussed Q2 budget performance. Team is on track. Action items assigned.",
        "summary": "Weekly sync covering Q2 budget review. Team is at 85% of target. Bob to prepare full budget draft.",
        "action_items": [
            {"text": "Prepare Q2 budget draft", "assignee": "Bob Lee", "due_date": "2026-03-22"},
            {"text": "Share budget with stakeholders", "assignee": "Anna Smith", "due_date": "2026-03-25"},
        ],
    }
}


@router.post("/ingest", status_code=202)
async def test_ingest(
    payload: dict | None = None,
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(get_current_company),
):
    test_payload = payload or SAMPLE_PAYLOAD
    from app.worker.tasks.ingestion import process_meeting
    task = process_meeting.delay(str(company.id), test_payload)
    return {"status": "queued", "task_id": task.id, "payload_used": "custom" if payload else "sample"}


@router.post("/query", response_model=TestQueryResponse)
async def test_query(
    request: TestQueryRequest,
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(get_current_company),
):
    from sqlalchemy import select
    from app.models import Integration
    result = await db.execute(
        select(Integration).where(Integration.company_id == company.id)
    )
    integration = result.scalar_one_or_none()
    if not integration or not integration.llm_enabled:
        raise HTTPException(400, "LLM not configured. Configure it in Integrations first.")

    start = time.time()
    from app.services.rag import RAGService
    rag = RAGService(str(company.id), integration)
    answer, chunks, meeting_ids = await rag.query(request.question, top_k=request.top_k)
    latency = int((time.time() - start) * 1000)

    return TestQueryResponse(
        answer=answer,
        chunks_used=len(chunks),
        meetings_referenced=[str(m) for m in meeting_ids],
        latency_ms=latency,
    )


@router.get("/sample-payload")
async def get_sample_payload(company: Company = Depends(get_current_company)):
    return SAMPLE_PAYLOAD
