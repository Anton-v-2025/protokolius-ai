from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.api.v1.router import api_router
from app.api.v1.webhook import router as webhook_router
from app.rate_limit import limiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — launch all configured Telegram bots
    from app.bot.manager import bot_manager
    try:
        await bot_manager.start()
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"BotManager startup failed: {e}")
    yield
    # Shutdown — gracefully stop all bots
    await bot_manager.stop()


app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(api_router)
app.include_router(webhook_router)


@app.get("/healthz")
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}


@app.get("/healthz/bots")
async def bots_health():
    from app.bot.manager import bot_manager
    return {"bots": bot_manager.get_status()}


@app.get("/")
async def root():
    return {"name": settings.APP_TITLE, "version": settings.APP_VERSION, "docs": "/docs"}
