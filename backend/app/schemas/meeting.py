import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.meeting import MeetingStatus


class ActionItem(BaseModel):
    task: str
    owner: str | None = None
    due_date: str | None = None


class Participant(BaseModel):
    name: str
    email: str | None = None


class MeetingListItem(BaseModel):
    id: uuid.UUID
    meeting_title: str | None
    meeting_date: datetime | None
    status: MeetingStatus
    participants_count: int
    action_items_count: int
    drive_file_url: str | None
    ingested_at: datetime
    external_meeting_id: str
    version: int

    model_config = {"from_attributes": True}


class MeetingDetail(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    external_meeting_id: str
    version: int
    meeting_title: str | None
    meeting_date: datetime | None
    duration_seconds: int | None
    transcript_full: str | None
    meeting_notes_full: str | None
    summary: str | None
    action_items_json: list
    participants_json: list
    normalized_json: dict | None
    drive_file_id: str | None
    drive_file_url: str | None
    drive_path: str | None
    status: MeetingStatus
    error_message: str | None
    ingested_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class IngestionLogResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID | None
    external_meeting_id: str | None
    meeting_id: uuid.UUID | None
    event_type: str
    status: str
    error_message: str | None
    duration_ms: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TestQueryRequest(BaseModel):
    question: str
    top_k: int = 5


class TestQueryResponse(BaseModel):
    answer: str
    chunks_used: int
    meetings_referenced: list[str]
    latency_ms: int
