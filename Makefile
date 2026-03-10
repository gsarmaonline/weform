.PHONY: build up down logs ps backend frontend

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

ps:
	docker compose ps

backend:
	docker compose build backend && docker compose up -d backend

frontend:
	docker compose build frontend && docker compose up -d frontend
