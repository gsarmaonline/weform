package repository

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/gsarmaonline/weform/internal/domain"
)

type AnalyticsRepository struct {
	db *pgxpool.Pool
}

func NewAnalyticsRepository(db *pgxpool.Pool) *AnalyticsRepository {
	return &AnalyticsRepository{db: db}
}

type FormStats struct {
	TotalResponses     int      `json:"totalResponses"`
	CompletedResponses int      `json:"completedResponses"`
	CompletionRate     float64  `json:"completionRate"`
	AvgTimeSeconds     *float64 `json:"avgTimeSeconds"`
}

type FieldStat struct {
	FieldID   string          `json:"fieldId"`
	FieldRef  string          `json:"fieldRef"`
	FieldType domain.FieldType `json:"fieldType"`
	Title     string          `json:"title"`
	Position  int             `json:"position"`
	Responses int             `json:"responses"`
	// Distribution: for choice fields, map option label -> count
	// For numeric: array of {value, count}
	Distribution json.RawMessage `json:"distribution"`
}

// GetFormStats returns high-level form metrics.
func (r *AnalyticsRepository) GetFormStats(ctx context.Context, formID string) (*FormStats, error) {
	stats := &FormStats{}
	err := r.db.QueryRow(ctx, `
		SELECT
			COUNT(*)                                                         AS total,
			COUNT(*) FILTER (WHERE status = 'submitted')                     AS completed,
			COALESCE(
				COUNT(*) FILTER (WHERE status = 'submitted') * 100.0
				/ NULLIF(COUNT(*), 0), 0)                                    AS completion_rate,
			AVG(time_to_complete_seconds) FILTER (WHERE status = 'submitted') AS avg_time
		FROM form_responses
		WHERE form_id = $1
	`, formID).Scan(&stats.TotalResponses, &stats.CompletedResponses, &stats.CompletionRate, &stats.AvgTimeSeconds)
	return stats, err
}

