-- ============================================================================
-- PLACEMENT INTELLIGENCE & INTERVIEW EXPERIENCE PORTAL DATABASE
-- Production Ready Schema
-- ============================================================================

-- CREATE DATABASE placement_portal;

-- ============================================================================
-- AUTO UPDATE TIMESTAMP FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'junior'
    CHECK (role IN ('admin', 'student', 'junior')),
  phone VARCHAR(20),
  department VARCHAR(100),
  batch_year INT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  register_number VARCHAR(50) UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE TRIGGER trg_users_update
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- 2. COMPANIES TABLE
-- ============================================================================
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  website VARCHAR(255) CHECK (website ~* '^https?://'),
  headquarters VARCHAR(255),
  industry VARCHAR(100),
  company_size VARCHAR(50),
  founded_year INT CHECK (founded_year > 1800),
  total_employees INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_industry ON companies(industry);

CREATE TRIGGER trg_companies_update
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- 3. DRIVES TABLE
-- ============================================================================
CREATE TABLE drives (
  id SERIAL PRIMARY KEY,
  company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role_name VARCHAR(100) NOT NULL,
  role_description TEXT,
  ctc DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'INR',
  interview_date DATE NOT NULL,
  registration_deadline DATE,
  total_positions INT CHECK (total_positions >= 0),
  filled_positions INT DEFAULT 0 CHECK (filled_positions >= 0),
  round_count INT,
  drive_status VARCHAR(50) DEFAULT 'upcoming'
    CHECK (drive_status IN ('upcoming','ongoing','completed','cancelled')),
  requirements TEXT,
  eligible_batches VARCHAR(100),
  location VARCHAR(255),
  mode VARCHAR(50) DEFAULT 'online'
    CHECK (mode IN ('online','offline','hybrid')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_drives_company_id ON drives(company_id);
CREATE INDEX idx_drives_interview_date ON drives(interview_date);
CREATE INDEX idx_drives_drive_status ON drives(drive_status);

CREATE TRIGGER trg_drives_update
BEFORE UPDATE ON drives
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- 3A. DRIVE ROUNDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS drive_rounds (
  id SERIAL PRIMARY KEY,
  drive_id INT NOT NULL REFERENCES drives(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  round_name VARCHAR(100) NOT NULL,
  round_description TEXT,
  mode VARCHAR(20) NOT NULL
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

-- ============================================================================
-- 4. EXPERIENCES TABLE
-- ============================================================================
CREATE TABLE experiences (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  drive_id INT REFERENCES drives(id) ON DELETE SET NULL,
  company_name VARCHAR(255) NOT NULL,
  role_applied VARCHAR(100) NOT NULL,

  result VARCHAR(50) NOT NULL CHECK (result IN ('pass','fail','not_sure')),
  selected BOOLEAN GENERATED ALWAYS AS (result = 'pass') STORED,
  offer_received BOOLEAN,
  ctc_offered DECIMAL(10,2),

  is_anonymous BOOLEAN DEFAULT FALSE,
  approval_status VARCHAR(50) DEFAULT 'pending'
    CHECK (approval_status IN ('pending','accepted','rejected')),

  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  approved_by INT REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  admin_comments TEXT,

  interview_duration INT,
  overall_difficulty VARCHAR(50) DEFAULT 'medium'
    CHECK (overall_difficulty IN ('easy','medium','hard')),
  overall_feedback TEXT,
  confidence_level INT CHECK (confidence_level BETWEEN 1 AND 10),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_experiences_user_id ON experiences(user_id);
CREATE INDEX idx_experiences_drive_id ON experiences(drive_id);
CREATE INDEX idx_experiences_result ON experiences(result);
CREATE INDEX idx_experiences_approval_status ON experiences(approval_status);

CREATE TRIGGER trg_experiences_update
BEFORE UPDATE ON experiences
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- 5. ROUNDS TABLE
-- ============================================================================
CREATE TABLE rounds (
  id SERIAL PRIMARY KEY,
  experience_id INT NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  round_type VARCHAR(50) NOT NULL
    CHECK (round_type IN ('HR','Technical','Coding','Managerial','Group_Discussion','Other')),
  duration_minutes INT,
  result VARCHAR(50) DEFAULT 'not_evaluated'
    CHECK (result IN ('pass','fail','not_evaluated')),
  round_date TIMESTAMP,
  topics JSONB,
  questions JSONB,
  difficulty_level VARCHAR(50) DEFAULT 'medium'
    CHECK (difficulty_level IN ('easy','medium','hard')),
  problem_statement TEXT,
  approach_used TEXT,
  code_snippet TEXT,
  test_cases_passed INT,
  test_cases_total INT,
  tips_and_insights TEXT,
  common_mistakes TEXT,
  interviewer_feedback TEXT,
  interviewer_name VARCHAR(100),
  skills_tested JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(experience_id, round_number)
);

CREATE INDEX idx_rounds_experience_id ON rounds(experience_id);
CREATE INDEX idx_rounds_round_type ON rounds(round_type);
CREATE INDEX idx_rounds_skills ON rounds USING GIN (skills_tested);
CREATE INDEX idx_rounds_topics ON rounds USING GIN (topics);

CREATE TRIGGER trg_rounds_update
BEFORE UPDATE ON rounds
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- 6. QUESTIONS TABLE
-- ============================================================================
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  round_id INT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  difficulty VARCHAR(50) DEFAULT 'medium'
    CHECK (difficulty IN ('easy','medium','hard')),
  answer_provided TEXT,
  answer_quality VARCHAR(50) DEFAULT 'good'
    CHECK (answer_quality IN ('excellent','good','average','poor')),
  is_common BOOLEAN,
  frequency_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questions_round_id ON questions(round_id);
CREATE INDEX idx_questions_category ON questions(category);

-- ============================================================================
-- 7. APPROVAL WORKFLOW
-- ============================================================================
CREATE TABLE approvals (
  id SERIAL PRIMARY KEY,
  experience_id INT NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  reviewed_by INT REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('accepted','rejected')),
  comments TEXT,
  reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. MASTER DATA TABLES
-- ============================================================================
CREATE TABLE topics_master (
  id SERIAL PRIMARY KEY,
  topic_name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100),
  description TEXT,
  difficulty_level VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE skills_master (
  id SERIAL PRIMARY KEY,
  skill_name VARCHAR(100) UNIQUE NOT NULL,
  skill_category VARCHAR(100),
  proficiency_levels VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. ANALYTICS CACHE
-- ============================================================================
CREATE TABLE analytics_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 10. EXPERIENCE ACCESS CONTROL
-- ============================================================================
CREATE TABLE experience_access_students (
  id SERIAL PRIMARY KEY,
  roll_number VARCHAR(50) UNIQUE,
  email VARCHAR(150),
  student_name VARCHAR(150),
  company_name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_experience_access_roll_number ON experience_access_students(roll_number);
CREATE UNIQUE INDEX idx_experience_access_email ON experience_access_students(email);

CREATE TRIGGER trg_experience_access_update
BEFORE UPDATE ON experience_access_students
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
