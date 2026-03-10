-- Migration 007: Analytics

-- Pre-aggregated daily stats per form (refreshed by background job)
CREATE TABLE form_analytics_daily (
    form_id             UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    date                DATE NOT NULL,
    views               INT NOT NULL DEFAULT 0,
    starts              INT NOT NULL DEFAULT 0,
    completions         INT NOT NULL DEFAULT 0,
    partial_drops       INT NOT NULL DEFAULT 0,
    avg_time_seconds    NUMERIC(8,2),
    PRIMARY KEY (form_id, date)
);

-- Per-field drop-off (which question loses respondents)
CREATE TABLE form_field_analytics_daily (
    field_id    UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
    date        DATE NOT NULL,
    views       INT NOT NULL DEFAULT 0,
    answers     INT NOT NULL DEFAULT 0,
    drops       INT NOT NULL DEFAULT 0,
    PRIMARY KEY (field_id, date)
);

-- Raw view events (partition by month in production)
CREATE TABLE form_views (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id         UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    session_token   TEXT NOT NULL,
    ip_address      INET,
    referrer        TEXT,
    user_agent      TEXT,
    viewed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_form_views_form_time ON form_views(form_id, viewed_at DESC);

-- Row-level security: enforce tenant isolation at DB layer
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON form_responses
    USING (
        form_id IN (
            SELECT id FROM forms
            WHERE workspace_id = current_setting('app.workspace_id')::uuid
        )
    );
