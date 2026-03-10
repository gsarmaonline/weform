-- Migration 002: Forms and Themes

CREATE TABLE form_themes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id            UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    -- NULL = system theme (visible to all workspaces)
    name                    TEXT NOT NULL,
    is_system               BOOLEAN NOT NULL DEFAULT FALSE,

    -- Typography
    font_family             TEXT NOT NULL DEFAULT 'Inter',
    font_size_base          INT NOT NULL DEFAULT 16,

    -- Colors
    color_background        TEXT NOT NULL DEFAULT '#FFFFFF',
    color_question          TEXT NOT NULL DEFAULT '#1A1A1A',
    color_answer            TEXT NOT NULL DEFAULT '#1A1A1A',
    color_button            TEXT NOT NULL DEFAULT '#0445AF',
    color_button_text       TEXT NOT NULL DEFAULT '#FFFFFF',
    color_progress          TEXT NOT NULL DEFAULT '#0445AF',
    color_error             TEXT NOT NULL DEFAULT '#F03000',

    -- Background
    background_image_url    TEXT,
    background_image_fit    TEXT DEFAULT 'cover',
    background_brightness   NUMERIC(3,2) DEFAULT 1.0,

    -- Layout
    show_progress_bar       BOOLEAN NOT NULL DEFAULT TRUE,
    show_question_numbers   BOOLEAN NOT NULL DEFAULT TRUE,
    button_style            TEXT NOT NULL DEFAULT 'rounded',

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE form_status AS ENUM ('draft', 'published', 'closed', 'archived');

CREATE TABLE forms (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id                UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_by                  UUID NOT NULL REFERENCES users(id),
    title                       TEXT NOT NULL,
    slug                        TEXT NOT NULL,
    status                      form_status NOT NULL DEFAULT 'draft',
    description                 TEXT,
    language                    TEXT NOT NULL DEFAULT 'en',

    -- Access control
    password_hash               TEXT,
    custom_domain               TEXT,
    is_indexed                  BOOLEAN NOT NULL DEFAULT FALSE,
    requires_login              BOOLEAN NOT NULL DEFAULT FALSE,
    captcha_enabled             BOOLEAN NOT NULL DEFAULT FALSE,

    -- Submission limits
    max_submissions             INT,
    close_on_date               TIMESTAMPTZ,

    -- Design
    theme_id                    UUID REFERENCES form_themes(id) ON DELETE SET NULL,

    -- Special screens (self-contained JSONB for rendering performance)
    welcome_screen              JSONB,
    -- { title, description, button_text, media: { type: 'image'|'video', url } }
    thank_you_screen            JSONB,
    -- { title, description, button_text, redirect_url, show_social_share }

    -- SEO / sharing
    meta_title                  TEXT,
    meta_description            TEXT,
    og_image_url                TEXT,

    -- Cached stats (refreshed asynchronously)
    cached_response_count       INT NOT NULL DEFAULT 0,
    cached_completion_rate      NUMERIC(5,2),

    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (workspace_id, slug)
);

CREATE INDEX idx_forms_workspace_status ON forms(workspace_id, status, updated_at DESC);

-- Form templates (system gallery + workspace-saved templates)
CREATE TABLE form_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    -- NULL = system template visible to all

    name            TEXT NOT NULL,
    description     TEXT,
    category        TEXT,
    thumbnail_url   TEXT,
    is_system       BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured     BOOLEAN NOT NULL DEFAULT FALSE,

    -- Full form structure snapshot, cloned on use
    -- Contains: { pages, fields, logic_rules, variables, theme_config }
    form_snapshot   JSONB NOT NULL,

    use_count       INT NOT NULL DEFAULT 0,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON form_templates(category, is_featured, use_count DESC)
    WHERE workspace_id IS NULL;
