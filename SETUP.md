# 🚀 SETUP & INSTALLATION GUIDE

## Prerequisites

Before you start, ensure you have the following installed:

### Required Software

- **Node.js** v18.x or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 14 or higher ([Download](https://www.postgresql.org/download/))
- **Git** for version control ([Download](https://git-scm.com/))
- **npm** (comes with Node.js)

### Recommended Tools

- **Visual Studio Code** or any modern code editor
- **pgAdmin** or **DBeaver** for database management
- **Postman** or **Insomnia** for API testing
- **psql** command-line tool (comes with PostgreSQL)

---

## Project Setup Steps

### Step 1: Clone/Initialize Project

```bash
# Navigate to project directory
cd Placement_community_portal

# Initialize git (if not already done)
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

---

### Step 2: Database Setup

#### 2.1 Create PostgreSQL Database

```sql
-- Open PostgreSQL Command Line (psql) or pgAdmin

-- Create database
CREATE DATABASE placement_portal_db;

-- Connect to the database
\c placement_portal_db

-- Verify
\l
```

#### 2.2 Create Database Tables

Execute the SQL scripts below in order. Use PostgreSQL syntax:

```sql
-- 1. USERS TABLE
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
  profile_picture_url VARCHAR(255),
  bio TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_role ON users(role);
CREATE INDEX idx_created_at ON users(created_at);

-- 2. COMPANIES TABLE
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_name ON companies(name);
CREATE INDEX idx_industry ON companies(industry);
CREATE INDEX idx_created_at ON companies(created_at);

  INDEX idx_name (name),
  INDEX idx_industry (industry),
  INDEX idx_created_at (created_at)
);

-- 3. DRIVES TABLE
CREATE TABLE drives (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_id INT NOT NULL,
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
  drive_status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
  requirements TEXT,
  eligible_batches VARCHAR(100),
  location VARCHAR(255),
  mode ENUM('online', 'offline', 'hybrid') DEFAULT 'online',
  drive_details JSON,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_company_id (company_id),
  INDEX idx_interview_date (interview_date),
  INDEX idx_drive_status (drive_status)
);

-- 4. EXPERIENCES TABLE
CREATE TABLE experiences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  drive_id INT NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  role_applied VARCHAR(100) NOT NULL,
  
  result ENUM('pass', 'fail', 'not_sure') NOT NULL,
  selected BOOLEAN,
  offer_received BOOLEAN,
  ctc_offered DECIMAL(10, 2),
  negotiated_ctc DECIMAL(10, 2),
  
  is_anonymous BOOLEAN DEFAULT FALSE,
  approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  approved_by INT,
  rejection_reason TEXT,
  admin_comments TEXT,
  
  interview_duration INT,
  overall_difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  overall_feedback TEXT,
  confidence_level INT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (drive_id) REFERENCES drives(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_drive_id (drive_id),
  INDEX idx_approval_status (approval_status),
  INDEX idx_submitted_at (submitted_at),
  INDEX idx_company_name (company_name)
);

-- 5. ROUNDS TABLE
CREATE TABLE rounds (
  id INT PRIMARY KEY AUTO_INCREMENT,
  experience_id INT NOT NULL,
  round_number INT NOT NULL,
  round_type ENUM('HR', 'Technical', 'Coding', 'Managerial', 'Group_Discussion', 'Other') NOT NULL,
  
  duration_minutes INT,
  result ENUM('pass', 'fail', 'not_evaluated') DEFAULT 'not_evaluated',
  round_date DATETIME,
  
  topics JSON,
  questions JSON,
  difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  
  problem_statement TEXT,
  approach_used TEXT,
  code_snippet LONGTEXT,
  test_cases_passed INT,
  test_cases_total INT,
  
  tips_and_insights TEXT,
  common_mistakes TEXT,
  interviewer_feedback TEXT,
  interviewer_name VARCHAR(100),
  
  skills_tested JSON,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (experience_id) REFERENCES experiences(id) ON DELETE CASCADE,
  INDEX idx_experience_id (experience_id),
  INDEX idx_round_type (round_type),
  INDEX idx_difficulty_level (difficulty_level),
  UNIQUE KEY unique_experience_round (experience_id, round_number)
);

-- 6. QUESTIONS TABLE
CREATE TABLE questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  round_id INT NOT NULL,
  question_text TEXT NOT NULL,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  
  answer_provided TEXT,
  answer_quality ENUM('excellent', 'good', 'average', 'poor') DEFAULT 'good',
  
  is_common BOOLEAN,
  frequency_count INT DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
  INDEX idx_round_id (round_id),
  INDEX idx_category (category),
  INDEX idx_difficulty (difficulty)
);

-- 7. APPROVALS TABLE
CREATE TABLE approvals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  experience_id INT NOT NULL UNIQUE,
  admin_id INT NOT NULL,
  
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approval_reason TEXT,
  rejection_reason TEXT,
  admin_comments TEXT,
  
  data_completeness_score DECIMAL(3, 2),
  data_consistency_issues INT,
  verification_status ENUM('verified', 'unverified', 'flagged') DEFAULT 'unverified',
  
  submitted_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  approved_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (experience_id) REFERENCES experiences(id),
  FOREIGN KEY (admin_id) REFERENCES users(id),
  INDEX idx_experience_id (experience_id),
  INDEX idx_admin_id (admin_id),
  INDEX idx_status (status),
  INDEX idx_reviewed_at (reviewed_at)
);

-- 8. ANALYTICS_CACHE TABLE
CREATE TABLE analytics_cache (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  company_id INT,
  drive_id INT,
  date_period DATE,
  
  topic_name VARCHAR(255),
  topic_frequency INT,
  topic_difficulty_avg DECIMAL(3, 2),
  topic_success_rate DECIMAL(5, 2),
  
  round_type VARCHAR(50),
  avg_rounds_per_experience DECIMAL(5, 2),
  round_type_frequency INT,
  round_difficulty_distribution JSON,
  
  skill_name VARCHAR(255),
  skill_frequency INT,
  skill_difficulty ENUM('easy', 'medium', 'hard'),
  
  total_experiences INT,
  approved_experiences INT,
  approval_rate DECIMAL(5, 2),
  avg_ctc DECIMAL(10, 2),
  min_ctc DECIMAL(10, 2),
  max_ctc DECIMAL(10, 2),
  success_rate DECIMAL(5, 2),
  avg_interview_duration INT,
  
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (drive_id) REFERENCES drives(id),
  INDEX idx_company_id (company_id),
  INDEX idx_topic_name (topic_name),
  INDEX idx_skill_name (skill_name),
  INDEX idx_cached_at (cached_at),
  INDEX idx_expires_at (expires_at)
);

-- 9. TOPICS_MASTER TABLE
CREATE TABLE topics_master (
  id INT PRIMARY KEY AUTO_INCREMENT,
  topic_name VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100),
  description TEXT,
  difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'intermediate',
  
  frequency_count INT DEFAULT 0,
  success_rate DECIMAL(5, 2),
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_category (category),
  INDEX idx_topic_name (topic_name)
);

