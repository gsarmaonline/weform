# weform

Weform is an opensource typeform alternative.

## Running locally

### With Docker (recommended)

**Prerequisites:** Docker + Docker Compose

```bash
# 1. Configure environment (one file for everything)
cp .env.example .env.local
# Fill in: JWT_SECRET, AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
# Generate secrets: openssl rand -base64 32

# 2. Build and start (Postgres + backend + frontend)
make build
make up

# 3. Verify
make ps
curl http://localhost:8080/health
```

Open `http://localhost:3000`.

```bash
make logs   # tail logs
make down   # stop containers
```

### Without Docker (native)

**Prerequisites:** Go 1.21+, Node.js 20+, PostgreSQL

```bash
# 1. Configure environment
cp .env.example .env.local
# Fill in the required values

# 2. Start both servers
make run-local
```

`make run-local` symlinks `.env.local` into `web/` so both the Go backend and Next.js frontend share the same config file.

## Elements

### Forms
- Welcome screen
- Thank you screen
- Theme / design settings (colors, fonts, backgrounds)
- Password protection
- Custom domain support
- Share link (public URL)
- Embed options (inline, popup, slider)
- QR code generation

### Pages
- Ordered sequence of questions
- Conditional logic — jump to page/question based on answers

### Input Boxes (Field Types)
- Short text
- Long text
- Multiple choice (single-select)
- Multiple choice (multi-select)
- Dropdown
- Yes / No
- Rating scale
- Opinion scale / NPS
- Number
- Email
- Phone
- URL
- Date picker
- File upload
- Picture choice
- Statement (non-input display block)
- Hidden field (pre-populated via URL params)

### Field Properties
- Required flag
- Validation rules (min/max, regex, etc.)
- Conditional visibility

### Workflows
- Email notification to form owner
- Auto-responder email to respondent
- Webhooks (POST response data to a URL, with retries)
- Integrations (Zapier, n8n, Google Sheets, Slack)

### Results
- Response list (individual submissions)
- Analytics dashboard (completion rate, drop-off, avg time)
- Per-question charts
- CSV / Excel export
- Response filtering and search

### Logic & Variables
- Branching / jump logic
- Calculations (compute scores from responses)
- Variables (store and reuse values across the form)

### Auth & Teams
- User accounts
- Workspaces / teams
- Roles (owner, editor, viewer)

### Infrastructure
- REST API for programmatic form management
- Rate limiting
- Spam protection (CAPTCHA, submission limits)

## Tech Stack

- **Backend**: Go + Gin
- **Frontend**: Next.js 15 (App Router), Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL (migrations in `db/migrations/`)
- **Auth**: Google OAuth via NextAuth.js + Go JWT

## Development

### Backend

```bash
# Copy and configure environment
cp .env.example .env

# Run the server
go run ./cmd/server
```

The server exposes `GET /health` to verify the API and database are reachable.

### Frontend

```bash
cd web
cp .env.local.example .env.local
# Fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AUTH_SECRET

npm install
npm run dev
```

The frontend runs on `http://localhost:3000`. Authentication uses Google OAuth only.
