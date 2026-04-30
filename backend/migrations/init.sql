-- AI Meeting Knowledge SaaS — Initial Schema
-- Runs automatically in Docker via initdb.d

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── COMPANIES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name    TEXT NOT NULL,
    company_slug    TEXT NOT NULL UNIQUE,
    api_key         TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    workspace_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
    workspace_pin_hash VARCHAR(256),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    plan            TEXT NOT NULL DEFAULT 'trial',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(company_slug);
CREATE INDEX IF NOT EXISTS idx_companies_api_key ON companies(api_key);

-- ─── INTEGRATIONS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integrations (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id                  UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,

    read_ai_webhook_secret      TEXT,
    read_ai_enabled             BOOLEAN NOT NULL DEFAULT false,

    google_drive_enabled        BOOLEAN NOT NULL DEFAULT false,
    google_drive_folder_id      TEXT,
    google_credentials_enc      TEXT,

    llm_provider                TEXT,
    llm_model                   TEXT,
    llm_api_key_enc             TEXT,
    llm_base_url                TEXT,
    llm_embedding_model         TEXT DEFAULT 'text-embedding-3-small',
    assistant_prompt            TEXT,
    llm_enabled                 BOOLEAN NOT NULL DEFAULT false,

    telegram_bot_token_enc      TEXT,
    telegram_bot_username       TEXT,
    telegram_enabled            BOOLEAN NOT NULL DEFAULT false,

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── MEETINGS ────────────────────────────────────────────────────
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meeting_status') THEN
        CREATE TYPE meeting_status AS ENUM (
            'received', 'processing', 'normalized', 'drive_saved',
            'indexed', 'completed', 'failed', 'skipped'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS meetings (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id              UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    external_meeting_id     TEXT NOT NULL,
    version                 INTEGER NOT NULL DEFAULT 1,

    meeting_title           TEXT,
    meeting_date            TIMESTAMPTZ,
    duration_seconds        INTEGER,

    transcript_full         TEXT,
    meeting_notes_full      TEXT,
    summary                 TEXT,
    action_items_json       JSONB NOT NULL DEFAULT '[]',
    participants_json       JSONB NOT NULL DEFAULT '[]',

    normalized_json         JSONB,
    source_payload_json     JSONB,

    drive_file_id           TEXT,
    drive_file_url          TEXT,
    drive_path              TEXT,

    status                  meeting_status NOT NULL DEFAULT 'received',
    error_message           TEXT,

    ingested_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_meetings_external_version
    ON meetings(company_id, external_meeting_id, version);
CREATE INDEX IF NOT EXISTS idx_meetings_company_date
    ON meetings(company_id, meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_status
    ON meetings(company_id, status);

-- ─── MEETING CHUNKS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_chunks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    meeting_id      UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    chunk_index     INTEGER NOT NULL,
    chunk_type      TEXT NOT NULL,
    chunk_text      TEXT NOT NULL,
    embedding       VECTOR(1536),
    metadata_json   JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chunks_company_meeting
    ON meeting_chunks(company_id, meeting_id);

-- HNSW index for ANN (pgvector 0.5+)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
    ON meeting_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- ─── INGESTION LOGS ──────────────────────────────────────────────
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'log_status') THEN
        CREATE TYPE log_status AS ENUM (
            'started', 'success', 'failed', 'skipped', 'duplicate'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS ingestion_logs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id              UUID REFERENCES companies(id) ON DELETE SET NULL,
    external_meeting_id     TEXT,
    meeting_id              UUID REFERENCES meetings(id) ON DELETE SET NULL,
    event_type              TEXT NOT NULL,
    status                  log_status NOT NULL DEFAULT 'started',
    error_message           TEXT,
    payload_json            JSONB,
    duration_ms             INTEGER,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_company ON ingestion_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_meeting ON ingestion_logs(meeting_id);

-- ─── Auto-update updated_at ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_companies_updated_at ON companies;
CREATE TRIGGER trg_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_integrations_updated_at ON integrations;
CREATE TRIGGER trg_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_meetings_updated_at ON meetings;
CREATE TRIGGER trg_meetings_updated_at
    BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
