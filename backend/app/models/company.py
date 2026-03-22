import uuid
import secrets
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    company_slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    api_key: Mapped[str] = mapped_column(
        String(128), unique=True, nullable=False, index=True,
        default=lambda: secrets.token_hex(32)
    )
    workspace_token: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=True, index=True,
        default=lambda: secrets.token_hex(12)
    )
    workspace_pin_hash: Mapped[str | None] = mapped_column(String(256), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    plan: Mapped[str] = mapped_column(String(50), default="trial")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    integration: Mapped["Integration"] = relationship(
        "Integration", back_populates="company", uselist=False, cascade="all, delete-orphan"
    )
    meetings: Mapped[list["Meeting"]] = relationship(
        "Meeting", back_populates="company", cascade="all, delete-orphan"
    )
    ingestion_logs: Mapped[list["IngestionLog"]] = relationship(
        "IngestionLog", back_populates="company"
    )
