from fastapi import APIRouter
from .companies import router as companies_router
from .integrations import router as integrations_router
from .meetings import router as meetings_router
from .status import router as status_router
from .logs import router as logs_router
from .test import router as test_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(companies_router)
api_router.include_router(integrations_router)
api_router.include_router(meetings_router)
api_router.include_router(status_router)
api_router.include_router(logs_router)
api_router.include_router(test_router)
