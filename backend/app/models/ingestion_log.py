import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import String, Text, DateTime, ForeignKey, func, Integer, Enum as SAEnum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class LogStatus(str, Enum):
    started = "started"
    success = "success"
    failed = "failed"
    skipped = "skipped"
    duplicate = "duplicate"


class IngestionLog(Base):
    __tablename__ = "ingestion_logs"
    __table_args__ = (
        Index("idx_logs_company", "company_id", "created_at"),
        Index("idx_logs_meeting", "meeting_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="SET NULL"), nullable=True
    )
    external_meeting_id: Mapped[str | None] = mapped_column(String(256))
    meeting_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meetings.id", ondelete="SET NULL"), nullable=True
    )
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[LogStatus] = mapped_column(
        SAEnum(LogStatus, name="log_status"), default=LogStatus.started
    )
    error_message: Mapped[str | None] = mapped_column(Text)
    payload_json: Mapped[dict | None] = mapped_column(JSONB)
    duration_ms: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="ingestion_logs")
    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="logs")
