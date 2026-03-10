-- Migration 003: Pages and Fields

CREATE TABLE form_pages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id     UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    title       TEXT,
    description TEXT,
    position    INT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (form_id, position)
);

CREATE INDEX idx_form_pages_form ON form_pages(form_id, position);

CREATE TYPE field_type AS ENUM (
    'short_text',
    'long_text',
    'multiple_choice',
    'multi_select',
    'dropdown',
    'yes_no',
    'rating',
    'opinion_scale',
    'number',
    'email',
    'phone',
    'url',
    'date',
    'file_upload',
    'picture_choice',
    'statement',
    'hidden'
);

CREATE TABLE form_fields (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id         UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    page_id         UUID NOT NULL REFERENCES form_pages(id) ON DELETE CASCADE,
    ref             TEXT NOT NULL,
    type            field_type NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    position        INT NOT NULL,
    is_required     BOOLEAN NOT NULL DEFAULT FALSE,

    -- Type-specific configuration
    config          JSONB NOT NULL DEFAULT '{}',
    /*
      short_text / long_text:
        { max_length: 500, placeholder: "..." }

      multiple_choice / multi_select / dropdown / picture_choice:
        { options: [ { id, label, image_url?, description? } ],
          randomize: bool, allow_other: bool, other_label: "Other..." }

      yes_no:
        { yes_label: "Yes", no_label: "No" }

      rating:
        { steps: 5, shape: "star"|"heart"|"thumb"|"number",
          start_label: "Not likely", end_label: "Extremely likely" }

      opinion_scale / NPS:
        { start: 0, end: 10, start_label: "...", end_label: "..." }

      number:
        { min: 0, max: 100, decimal_places: 2, prefix: "$", suffix: "%" }

      date:
        { format: "MM/DD/YYYY", min_date: "...", max_date: "...", include_time: bool }

      file_upload:
        { max_size_mb: 10, max_files: 1, allowed_types: ["image/*", "application/pdf"] }

      hidden:
        { default_value: "...", populate_from: "url_param_name" }

      statement:
        { button_label: "Continue", media: { type, url } }
    */

    -- Validation rules
    validation      JSONB NOT NULL DEFAULT '{}',
    /*
      { regex: "^[A-Z].*", regex_error_message: "...",
        min_length: 3, max_length: 200,
        min_value: 0, max_value: 100 }
    */

    -- Conditional visibility (show/hide based on prior answers)
    visibility_rule JSONB,
    /*
      { operator: "all"|"any",
        conditions: [
          { field_ref: "field_xyz", condition: "is"|"is_not"|"contains"|"gt"|"lt", value: "..." }
        ]
      }
    */

    -- Soft delete to preserve historical answer data
    deleted_at      TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (form_id, ref),
    UNIQUE (page_id, position)
);

CREATE INDEX idx_form_fields_form ON form_fields(form_id, position) WHERE deleted_at IS NULL;
CREATE INDEX idx_form_fields_type ON form_fields(form_id, type) WHERE deleted_at IS NULL;
CREATE INDEX idx_form_fields_config ON form_fields USING GIN (config);
