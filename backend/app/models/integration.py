import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Integration(Base):
    __tablename__ = "integrations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # Read AI
    read_ai_webhook_secret: Mapped[str | None] = mapped_column(String(256))
    read_ai_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    # Google Drive
    google_drive_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    google_drive_folder_id: Mapped[str | None] = mapped_column(String(256))
    google_credentials_enc: Mapped[str | None] = mapped_column(Text)

    # LLM
    llm_provider: Mapped[str | None] = mapped_column(String(64))
    llm_model: Mapped[str | None] = mapped_column(String(128))
    llm_api_key_enc: Mapped[str | None] = mapped_column(Text)
    llm_base_url: Mapped[str | None] = mapped_column(String(512))
    llm_embedding_model: Mapped[str | None] = mapped_column(String(128), default="text-embedding-3-small")
    assistant_prompt: Mapped[str | None] = mapped_column(Text)
    llm_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    # Telegram
    telegram_bot_token_enc: Mapped[str | None] = mapped_column(Text)
    telegram_bot_username: Mapped[str | None] = mapped_column(String(128))
    telegram_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="integration")