-- 10. SKILLS_MASTER TABLE
CREATE TABLE skills_master (
  id INT PRIMARY KEY AUTO_INCREMENT,
  skill_name VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100),
  description TEXT,
  skill_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'intermediate',
  
  frequency_count INT DEFAULT 0,
  priority_level ENUM('critical', 'important', 'nice_to_have') DEFAULT 'important',
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_category (category),
  INDEX idx_skill_name (skill_name),
  INDEX idx_priority_level (priority_level)
);

-- Verify tables created
SHOW TABLES;
```

---

### Step 3: Backend Setup

#### 3.1 Initialize Backend Project

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

#### 3.2 Configure Backend (.env file)

Create/edit `backend/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
APP_NAME=Placement Portal API

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=placement_portal_db

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRE=30m

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@placement-portal.com

# Analytics Configuration
ANALYTICS_CACHE_TTL=3600
ANALYTICS_UPDATE_INTERVAL=1800

# Logging
LOG_LEVEL=debug
LOG_DIR=./logs

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Session
SESSION_SECRET=your-session-secret

# Bcrypt
BCRYPT_SALT_ROUNDS=10
```

#### 3.3 Generate JWT Keys (RS256)

```bash
# Create keys directory
mkdir -p backend/keys

# Generate private key
openssl genrsa -out backend/keys/private.key 2048

# Generate public key from private key
openssl rsa -in backend/keys/private.key -pubout -out backend/keys/public.key

# Verify keys
ls -la backend/keys/
```

#### 3.4 Install Backend Dependencies

```bash
cd backend

# Core dependencies
npm install express cors dotenv

# Database
npm install mysql2 sequelize

# Authentication
npm install jsonwebtoken bcryptjs

# Validation
npm install joi

# Middleware
npm install helmet express-rate-limit

# Logging
npm install winston

# Utilities
npm install axios nodemailer

# Development dependencies
npm install --save-dev nodemon
```

#### 3.5 Package.json Scripts

Add scripts to `backend/package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "seed": "node scripts/seed.js"
  }
}
```

---

### Step 4: Frontend Setup

#### 4.1 Initialize React Project

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

#### 4.2 Configure Frontend (.env file)

Create/edit `frontend/.env`:

```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_API_TIMEOUT=10000

# App Configuration
REACT_APP_NAME=Placement Portal
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=development

