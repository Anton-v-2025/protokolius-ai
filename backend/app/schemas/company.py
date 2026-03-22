import uuid
from datetime import datetime
from pydantic import BaseModel, field_validator
import re


class CompanyCreate(BaseModel):
    company_name: str
    company_slug: str
    pin: str | None = None  # 4-6 digits

    @field_validator("company_slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        v = v.lower().strip()
        if not re.match(r"^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$", v):
            raise ValueError("Slug must be 3-50 chars, lowercase letters, numbers and hyphens only")
        return v

    @field_validator("pin")
    @classmethod
    def validate_pin(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not re.match(r"^\d{4,6}$", v):
            raise ValueError("PIN must be 4-6 digits")
        return v


class CompanyUpdate(BaseModel):
    company_name: str | None = None


class CompanyResponse(BaseModel):
    id: uuid.UUID
    company_name: str
    company_slug: str
    api_key: str
    workspace_token: str | None = None
    is_active: bool
    plan: str
    webhook_url: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkspacePublicResponse(BaseModel):
    company_name: str
    has_pin: bool
    workspace_token: str


class WorkspaceVerifyRequest(BaseModel):
    pin: str


class WorkspaceVerifyResponse(BaseModel):
    api_key: str
    company_name: str
