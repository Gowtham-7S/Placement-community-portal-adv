# 🗄️ DATABASE SCHEMA DOCUMENTATION

## Overview

Complete database design for the Placement Intelligence & Interview Experience Portal using PostgreSQL 14+.

---

## 📊 DATABASE DIAGRAM

```
┌──────────────────┐         ┌──────────────────┐
│      users       │         │    companies     │
├──────────────────┤         ├──────────────────┤
│ PK: id           │         │ PK: id           │
│ email (UQ)       │         │ name (UQ)        │
│ password_hash    │         │ description      │
│ first_name       │         │ logo_url         │
│ last_name        │         │ website          │
│ role             │         │ headquarters     │
│ is_anonymous     │         │ created_at       │
│ created_at       │         │ updated_at       │
│ updated_at       │         └──────────────────┘
└──────────────────┘                 │
         │                           │ 1:many
         │ 1:many                    ↓
         │              ┌──────────────────────┐
         │              │      drives          │
         ├─────────────→├──────────────────────┤
         │              │ PK: id               │
         │              │ FK: company_id       │
         │              │ role_name            │
         │              │ ctc_min              │
         │              │ ctc_max              │
         │              │ interview_date       │
         │              │ drive_status         │
         │              │ created_at           │
         │              │ updated_at           │
         │              └──────────────────────┘
         │                        │
         │                        │ 1:many
         │                        ↓
         │              ┌──────────────────────┐
         │              │   experiences        │
         │              ├──────────────────────┤
         │              │ PK: id               │
         │              │ FK: user_id          │
         │              │ FK: drive_id         │
         │              │ company_name         │
         │              │ role_applied         │
         │              │ result (pass/fail)   │
         │              │ is_anonymous         │
         │              │ approval_status      │
         │              │ submitted_at         │
         │              │ approved_at          │
         │              │ approved_by          │
         │              │ rejection_reason     │
         │              │ created_at           │
         │              │ updated_at           │
         │              └──────────────────────┘
         │                        │
         │                        │ 1:many
         │                        ↓
         │              ┌──────────────────────┐
         │              │      rounds          │
         │              ├──────────────────────┤
         │              │ PK: id               │
         │              │ FK: experience_id    │
         │              │ round_number         │
         │              │ round_type           │
         │              │ duration_minutes     │
         │              │ result (pass/fail)   │
         │              │ topics (JSON)        │
         │              │ questions (JSON)     │
         │              │ difficulty_level     │
         │              │ tips_and_insights    │
         │              │ created_at           │
         │              └──────────────────────┘
         │                        │
         │                        │ 1:many
         │                        ↓
         │              ┌──────────────────────┐
         │              │      questions       │
         │              ├──────────────────────┤
         │              │ PK: id               │
         │              │ FK: round_id         │
         │              │ question_text        │
         │              │ category             │
         │              │ difficulty           │
         │              └──────────────────────┘
         │
         │ 1:many
         ↓
┌──────────────────────┐
│     approvals        │
├──────────────────────┤
│ PK: id               │
│ FK: experience_id    │
│ FK: admin_id         │
│ status               │
│ comment              │
│ created_at           │
│ updated_at           │
└──────────────────────┘
```

---

## 📋 TABLE DEFINITIONS

