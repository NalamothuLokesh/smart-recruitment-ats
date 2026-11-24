-- Keep withdrawn application history while allowing a new active application
-- for the same job. The nullable guard column is maintained by triggers.
ALTER TABLE applications
  ADD COLUMN active_candidate_id INT NULL;

UPDATE applications
SET active_candidate_id = CASE WHEN withdrawn_at IS NULL THEN candidate_id ELSE NULL END;

ALTER TABLE applications
  DROP INDEX uq_application_job_candidate,
  ADD UNIQUE INDEX uq_applications_active_job_candidate (job_id, active_candidate_id);

CREATE TRIGGER applications_set_active_candidate_before_insert
BEFORE INSERT ON applications
FOR EACH ROW
SET NEW.active_candidate_id = CASE WHEN NEW.withdrawn_at IS NULL THEN NEW.candidate_id ELSE NULL END;

CREATE TRIGGER applications_set_active_candidate_before_update
BEFORE UPDATE ON applications
FOR EACH ROW
SET NEW.active_candidate_id = CASE WHEN NEW.withdrawn_at IS NULL THEN NEW.candidate_id ELSE NULL END;
