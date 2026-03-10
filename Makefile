.PHONY: build up down logs ps backend frontend run-local test test-ui

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

test:
	cd web && npx playwright test --project=chromium

test-ui:
	cd web && npx playwright test --ui

run-local:
	@trap 'kill 0' SIGINT; \
	go run ./cmd/server & \
	cd web && npm run dev & \
	wait
