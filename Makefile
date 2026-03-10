.PHONY: build up down logs ps backend frontend run-local test test-ui

ENV_FILE ?= .env
DC = docker compose --env-file $(ENV_FILE)

build:
	$(DC) build

up:
	$(DC) up -d

down:
	$(DC) down

logs:
	$(DC) logs -f

ps:
	$(DC) ps

backend:
	$(DC) build backend && $(DC) up -d backend

frontend:
	$(DC) build frontend && $(DC) up -d frontend

test:
	cd web && npx playwright test --project=chromium

test-ui:
	cd web && npx playwright test --ui

run-local:
	@ln -sf ../.env web/.env
	@trap 'kill 0' SIGINT; \
	go run ./cmd/server & \
	cd web && npm run dev & \
	wait
