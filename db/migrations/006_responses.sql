-- Migration 006: Responses and Answers

CREATE TYPE response_status AS ENUM (
    'in_progress',
    'submitted',
    'partial'
);

CREATE TABLE form_responses (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id                 UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    session_token           TEXT NOT NULL UNIQUE,

    -- Respondent identity (if identifiable)
    respondent_user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    respondent_email        TEXT,
    respondent_name         TEXT,

    status                  response_status NOT NULL DEFAULT 'in_progress',
    landing_page_id         UUID REFERENCES form_pages(id),
    last_page_id            UUID REFERENCES form_pages(id),

    -- Request metadata
    ip_address              INET,
    user_agent              TEXT,
    referrer                TEXT,
    utm_source              TEXT,
    utm_medium              TEXT,
    utm_campaign            TEXT,

    -- Snapshots at submission time
    hidden_fields           JSONB,
    -- { "field_ref": "value", ... }
    variables_snapshot      JSONB,
    -- { "variable_name": computed_value, ... }

    -- Timing
    started_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at            TIMESTAMPTZ,
    time_to_complete_seconds INT,

    -- Spam
    is_spam                 BOOLEAN NOT NULL DEFAULT FALSE,
    spam_score              NUMERIC(4,2),

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_responses_form_status ON form_responses(form_id, status, submitted_at DESC);
CREATE INDEX idx_responses_form_submitted ON form_responses(form_id, submitted_at DESC)
    WHERE status = 'submitted';

-- One row per field per response
CREATE TABLE response_answers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
    field_id    UUID NOT NULL REFERENCES form_fields(id) ON DELETE RESTRICT,
    -- RESTRICT (not CASCADE): answers must outlive deleted fields (fields are soft-deleted)
    field_ref   TEXT NOT NULL,          -- denormalized: survives field edits
    field_type  field_type NOT NULL,    -- denormalized: avoids join for analytics

    value       JSONB,
    /*
      short_text / long_text / email / phone / url:  "answer string"
      number:                                         42
      yes_no:                                         true | false
      rating / opinion_scale:                         7
      multiple_choice / dropdown / picture_choice:    "option_id_abc"
      multi_select:                                   ["option_id_abc", "option_id_xyz"]
      date:                                           "2024-03-15"
      file_upload:  { files: [ { url, filename, size_bytes, mime_type } ] }
      statement / hidden:                             null
    */

    -- Scalar caches for fast filtering without JSONB parsing
    value_text      TEXT GENERATED ALWAYS AS (value #>> '{}') STORED,
    value_number    NUMERIC GENERATED ALWAYS AS (
                        CASE WHEN jsonb_typeof(value) = 'number'
                             THEN (value #>> '{}')::NUMERIC
                        END
                    ) STORED,

    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (response_id, field_id)
);

CREATE INDEX idx_answers_response ON response_answers(response_id);
CREATE INDEX idx_answers_field ON response_answers(field_id, field_type);
CREATE INDEX idx_answers_field_number ON response_answers(field_id, value_number)
    WHERE value_number IS NOT NULL;
CREATE INDEX idx_answers_text_search ON response_answers
    USING GIN (to_tsvector('english', value_text))
    WHERE value_text IS NOT NULL;

-- File upload tracking (lifecycle management separate from answers)
CREATE TABLE uploaded_files (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id     UUID REFERENCES form_responses(id) ON DELETE SET NULL,
    field_id        UUID REFERENCES form_fields(id) ON DELETE SET NULL,
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    original_filename   TEXT NOT NULL,
    storage_key         TEXT NOT NULL UNIQUE,
    storage_bucket      TEXT NOT NULL,
    mime_type           TEXT NOT NULL,
    size_bytes          BIGINT NOT NULL,
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Back-patch FK on webhook_deliveries now that form_responses exists
ALTER TABLE webhook_deliveries
    ADD CONSTRAINT fk_delivery_response
    FOREIGN KEY (response_id) REFERENCES form_responses(id) ON DELETE SET NULL;