### 1. **USERS** - User Account Management

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'junior' CHECK (role IN ('admin', 'student', 'junior')),
  phone VARCHAR(20),
  department VARCHAR(100),
  batch_year INT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  register_number VARCHAR(50) UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CREATE INDEX idx_email ON users(email),
  CREATE INDEX idx_role ON users(role),
  CREATE INDEX idx_created_at ON users(created_at)
);
```

**Explanation:**
- `role` — RBAC: admin, student, junior
- `is_anonymous` — Can hide identity in public submissions
- `password_hash` — bcrypt hashed password
- `batch_year` — For filtering by student cohort
- `is_active` — Soft delete capability

---

### 2. **COMPANIES** - Company Information

```sql
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  logo_url VARCHAR(255),
  website VARCHAR(255),
  headquarters VARCHAR(255),
  industry VARCHAR(100),
  company_size VARCHAR(50),
  founded_year INT,
  total_employees INT,
  is_active BOOLEAN DEFAULT TRUE,
  
  CREATE INDEX idx_name ON companies(name),
  CREATE INDEX idx_industry ON companies(industry),
  CREATE INDEX idx_created_at ON companies(created_at)
);
```

**Explanation:**
- Stores company master data
- `industry` for categorization
- `company_size` for filtering
- Multiple drives can exist per company

---

### 3. **DRIVES** - Interview Drives

```sql
CREATE TABLE drives (
  id SERIAL PRIMARY KEY,
  company_id INT NOT NULL REFERENCES companies(id),
  role_name VARCHAR(100) NOT NULL,
  role_description TEXT,
  ctc_min DECIMAL(10, 2),
  ctc_max DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'INR',
  interview_date DATE NOT NULL,
  registration_deadline DATE,
  total_positions INT,
  filled_positions INT DEFAULT 0,
  round_count INT,
  drive_status VARCHAR(50) DEFAULT 'upcoming' CHECK (drive_status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  requirements TEXT,
  eligible_batches VARCHAR(100),
  location VARCHAR(255),
  mode VARCHAR(50) DEFAULT 'online' CHECK (mode IN ('online', 'offline', 'hybrid')),
  drive_details JSONB,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CREATE INDEX idx_company_id ON drives(company_id),
  CREATE INDEX idx_interview_date ON drives(interview_date),
  CREATE INDEX idx_drive_status ON drives(drive_status)
);
```

**Explanation:**
- Links companies with interview opportunities
- `drive_status` tracks lifecycle
- `ctc_min` and `ctc_max` for salary ranges
- `round_count` helps predict number of rounds
- `drive_details` (JSON) for flexible additional info

---

### 4. **EXPERIENCES** - Interview Submission Records

```sql
CREATE TABLE experiences (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  drive_id INT NOT NULL REFERENCES drives(id),
  company_name VARCHAR(255) NOT NULL,
  role_applied VARCHAR(100) NOT NULL,
  
  -- Interview Outcome
  result VARCHAR(50) NOT NULL CHECK (result IN ('pass', 'fail', 'not_sure')),
  selected BOOLEAN,
  offer_received BOOLEAN,
  ctc_offered DECIMAL(10, 2),
  negotiated_ctc DECIMAL(10, 2),
  
  -- Submission Details
  is_anonymous BOOLEAN DEFAULT FALSE,
  approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  approved_by INT REFERENCES users(id),
  rejection_reason TEXT,
  admin_comments TEXT,
  
  -- Metadata
  interview_duration INT,
  overall_difficulty VARCHAR(50) DEFAULT 'medium' CHECK (overall_difficulty IN ('easy', 'medium', 'hard')),
  overall_feedback TEXT,
  confidence_level INT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CREATE INDEX idx_user_id ON experiences(user_id),
  CREATE INDEX idx_drive_id ON experiences(drive_id),
  CREATE INDEX idx_approval_status ON experiences(approval_status),
  CREATE INDEX idx_submitted_at ON experiences(submitted_at),
  CREATE INDEX idx_company_name ON experiences(company_name)
);
```

**Explanation:**
- Core data source for analytics
- `approval_status` tracks workflow
- `is_anonymous` privacy control
- `result` tracks pass/fail outcome
- `confidence_level` for subjective metrics

---

### 5. **ROUNDS** - Interview Round Details

```sql
CREATE TABLE rounds (
  id SERIAL PRIMARY KEY,
  experience_id INT NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  round_type VARCHAR(50) NOT NULL CHECK (round_type IN ('HR', 'Technical', 'Coding', 'Managerial', 'Group_Discussion', 'Other')),
  
  -- Round Details
  duration_minutes INT,
  result VARCHAR(50) DEFAULT 'not_evaluated' CHECK (result IN ('pass', 'fail', 'not_evaluated')),
  round_date TIMESTAMP,
  
  -- Content
  topics JSONB,
  questions JSONB,
  difficulty_level VARCHAR(50) DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  
  -- Interview Content (Technical/Coding)
  problem_statement TEXT,
  approach_used TEXT,
  code_snippet TEXT,
  test_cases_passed INT,
  test_cases_total INT,
  
  -- Feedback & Tips
  tips_and_insights TEXT,
  common_mistakes TEXT,
  interviewer_feedback TEXT,
  interviewer_name VARCHAR(100),
  
  -- Skills Tested
  skills_tested JSONB,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(experience_id, round_number),
  CREATE INDEX idx_experience_id ON rounds(experience_id),
  CREATE INDEX idx_round_type ON rounds(round_type),
  CREATE INDEX idx_difficulty_level ON rounds(difficulty_level)
);
```

**Explanation:**
- Stores round-by-round interview details
- `round_type` categorizes interview stage
- `topics` and `questions` stored as JSON for flexibility
- Includes both objective (pass/fail) and subjective (feedback) data
- `skills_tested` drives analytics

---

### 6. **QUESTIONS** - Individual Questions Database

```sql
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  round_id INT NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  difficulty VARCHAR(50) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  
  -- Answer Details
  answer_provided TEXT,
  answer_quality VARCHAR(50) DEFAULT 'good' CHECK (answer_quality IN ('excellent', 'good', 'average', 'poor')),
  
  -- Metadata
  is_common BOOLEAN,
  frequency_count INT DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CREATE INDEX idx_round_id ON questions(round_id),
  CREATE INDEX idx_category ON questions(category),
  CREATE INDEX idx_difficulty ON questions(difficulty)
);
```

**Explanation:**
- Tracks individual questions for granular analysis
- `category` for topic frequency analysis
- `is_common` flags recurring questions
- Supports question-level analytics

---

### 7. **APPROVALS** - Approval Workflow Tracking

```sql
CREATE TABLE approvals (
  id SERIAL PRIMARY KEY,
  experience_id INT NOT NULL UNIQUE REFERENCES experiences(id),
  admin_id INT NOT NULL REFERENCES users(id),
  
  -- Approval Details
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approval_reason TEXT,
  rejection_reason TEXT,
  admin_comments TEXT,
  
  -- Data Quality Checks
  data_completeness_score DECIMAL(3, 2),
  data_consistency_issues INT,
  verification_status VARCHAR(50) DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'flagged')),
  
  -- Timeline
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  approved_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CREATE INDEX idx_experience_id ON approvals(experience_id),
  CREATE INDEX idx_admin_id ON approvals(admin_id),
  CREATE INDEX idx_status ON approvals(status),
  CREATE INDEX idx_reviewed_at ON approvals(reviewed_at)
);
```

**Explanation:**
- Tracks approval workflow for each submission
- `verification_status` ensures data quality
- `data_completeness_score` measures submission quality
- Audit trail for compliance

---

### 8. **ANALYTICS_CACHE** - Pre-computed Analytics

```sql
CREATE TABLE analytics_cache (
  id SERIAL PRIMARY KEY,
  
  -- Data Segmentation
  company_id INT REFERENCES companies(id),
  drive_id INT REFERENCES drives(id),
  date_period DATE,
  
  -- Topic Analytics
  topic_name VARCHAR(255),
  topic_frequency INT,
  topic_difficulty_avg DECIMAL(3, 2),
  topic_success_rate DECIMAL(5, 2),
  
  -- Round Analytics
  round_type VARCHAR(50),
  avg_rounds_per_experience DECIMAL(5, 2),
  round_type_frequency INT,
  round_difficulty_distribution JSONB,
  
  -- Skills Analytics
  skill_name VARCHAR(255),
  skill_frequency INT,
  skill_difficulty VARCHAR(50) CHECK (skill_difficulty IN ('easy', 'medium', 'hard')),
  
  -- Overall Metrics
  total_experiences INT,
  approved_experiences INT,
  approval_rate DECIMAL(5, 2),
  avg_ctc DECIMAL(10, 2),
  min_ctc DECIMAL(10, 2),
  max_ctc DECIMAL(10, 2),
  success_rate DECIMAL(5, 2),
  avg_interview_duration INT,
  
  -- Timestamps
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  
  CREATE INDEX idx_company_id ON analytics_cache(company_id),
  CREATE INDEX idx_topic_name ON analytics_cache(topic_name),
  CREATE INDEX idx_skill_name ON analytics_cache(skill_name),
  CREATE INDEX idx_cached_at ON analytics_cache(cached_at),
  CREATE INDEX idx_expires_at ON analytics_cache(expires_at)
);
```

**Explanation:**
- Stores pre-computed analytics for performance
- Reduces query time for dashboards
- `expires_at` for cache invalidation
- Separates analytics from transactional data

---

### 9. **TOPICS_MASTER** - Master List of Topics

```sql
CREATE TABLE topics_master (
  id SERIAL PRIMARY KEY,
  topic_name VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100),
  description TEXT,
  difficulty_level VARCHAR(50) DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  
  -- Metadata
  frequency_count INT DEFAULT 0,
  success_rate DECIMAL(5, 2),
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CREATE INDEX idx_category ON topics_master(category),
  CREATE INDEX idx_topic_name ON topics_master(topic_name)
);
```

**Explanation:**
- Master reference for topics
- Tracks topic popularity and success rates
- Supports roadmap generation

---

### 10. **SKILLS_MASTER** - Master List of Skills

```sql
CREATE TABLE skills_master (
  id SERIAL PRIMARY KEY,
  skill_name VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100),
  description TEXT,
  skill_level VARCHAR(50) DEFAULT 'intermediate' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  
  -- Metadata
  frequency_count INT DEFAULT 0,
  priority_level VARCHAR(50) DEFAULT 'important' CHECK (priority_level IN ('critical', 'important', 'nice_to_have')),
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CREATE INDEX idx_category ON skills_master(category),
  CREATE INDEX idx_skill_name ON skills_master(skill_name),
  CREATE INDEX idx_priority_level ON skills_master(priority_level)
);
```

**Explanation:**
- Master reference for skills
- Used for skill-based filtering and roadmap generation
- Priority levels for targeted preparation

---

## 🔑 KEY RELATIONSHIPS

### One-to-Many Relationships

1. **User → Experiences** (One user many submissions)
   - A student can submit multiple experience records
   - A junior never submits
   - An admin never submits

2. **Company → Drives** (One company many drives)
   - Each company can have multiple interview drives
   - Different roles and CTCs per drive

3. **Drive → Experiences** (One drive many experiences)
   - Each drive can have multiple students submitting experiences
   - Tracks which drive the experience is for

4. **Experience → Rounds** (One experience many rounds)
   - Each experience has multiple interview rounds
   - Cascade delete: if experience deleted, rounds deleted

5. **Round → Questions** (One round many questions)
   - Each round can have multiple questions asked
   - Cascade delete for data integrity

6. **User → Approvals** (Admin approves multiple submissions)
   - Admin can approve/reject many experiences

---

## 🔍 INDEXING STRATEGY

### High-Priority Indexes
```sql
-- Authentication
CREATE INDEX idx_users_email ON users(email);

