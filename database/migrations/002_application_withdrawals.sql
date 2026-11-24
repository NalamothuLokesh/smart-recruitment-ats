-- Preserve candidate applications and audit history when a candidate withdraws.
ALTER TABLE applications
  ADD COLUMN withdrawn_at TIMESTAMP NULL DEFAULT NULL AFTER applied_at;

CREATE INDEX idx_applications_withdrawn_at ON applications (withdrawn_at);
