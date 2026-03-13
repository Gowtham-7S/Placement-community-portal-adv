# Project Knowledge Base

## 1. Project Overview
**Name:** Placement Intelligence & Interview Experience Portal
**Description:** A comprehensive community portal designed to bridge the gap between students, placement administration, and juniors. It facilitates the sharing of interview experiences, management of placement drives, and provision of data-driven insights for preparation.
**Core Roles:**
- **Admin:** Manages companies, drives, and approves submissions.
- **Student:** Applies to drives, submits interview experiences, and manages profile.
- **Junior:** Consumes analytics, company insights, and preparation roadmaps.

## 2. Tech Stack
**Backend:**
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (`pg` driver)
- **Authentication:** JWT (`jsonwebtoken`) + `bcryptjs`
- **Validation:** `express-validator`
- **Logging:** `winston`
- **Security:** `helmet`, `cors`

**Frontend:**
- **Framework:** React
- **HTTP Client:** Axios
- **Routing:** React Router (implied)

## 3. Architecture & Folder Structure (Target)
*Inferred standard MVC structure based on Express/Node stack:*
```
placement_com/
├── backend/
│   ├── src/
│   │   ├── config/         # DB and Env config
│   │   ├── controllers/    # Request logic (Auth, Admin, Student, Junior)
│   │   ├── middleware/     # authMiddleware, validationMiddleware
│   │   ├── routes/         # API definitions
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helper functions
│   └── server.js           # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI
│   │   ├── pages/          # Role-based views
│   │   └── services/       # API integration
└── docs/                   # Documentation
```

## 4. Authentication & Security
- **Mechanism:** Bearer Token (JWT).
- **Token Strategy:** Login returns `accessToken` and `refreshToken`.
- **Protected Routes:** Require `Authorization: Bearer <token>` header.
- **Role-Based Access Control (RBAC):** Middleware must enforce `admin`, `student`, or `junior` roles per endpoint.

## 5. Database Schema (Inferred from API)

### Users Table
- `id` (PK), `email` (Unique), `password_hash`, `role` (enum: admin, student, junior)
- `first_name`, `last_name`, `phone`, `department`, `batch_year`
- `profile_picture_url`, `bio`
- `created_at`

### Companies Table
- `id` (PK), `name`, `description`, `industry`, `website`, `logo_url`
- `headquarters`, `company_size`, `founded_year`, `total_employees`
- `created_at`

### Drives Table
- `id` (PK), `company_id` (FK), `role_name`, `role_description`
- `ctc_min`, `ctc_max`, `currency`
- `interview_date`, `registration_deadline`
- `total_positions`, `round_count`, `requirements`, `eligible_batches`
- `location`, `mode` (hybrid/remote/onsite)
- `drive_details` (JSONB: selection_criteria, interview_pattern)
- `status` (upcoming/ongoing/completed)

### Submissions (Experiences) Table
- `id` (PK), `user_id` (FK), `drive_id` (FK)
- `result` (pass/fail), `approval_status` (pending/approved/rejected)
- `offer_received` (bool), `ctc_offered`, `negotiated_ctc`
- `is_anonymous` (bool)
- `overall_difficulty`, `interview_duration`, `confidence_level`
- `overall_feedback`
- `rounds` (JSONB: Array of round details, questions, topics)
- `submitted_at`, `approved_at`, `approved_by` (FK)

## 6. API Feature Coverage

### Authentication
- `POST /auth/register`: Student registration.
- `POST /auth/login`: Credential verification.
- `POST /auth/logout`: Token invalidation.
- `GET /auth/me`: Current user context.

### Admin Module
- **Companies:** Full CRUD.
- **Drives:** Full CRUD.
- **Submissions:** View pending, Approve/Reject with comments.
- **Analytics:** Dashboard stats, PDF report generation.

### Student Module
- **Experiences:** Create (POST), View Own (GET), Update/Delete (if pending).
- **Drives:** View eligible drives.
- **Insights:** Company-specific stats.
- **Profile:** Update details.

### Junior Module
- **Discovery:** Search companies, Filter by skills/CTC.
- **Intelligence:** View interview patterns, success rates, topic frequency.
- **Roadmap:** Generated preparation guides based on company history.

## 7. Known Limitations & Gaps
1.  **Refresh Token Flow:** API returns `refreshToken` but defines no endpoint to use it.
2.  **Image Uploads:** No endpoint defined for uploading binary files; system expects pre-hosted URLs.
3.  **Password Reset:** No mechanism for forgotten passwords.
4.  **Batch Management:** No explicit table for managing valid batches/departments (currently string/int fields).

## 8. Design Decisions
- **JSONB Usage:** Complex interview round data and drive details are stored as JSON to allow flexibility in schema without altering table structure.
- **Approval Workflow:** Submissions require Admin approval before becoming visible to Juniors/Students.
- **Separation of Concerns:** Distinct endpoints for `student` (contributors) and `junior` (consumers) to enforce access patterns.

## 9. Future Roadmap (v2)
- Add `POST /auth/refresh-token`.
- Add `POST /common/upload`.
- Add Email/Notification service for drive updates.
```

<!--
[PROMPT_SUGGESTION]Generate the database schema SQL script (schema.sql) based on the knowledge.md file.[/PROMPT_SUGGESTION]
[PROMPT_SUGGESTION]Create the backend directory structure and the main server.js file.[/PROMPT_SUGGESTION]
