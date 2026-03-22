# AI Meeting Knowledge SaaS

Production-ready multi-tenant SaaS that ingests meetings from Read AI, stores normalized JSON in Google Drive, builds a vector knowledge base, and exposes it via a Telegram bot.

## Quick Start

```bash
# 1. Clone and setup
cp .env.example .env

# 2. Generate security keys
python3 -c "import secrets; print('SECRET_KEY=' + secrets.token_hex(32))"
python3 -c "from cryptography.fernet import Fernet; print('FERNET_KEY=' + Fernet.generate_key().decode())"
# Paste these into .env

# 3. Start everything
make dev

# Services:
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000
# API Docs:  http://localhost:8000/docs
# Flower:    http://localhost:5555
```

## Architecture

```
Read AI Webhook → FastAPI → Celery Worker →
  ├── PostgreSQL + pgvector (meetings + embeddings)
  ├── Google Drive (normalized JSON files)
  └── Telegram Bot (RAG query interface)
```

## Stack

- **Frontend**: Next.js 15, Tailwind CSS, Framer Motion
- **Backend**: FastAPI, SQLAlchemy async, Celery
- **Database**: PostgreSQL 16 + pgvector (HNSW index)
- **AI**: LiteLLM (OpenAI / Anthropic / Gemini / custom)
- **Storage**: Google Drive API (OAuth2 or service account)
- **Bot**: python-telegram-bot v21

## Environment Variables

See `.env.example` for all required variables.

Key variables:
- `SECRET_KEY` — 64-char hex string
- `FERNET_KEY` — Fernet encryption key (for secrets at rest)
- `GOOGLE_CLIENT_ID/SECRET` — Google OAuth app credentials
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string

## API Documentation

After starting, visit `http://localhost:8000/docs` for the full interactive API reference.

## Webhook URL Format

```
POST https://your-domain.com/webhook/readai/{company_slug}
```

Configure this URL in Read AI → Settings → Webhooks.

## Running Tests

```bash
make test
```

## Deployment

Deploy to Railway/Render/Fly.io using the provided Dockerfiles. Set all environment variables in your platform's dashboard.

For production, set `APP_ENV=production` to disable API docs.
