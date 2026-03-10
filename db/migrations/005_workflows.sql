-- Migration 005: Workflows and Webhook Deliveries

CREATE TYPE workflow_trigger AS ENUM (
    'on_submission',
    'on_completion',
    'on_partial',
    'on_condition'
);

CREATE TABLE form_workflows (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id     UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    is_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
    trigger     workflow_trigger NOT NULL DEFAULT 'on_submission',
    conditions  JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE workflow_action_type AS ENUM (
    'email_notification',
    'email_autoresponder',
    'webhook',
    'integration_zapier',
    'integration_n8n',
    'integration_google_sheets',
    'integration_slack'
);

CREATE TABLE workflow_actions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES form_workflows(id) ON DELETE CASCADE,
    type        workflow_action_type NOT NULL,
    position    INT NOT NULL DEFAULT 0,
    is_enabled  BOOLEAN NOT NULL DEFAULT TRUE,

    config      JSONB NOT NULL DEFAULT '{}',
    /*
      email_notification:
        { to: ["owner", "specific@email.com"],
          subject: "New response: {{form_title}}",
          include_response_data: true }

      email_autoresponder:
        { reply_to_field_ref: "email_field_ref",
          subject: "Thanks for filling out {{form_title}}",
          body_html: "..." }

      webhook:
        { url: "https://...", method: "POST",
          headers: { "Authorization": "Bearer ..." },
          secret: "...",
          retry_count: 3,
          retry_backoff: "exponential" }

      integration_google_sheets:
        { spreadsheet_id: "...", sheet_name: "Responses", credential_id: "..." }

      integration_slack:
        { webhook_url: "https://hooks.slack.com/...",
          channel: "#forms",
          message_template: "New response from {{field_name}}" }
    */

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Delivery log for webhooks (supports retry tracking and audit)
CREATE TABLE webhook_deliveries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_id       UUID NOT NULL REFERENCES workflow_actions(id) ON DELETE CASCADE,
    response_id     UUID,
    -- FK to form_responses added in migration 006 after that table exists
    attempt_number  INT NOT NULL DEFAULT 1,
    status          TEXT NOT NULL,
    -- 'pending' | 'success' | 'failed' | 'retrying'
    http_status     INT,
    request_body    JSONB,
    response_body   TEXT,
    duration_ms     INT,
    next_retry_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at)
    WHERE status = 'retrying';
