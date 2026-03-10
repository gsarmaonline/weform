.PHONY: build up down logs ps backend frontend run-local

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

run-local:
	@trap 'kill 0' SIGINT; \
	go run ./cmd/server & \
	cd web && npm run dev & \
	wait