-- Filtering & Search
CREATE INDEX idx_experiences_approval_status ON experiences(approval_status);
CREATE INDEX idx_experiences_submitted_at ON experiences(submitted_at);
CREATE INDEX idx_drives_company_id ON drives(company_id);
CREATE INDEX idx_rounds_experience_id ON rounds(experience_id);

-- Analytics Queries
CREATE INDEX idx_experiences_company_name ON experiences(company_name);
CREATE INDEX idx_rounds_round_type ON rounds(round_type);
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_analytics_cache_company_id ON analytics_cache(company_id);
CREATE INDEX idx_analytics_cache_topic_name ON analytics_cache(topic_name);
```

---

## 📊 DATA TYPES REFERENCE

| Type | Usage | Example |
|------|-------|---------|
| INT | IDs, counts | user_id, frequency_count |
| VARCHAR(255) | Names, emails | company_name, email |
| TEXT | Long content | feedback, description |
| LONGTEXT | Very long content | code_snippet |
| DECIMAL(10, 2) | Money values | ctc_offered |
| ENUM | Fixed choices | role, round_type |
| BOOLEAN | True/False | is_anonymous, is_active |
| JSON | Flexible arrays | topics, questions, skills |
| TIMESTAMP | Dates/Times | created_at, approved_at |
| DATE | Just dates | interview_date |
| DATETIME | Date + Time | round_date |

---

## 🔐 DATA PRIVACY & SECURITY

### Anonymous Submissions
- `is_anonymous` = TRUE in experiences table
- Public APIs hide user info if is_anonymous = TRUE
- Admin still sees actual user internally (audit trail)
- Analytics aggregated without user identification

### Data Retention
- Approved experiences: Permanent (unless manually deleted)
- Rejected experiences: Soft delete (still in DB, marked inactive)
- User deletion: Anonymize personal info, keep experience data

### Access Control
- Admins can see: All data including user identities
- Students can see: Only their own submissions and status
- Juniors can see: Only anonymized approved data

---

## 📈 SCALABILITY CONSIDERATIONS

### Current Capacity (Optimized)
- Supports ~100,000 users
- ~50,000 drives
- ~1,000,000 experiences
- ~5,000,000 rounds

### Future Optimization
- Partitioning by year for experiences
- Archive old data to separate tables
- Read replicas for analytics queries
- Cache layer (Redis) for hot analytics

---

## 🔄 SAMPLE DATA RELATIONSHIPS

### Example 1: Complete Flow
```
User (id: 1, role: student) 
  ↓ submits
