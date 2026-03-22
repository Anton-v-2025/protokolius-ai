.PHONY: dev down migrate test seed logs shell-db build

dev:
	docker compose up --build

dev-bg:
	docker compose up --build -d

down:
	docker compose down

down-v:
	docker compose down -v

build:
	docker compose build

migrate:
	docker compose exec backend alembic upgrade head

seed:
	docker compose exec backend python -m scripts.seed_demo_data

test:
	docker compose exec backend pytest app/tests/ -v

test-fe:
	cd frontend && npm run test

logs:
	docker compose logs -f worker backend

logs-worker:
	docker compose logs -f worker

shell-db:
	docker compose exec postgres psql -U postgres meeting_kb

shell-backend:
	docker compose exec backend bash

gen-keys:
	@echo "SECRET_KEY=$$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
	@echo "FERNET_KEY=$$(python3 -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())')"

setup-env:
	cp .env.example .env
	@echo "✅ .env created. Edit it with your values."
	@echo "Run 'make gen-keys' to generate SECRET_KEY and FERNET_KEY"
