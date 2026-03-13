CREATE TABLE IF NOT EXISTS drive_rounds (
  id SERIAL PRIMARY KEY,
  drive_id INT NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  round_name VARCHAR(100) NOT NULL,
  round_description TEXT,
  mode VARCHAR(20) 
    CHECK (mode IN ('online','offline')),
  expected_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(drive_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_drive_rounds_drive_id ON drive_rounds(drive_id);
CREATE INDEX IF NOT EXISTS idx_drive_rounds_expected_date ON drive_rounds(expected_date);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_drive_rounds_update') THEN
    CREATE TRIGGER trg_drive_rounds_update
    BEFORE UPDATE ON drive_rounds
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
END $$;