Experience (id: 101, user_id: 1, drive_id: 5, approval_status: pending)
  ├─ approval_status changes to 'approved' by admin
  ├─ triggers analytics cache update
  └─ creates Rounds
      ├─ Round 1: HR (id: 201, round_number: 1, round_type: HR)
      │   └─ Questions: [SQL, HR prep, etc.]
      ├─ Round 2: Technical (id: 202, round_number: 2, round_type: Technical)
      │   └─ Questions: [DSA, DBMS, etc.]
      └─ Round 3: Coding (id: 203, round_number: 3, round_type: Coding)
          └─ Questions: [LeetCode problem, etc.]
```

### Example 2: Analytics Query
```
When Junior views Roadmap for Google:
1. Query approved experiences where company_id = Google
2. Aggregate topics from all rounds
3. Calculate frequency, difficulty distribution
4. Read from analytics_cache for performance
5. Generate preparation roadmap
```

---

## 📝 MIGRATION NOTES

### Initial Setup
1. Create all tables in order (foreign key dependencies)
2. Insert companies and roles master data
3. Create indexes for optimization
4. Setup triggers for audit trail (optional)

### Backup Strategy
- Daily full database backup
- Weekly incremental backups
- Test restore procedures monthly

---

**Database Version:** MySQL 8.0+  
**Last Updated:** February 5, 2026  
**Status:** Finalized
