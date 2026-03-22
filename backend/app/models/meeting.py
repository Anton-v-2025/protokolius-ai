import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import String, Text, DateTime, ForeignKey, func, Integer, Enum as SAEnum, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class MeetingStatus(str, Enum):
    received = "received"
    processing = "processing"
    normalized = "normalized"
    drive_saved = "drive_saved"
    indexed = "indexed"
    completed = "completed"
    failed = "failed"
    skipped = "skipped"


class Meeting(Base):
    __tablename__ = "meetings"
    __table_args__ = (
        UniqueConstraint("company_id", "external_meeting_id", "version", name="uq_meeting_external_version"),
        Index("idx_meetings_company_date", "company_id", "meeting_date"),
        Index("idx_meetings_status", "company_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    external_meeting_id: Mapped[str] = mapped_column(String(256), nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    meeting_title: Mapped[str | None] = mapped_column(String(512))
    meeting_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    duration_seconds: Mapped[int | None] = mapped_column(Integer)

    transcript_full: Mapped[str | None] = mapped_column(Text)
    meeting_notes_full: Mapped[str | None] = mapped_column(Text)
    summary: Mapped[str | None] = mapped_column(Text)
    action_items_json: Mapped[list] = mapped_column(JSONB, default=list)
    participants_json: Mapped[list] = mapped_column(JSONB, default=list)

    normalized_json: Mapped[dict | None] = mapped_column(JSONB)
    source_payload_json: Mapped[dict | None] = mapped_column(JSONB)

    drive_file_id: Mapped[str | None] = mapped_column(String(256))
    drive_file_url: Mapped[str | None] = mapped_column(String(1024))
    drive_path: Mapped[str | None] = mapped_column(String(512))

    status: Mapped[MeetingStatus] = mapped_column(
        SAEnum(MeetingStatus, name="meeting_status"), default=MeetingStatus.received
    )
    error_message: Mapped[str | None] = mapped_column(Text)

    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="meetings")
    chunks: Mapped[list["MeetingChunk"]] = relationship(
        "MeetingChunk", back_populates="meeting", cascade="all, delete-orphan"
    )
    logs: Mapped[list["IngestionLog"]] = relationship("IngestionLog", back_populates="meeting")
