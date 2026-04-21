-- Migration: add batch support for company management
-- Safe to run multiple times.

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS batch VARCHAR(9);

UPDATE companies
SET batch = '2023-2027'
WHERE batch IS NULL;

ALTER TABLE companies
  ALTER COLUMN batch SET NOT NULL;

ALTER TABLE companies
  DROP CONSTRAINT IF EXISTS companies_name_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'companies_name_batch_unique'
  ) THEN
    ALTER TABLE companies
      ADD CONSTRAINT companies_name_batch_unique UNIQUE (name, batch);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_companies_batch ON companies(batch);

CREATE TABLE IF NOT EXISTS company_batches (
  id SERIAL PRIMARY KEY,
  batch VARCHAR(9) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_company_batches_batch ON company_batches(batch);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_company_batches_update') THEN
    CREATE TRIGGER trg_company_batches_update
    BEFORE UPDATE ON company_batches
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
END $$;

INSERT INTO company_batches (batch)
SELECT DISTINCT batch
FROM companies
WHERE batch IS NOT NULL
ON CONFLICT (batch) DO NOTHING;