# Features
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_ROADMAP=true

# Google Analytics (Optional)
REACT_APP_GA_ID=

# Sentry Error Tracking (Optional)
REACT_APP_SENTRY_DSN=
```

#### 4.3 Install Frontend Dependencies

```bash
cd frontend

# Core
npm install react react-dom react-router-dom

# State Management
npm install context-api (built-in) or npm install zustand

# API Calls
npm install axios

# Charts
npm install recharts chart.js react-chartjs-2

# Form Handling
npm install react-hook-form

# UI Components
npm install react-icons

# Notifications
npm install react-toastify

# Utilities
npm install moment lodash

# Development
npm install --save-dev tailwindcss postcss autoprefixer
```

#### 4.4 Setup Tailwind CSS (Optional but Recommended)

```bash
cd frontend

# Initialize tailwind
npx tailwindcss init -p

# Configure tailwind.config.js
# Add content paths for auto-detection
```

---

## Running the Application

### Option 1: Run Backend and Frontend Separately

#### Terminal 1: Start Backend

```bash
cd backend
npm run dev

# Expected output:
# ✓ Server running on port 5000
# ✓ Database connected
# ✓ Ready for requests
```

#### Terminal 2: Start Frontend

```bash
cd frontend
npm start

# Expected output:
# Compiled successfully!
# You can now view placement-portal in the browser.
# Local: http://localhost:3000
```

---

### Option 2: Run with Concurrently (Both Together)

```bash
# From root directory, install concurrently
npm install -g concurrently

# Create root package.json if not exists
# Add script:
{
  "scripts": {
    "dev": "concurrently \"cd backend && npm run dev\" \"cd frontend && npm start\""
  }
}

# Run
npm run dev
```

---

## Verification Checklist

- [ ] MySQL database created and tables created
- [ ] Backend .env file configured correctly
- [ ] Frontend .env file configured correctly
- [ ] JWT keys generated in `backend/keys/`
- [ ] All npm dependencies installed
- [ ] Backend server running on http://localhost:5000
- [ ] Frontend application running on http://localhost:3000
- [ ] Can access API endpoints via Postman
- [ ] Database connection successful

---

## First-Time Setup Test

### 1. Test Database Connection

```bash
# In backend directory
node -e "const mysql = require('mysql2'); const conn = mysql.createConnection({host: 'localhost', user: 'root', password: 'your_password', database: 'placement_portal_db'}); conn.connect(err => { if(err) console.error('DB Error:', err); else console.log('DB Connected!'); conn.end(); });"
```

### 2. Test Backend Server

```bash
curl http://localhost:5000/api/public/statistics
```

### 3. Test Frontend Build

```bash
cd frontend
npm run build
```

---

## Seeding Sample Data

### Create Seed Script (backend/scripts/seed.js)

```javascript
const connection = require('../config/database');

const seedData = async () => {
  try {
    // Insert companies
    const companies = [
      ['Google India', 'Search and advertising', 'https://google.com', 'Mountain View', 'Technology'],
      ['Microsoft India', 'Cloud and software', 'https://microsoft.com', 'Redmond', 'Technology'],
      ['Amazon India', 'E-commerce and cloud', 'https://amazon.com', 'Seattle', 'E-commerce'],
    ];

    for (const company of companies) {
      await connection.query('INSERT INTO companies (name, description, website, headquarters, industry) VALUES (?, ?, ?, ?, ?)', company);
    }

    console.log('✓ Sample data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
```

### Run Seed

```bash
cd backend
node scripts/seed.js
```

---

## Troubleshooting

### Issue: MySQL Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution:**
```bash
# Check if MySQL is running
# Windows: Services → MySQL80
# Mac: brew services list
# Linux: sudo systemctl status mysql
```

### Issue: Port Already in Use

```
Error: Port 5000 already in use
```

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Issue: Module Not Found

```
Error: Cannot find module 'express'
```

**Solution:**
```bash
# Reinstall node_modules
rm -rf node_modules package-lock.json
npm install
```

### Issue: JWT Token Error

```
Error: JsonWebTokenError: invalid signature
```

**Solution:**
- Regenerate JWT keys
- Check `.env` JWT_SECRET is correct
- Ensure private/public keys match

---

## Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make Changes**
   - Follow project structure
   - Update API endpoints doc
   - Write unit tests

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: describe your feature"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature
   ```

---

## Next Steps

1. ✅ Complete this setup guide
2. → Review [README.md](../README.md) for project overview
3. → Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
4. → Read [API_ENDPOINTS.md](./API_ENDPOINTS.md) for API documentation
5. → Start implementing backend features (Phase 2)

---

**Last Updated:** February 5, 2026  
**Status:** Production Ready
