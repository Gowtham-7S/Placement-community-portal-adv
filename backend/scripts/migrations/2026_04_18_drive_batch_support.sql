-- Migration: add batch support for drive management

CREATE TABLE IF NOT EXISTS drive_batches (
  id SERIAL PRIMARY KEY,
  batch VARCHAR(9) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_drive_batches_batch ON drive_batches(batch);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_drive_batches_update') THEN
    CREATE TRIGGER trg_drive_batches_update
    BEFORE UPDATE ON drive_batches
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
END $$;

INSERT INTO drive_batches (batch)
SELECT DISTINCT COALESCE(batch, eligible_batches)
FROM drives
WHERE COALESCE(batch, eligible_batches) IS NOT NULL
  AND COALESCE(batch, eligible_batches) ~ '^\d{4}-\d{4}$'
ON CONFLICT (batch) DO NOTHING;
