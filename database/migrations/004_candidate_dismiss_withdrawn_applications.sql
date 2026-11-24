-- Let candidates hide withdrawn applications from their dashboard while
-- retaining application and audit history for the hiring team.
ALTER TABLE applications
  ADD COLUMN dismissed_at TIMESTAMP NULL DEFAULT NULL,
  ADD INDEX idx_applications_candidate_dismissed (candidate_id, dismissed_at);
