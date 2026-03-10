-- Migration 004: Jump Logic and Variables

-- Page-level routing rules (evaluated top-to-bottom; first match wins)
CREATE TABLE form_logic_rules (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id             UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    source_page_id      UUID NOT NULL REFERENCES form_pages(id) ON DELETE CASCADE,
    position            INT NOT NULL,
    operator            TEXT NOT NULL DEFAULT 'all', -- 'all' (AND) | 'any' (OR)

    -- Destination: exactly one should be set
    destination_page_id UUID REFERENCES form_pages(id) ON DELETE SET NULL,
    destination_type    TEXT NOT NULL DEFAULT 'page',
    -- 'page' | 'thank_you' | 'url' | 'disqualify'
    destination_url     TEXT,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_logic_rules_page ON form_logic_rules(source_page_id, position);

-- Individual conditions within a rule
CREATE TABLE form_logic_conditions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id     UUID NOT NULL REFERENCES form_logic_rules(id) ON DELETE CASCADE,
    field_id    UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
    operator    TEXT NOT NULL,
    -- 'is' | 'is_not' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with'
    -- | 'gt' | 'gte' | 'lt' | 'lte' | 'is_empty' | 'is_not_empty'
    value       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_logic_conditions_rule ON form_logic_conditions(rule_id);

-- Variables for calculations and scoring
CREATE TYPE variable_type AS ENUM ('number', 'text');

CREATE TABLE form_variables (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id         UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    type            variable_type NOT NULL DEFAULT 'number',
    default_value   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (form_id, name)
);

-- Calculation rules: update a variable when a field is answered or at submission
CREATE TABLE form_calculations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id             UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    variable_id         UUID NOT NULL REFERENCES form_variables(id) ON DELETE CASCADE,
    trigger_field_id    UUID REFERENCES form_fields(id) ON DELETE SET NULL,
    -- NULL = evaluate at submission time
    expression          TEXT NOT NULL,
    -- e.g. "@score + field_abc * 2"
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