// GetFieldStats returns per-question response counts and distributions.
func (r *AnalyticsRepository) GetFieldStats(ctx context.Context, formID string) ([]*FieldStat, error) {
	// Get all fields with their response counts
	rows, err := r.db.Query(ctx, `
		SELECT
			f.id, f.ref, f.type, f.title, f.position,
			COUNT(ra.id) AS response_count
		FROM form_fields f
		LEFT JOIN response_answers ra ON ra.field_id = f.id
		LEFT JOIN form_responses r ON r.id = ra.response_id AND r.status = 'submitted'
		WHERE f.form_id = $1 AND f.deleted_at IS NULL AND f.type != 'hidden' AND f.type != 'statement'
		GROUP BY f.id, f.ref, f.type, f.title, f.position
		ORDER BY f.position ASC
	`, formID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []*FieldStat
	for rows.Next() {
		s := &FieldStat{}
		if err := rows.Scan(&s.FieldID, &s.FieldRef, &s.FieldType, &s.Title, &s.Position, &s.Responses); err != nil {
			return nil, err
		}
		stats = append(stats, s)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// For each field, compute distribution
	for _, s := range stats {
		dist, err := r.getDistribution(ctx, s.FieldID, s.FieldType)
		if err != nil {
			return nil, err
		}
		s.Distribution = dist
	}

	return stats, nil
}

func (r *AnalyticsRepository) getDistribution(ctx context.Context, fieldID string, fieldType domain.FieldType) (json.RawMessage, error) {
	switch fieldType {
	case domain.FieldTypeMultiChoice, domain.FieldTypeDropdown, domain.FieldTypePictureChoice:
		// Single string value — count per option
		rows, err := r.db.Query(ctx, `
			SELECT ra.value #>> '{}' AS val, COUNT(*) AS cnt
			FROM response_answers ra
			JOIN form_responses r ON r.id = ra.response_id AND r.status = 'submitted'
			WHERE ra.field_id = $1 AND ra.value IS NOT NULL
			GROUP BY val ORDER BY cnt DESC
		`, fieldID)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		return scanKVDist(rows)

	case domain.FieldTypeMultiSelect:
		// Array of strings — unnest and count
		rows, err := r.db.Query(ctx, `
			SELECT elem AS val, COUNT(*) AS cnt
			FROM response_answers ra
			JOIN form_responses r ON r.id = ra.response_id AND r.status = 'submitted',
			LATERAL jsonb_array_elements_text(ra.value) AS elem
			WHERE ra.field_id = $1
			GROUP BY elem ORDER BY cnt DESC
		`, fieldID)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		return scanKVDist(rows)

	case domain.FieldTypeRating, domain.FieldTypeOpinionScale:
		// Numeric — count per value
		rows, err := r.db.Query(ctx, `
			SELECT ra.value_number AS val, COUNT(*) AS cnt
			FROM response_answers ra
			JOIN form_responses r ON r.id = ra.response_id AND r.status = 'submitted'
			WHERE ra.field_id = $1 AND ra.value_number IS NOT NULL
			GROUP BY val ORDER BY val ASC
		`, fieldID)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		type entry struct {
			Value float64 `json:"value"`
			Count int     `json:"count"`
		}
		var entries []entry
		for rows.Next() {
			var e entry
			if err := rows.Scan(&e.Value, &e.Count); err != nil {
				return nil, err
			}
			entries = append(entries, e)
		}
		return json.Marshal(entries)

	case domain.FieldTypeYesNo:
		rows, err := r.db.Query(ctx, `
			SELECT ra.value #>> '{}' AS val, COUNT(*) AS cnt
			FROM response_answers ra
			JOIN form_responses r ON r.id = ra.response_id AND r.status = 'submitted'
			WHERE ra.field_id = $1
			GROUP BY val
		`, fieldID)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		return scanKVDist(rows)

	default:
		return json.Marshal([]struct{}{})
	}
}

type kvEntry struct {
	Label string `json:"label"`
	Count int    `json:"count"`
}

func scanKVDist(rows interface{ Next() bool; Scan(...any) error; Err() error }) (json.RawMessage, error) {
	var entries []kvEntry
	for rows.Next() {
		var e kvEntry
		if err := rows.Scan(&e.Label, &e.Count); err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return json.Marshal(entries)
}

// ListResponses returns submitted responses with a page of answers.
type ResponseRow struct {
	ID                    string           `json:"id"`
	RespondentEmail       *string          `json:"respondentEmail"`
	SubmittedAt           *string          `json:"submittedAt"`
	TimeToCompleteSeconds *int             `json:"timeToCompleteSeconds"`
	Answers               []AnswerRow      `json:"answers"`
}

type AnswerRow struct {
	FieldRef  string          `json:"fieldRef"`
	FieldType domain.FieldType `json:"fieldType"`
	Value     json.RawMessage `json:"value"`
}

func (r *AnalyticsRepository) ListResponses(ctx context.Context, formID string, limit, offset int) ([]*ResponseRow, int, error) {
	// Total count
	var total int
	if err := r.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM form_responses WHERE form_id = $1 AND status = 'submitted'`, formID,
	).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(ctx, `
		SELECT id, respondent_email,
		       TO_CHAR(submitted_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
		       time_to_complete_seconds
		FROM form_responses
		WHERE form_id = $1 AND status = 'submitted'
		ORDER BY submitted_at DESC
		LIMIT $2 OFFSET $3
	`, formID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var responses []*ResponseRow
	for rows.Next() {
		rr := &ResponseRow{}
		if err := rows.Scan(&rr.ID, &rr.RespondentEmail, &rr.SubmittedAt, &rr.TimeToCompleteSeconds); err != nil {
			return nil, 0, err
		}
		responses = append(responses, rr)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	// Fetch answers for all responses in one query
	if len(responses) > 0 {
		ids := make([]string, len(responses))
		idx := make(map[string]*ResponseRow, len(responses))
		for i, rr := range responses {
			ids[i] = rr.ID
			idx[rr.ID] = rr
		}

		ansRows, err := r.db.Query(ctx, `
			SELECT response_id, field_ref, field_type, value
			FROM response_answers
			WHERE response_id = ANY($1)
			ORDER BY response_id, field_ref
		`, ids)
		if err != nil {
			return nil, 0, err
		}
		defer ansRows.Close()

		for ansRows.Next() {
			var responseID string
			var ans AnswerRow
			if err := ansRows.Scan(&responseID, &ans.FieldRef, &ans.FieldType, &ans.Value); err != nil {
				return nil, 0, err
			}
			if rr, ok := idx[responseID]; ok {
				rr.Answers = append(rr.Answers, ans)
			}
		}
	}

	return responses, total, nil
}
