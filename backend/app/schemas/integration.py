import uuid
from datetime import datetime
from pydantic import BaseModel


class ReadAIUpdate(BaseModel):
    read_ai_webhook_secret: str | None = None
    read_ai_enabled: bool = True


class GoogleDriveUpdate(BaseModel):
    google_drive_folder_id: str | None = None
    google_credentials_json: dict | None = None


class LLMUpdate(BaseModel):
    llm_provider: str | None = None
    llm_model: str | None = None
    llm_api_key: str | None = None
    llm_base_url: str | None = None
    llm_embedding_model: str | None = None
    assistant_prompt: str | None = None


class TelegramUpdate(BaseModel):
    telegram_bot_token: str | None = None
    assistant_prompt: str | None = None


class IntegrationResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID

    read_ai_enabled: bool
    read_ai_webhook_secret: str | None = None

    google_drive_enabled: bool
    google_drive_folder_id: str | None = None

    llm_provider: str | None = None
    llm_model: str | None = None
    llm_api_key_masked: str | None = None
    llm_base_url: str | None = None
    llm_embedding_model: str | None = None
    assistant_prompt: str | None = None
    llm_enabled: bool

    telegram_bot_username: str | None = None
    telegram_enabled: bool

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class StatusCheck(BaseModel):
    service: str
    status: str  # "connected" | "warning" | "error" | "not_configured"
    message: str
    last_checked: datetime | None = None
