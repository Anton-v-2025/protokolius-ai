import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Company, Integration
from app.schemas import CompanyCreate, CompanyResponse, CompanyUpdate
from app.schemas.company import WorkspacePublicResponse, WorkspaceVerifyRequest, WorkspaceVerifyResponse
from app.config import settings

router = APIRouter(prefix="/companies", tags=["companies"])


def _build_response(company: Company, backend_url: str) -> CompanyResponse:
    resp = CompanyResponse.model_validate(company)
    resp.webhook_url = f"{backend_url}/webhook/readai/{company.company_slug}"
    return resp


@router.post("", response_model=CompanyResponse, status_code=201)
async def create_company(payload: CompanyCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(Company).where(Company.company_slug == payload.company_slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, f"Slug '{payload.company_slug}' is already taken")

    pin_hash = None
    if payload.pin:
        pin_hash = bcrypt.hashpw(payload.pin.encode(), bcrypt.gensalt()).decode()

    company = Company(
        company_name=payload.company_name,
        company_slug=payload.company_slug,
        workspace_pin_hash=pin_hash,
    )
    db.add(company)
    await db.flush()

    integration = Integration(company_id=company.id)
    db.add(integration)
    await db.commit()
    await db.refresh(company)

    return _build_response(company, settings.BACKEND_URL)


@router.get("/me", response_model=CompanyResponse)
async def get_company(
    company: Company = Depends(__import__("app.api.deps", fromlist=["get_current_company"]).get_current_company),
):
    from app.config import settings
    return _build_response(company, settings.BACKEND_URL)


@router.get("/workspace/{token}", response_model=WorkspacePublicResponse)
async def get_workspace_by_token(token: str, db: AsyncSession = Depends(get_db)):
    """Public — returns company name and whether PIN is required. Does NOT expose api_key."""
    result = await db.execute(
        select(Company).where(Company.workspace_token == token, Company.is_active == True)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(404, "Workspace not found")
    return WorkspacePublicResponse(
        company_name=company.company_name,
        has_pin=company.workspace_pin_hash is not None,
        workspace_token=token,
    )


@router.post("/workspace/{token}/verify", response_model=WorkspaceVerifyResponse)
async def verify_workspace_pin(
    token: str,
    payload: WorkspaceVerifyRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verify PIN → return api_key for dashboard access."""
    result = await db.execute(
        select(Company).where(Company.workspace_token == token, Company.is_active == True)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(404, "Workspace not found")

    if not company.workspace_pin_hash:
        return WorkspaceVerifyResponse(api_key=company.api_key, company_name=company.company_name)

    if not bcrypt.checkpw(payload.pin.encode(), company.workspace_pin_hash.encode()):
        raise HTTPException(401, "Неверный PIN")

    return WorkspaceVerifyResponse(api_key=company.api_key, company_name=company.company_name)


@router.patch("/me", response_model=CompanyResponse)
async def update_company(
    payload: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    company: Company = Depends(__import__("app.api.deps", fromlist=["get_current_company"]).get_current_company),
):
    if payload.company_name is not None:
        company.company_name = payload.company_name
    await db.commit()
    await db.refresh(company)
    return _build_response(company, settings.BACKEND_URL)
