-- Optionally retain a candidate's explanation alongside the withdrawal record.
ALTER TABLE applications
  ADD COLUMN withdrawal_reason VARCHAR(500) NULL;
