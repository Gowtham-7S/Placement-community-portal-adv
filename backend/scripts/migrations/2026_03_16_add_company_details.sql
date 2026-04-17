-- Migration: Add company detail fields and related tables
-- Safe to run multiple times.

-- Add columns to companies
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS parent_org VARCHAR(255),
  ADD COLUMN IF NOT EXISTS overall_description TEXT;

-- Company Job Role
CREATE TABLE IF NOT EXISTS company_job_roles (
  id SERIAL PRIMARY KEY,
  company_id INT NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255),
  eligibility TEXT,
  compensation VARCHAR(255),
  bonuses TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_company_job_roles_update') THEN
    CREATE TRIGGER trg_company_job_roles_update
    BEFORE UPDATE ON company_job_roles
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
END $$;

-- Company Internship
CREATE TABLE IF NOT EXISTS company_internships (
  id SERIAL PRIMARY KEY,
  company_id INT NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  duration VARCHAR(255),
  schedule VARCHAR(255),
  stipend VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_company_internships_update') THEN
    CREATE TRIGGER trg_company_internships_update
    BEFORE UPDATE ON company_internships
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
END $$;

-- Company Selection Process
CREATE TABLE IF NOT EXISTS company_selection_process (
  id SERIAL PRIMARY KEY,
  company_id INT NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  steps JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_company_selection_process_update') THEN
    CREATE TRIGGER trg_company_selection_process_update
    BEFORE UPDATE ON company_selection_process
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
END $$;

-- Company Locations
CREATE TABLE IF NOT EXISTS company_locations (
  id SERIAL PRIMARY KEY,
  company_id INT NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  city VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_company_locations_update') THEN
    CREATE TRIGGER trg_company_locations_update
    BEFORE UPDATE ON company_locations
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
  END IF;
END $$;
