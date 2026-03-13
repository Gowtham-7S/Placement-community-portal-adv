# Placement Community Portal — Project Flow Document

> **Purpose:** This document is the single source of truth for AI agents continuing work on this project.
> It covers architecture, what has been built, what is broken/missing, and exactly how to implement pending items.

---

## 1. Project Overview

**Stack:**
- **Frontend:** React (CRA), Material-UI + Tailwind CSS, Axios, React Router v6
- **Backend:** Node.js + Express, PostgreSQL (via `pg` pool), JWT auth, `express-validator`
- **Ports:** Backend → `5000`, Frontend → `3000` (proxy in `frontend/package.json`)

**User Roles:**
| Role | Description |
|---|---|
| `admin` | Manages companies, drives, approvals, analytics |
| `student` | Attended placement; submits interview experiences |
| `junior` | Has not yet attended placement; reads experiences/insights |

**Key Directories:**
```
placement_com/
  backend/
    config/          # constants.js, database.js
    controllers/     # AuthController, CompanyController, DriveController, ExperienceController, AnalyticsController
    middlewares/     # authMiddleware.js, roleMiddleware.js, validationMiddleware.js, errorHandler.js
    models/          # Company.js, Drive.js, Experience.js, Round.js, Question.js
    routes/          # adminRoutes.js, studentRoutes.js, juniorRoutes.js, publicRoutes.js
    services/        # AuthService.js, CompanyService.js, DriveService.js, ExperienceService.js, AnalyticsService.js
    utils/           # logger.js, queryUtils.js
    server.js
    setup_database.sql   # Full DB schema — always refer to this for column names
  frontend/
    src/
      api/           # axiosConfig.js, index.js (companyAPI, driveAPI, experienceAPI, etc.)
      components/
        Admin/       # AdminDashboard, CompanyManagement, DriveManagement (add/edit/delete), PendingApprovals, AdminAnalytics
        Student/     # StudentDashboard, SubmitExperience, MyExperiences (clickable), ExperienceDetail (full rounds+questions)
        Junior/      # JuniorDashboard, CompanyBrowser (full impl), PreparationRoadmap (stub)
        Auth/        # Login, Register
        Common/      # Shared UI components
        Layout/      # Navbar, Sidebar, etc.
      context/       # AuthContext
```

---

## 2. Database Schema Key Facts

> **CRITICAL:** Always refer to `backend/setup_database.sql` for actual column names before writing model SQL. Past bugs were caused by model/schema drift.

**`companies` table columns:** `id, name, description, website, headquarters, industry, company_size, founded_year, total_employees, is_active, created_at, updated_at`
- ❌ No `logo_url` column

**`drives` table columns:** `id, company_id, role_name, role_description, ctc, currency, interview_date, registration_deadline, total_positions, filled_positions, round_count, drive_status, requirements, eligible_batches, location, mode, created_at, updated_at`
- ❌ No `ctc_min`/`ctc_max` — only `ctc`
- ❌ No `created_by`, no `drive_details`
- `interview_date DATE NOT NULL`
- `drive_status` values: `'upcoming','ongoing','completed','cancelled'`

**`experiences` table columns:** `id, user_id, drive_id, company_name, role_applied, result, selected (GENERATED), offer_received, ctc_offered, is_anonymous, approval_status, submitted_at, approved_at, approved_by, rejection_reason, admin_comments, interview_duration, overall_difficulty, overall_feedback, confidence_level, created_at, updated_at`
- `result` values: `'pass','fail','not_sure'`
- `approval_status` values: `'pending','accepted','rejected'`
- `selected` is a **GENERATED column** — never INSERT or UPDATE it
- `confidence_level INT CHECK (confidence_level BETWEEN 1 AND 10)`

**`rounds` table columns:** `id, experience_id, round_number, round_type, duration_minutes, result, round_date, topics (JSONB), questions (JSONB), difficulty_level, problem_statement, approach_used, code_snippet, test_cases_passed, test_cases_total, tips_and_insights, common_mistakes, interviewer_feedback, interviewer_name, skills_tested (JSONB), created_at, updated_at`

---

## 3. Auth Pattern

- JWT signed as `{ id, role }` in `AuthController.js`
- `authMiddleware.js` sets `req.user = decoded` → use `req.user.id` and `req.user.role`
- ❌ **Never use `req.userId`** — it is always `undefined`
- `roleMiddleware('admin')` checks `req.user.role`

---

## 4. Error Handling Pattern

- `AppError` class is in `backend/middlewares/errorHandler.js` — import as `const { AppError } = require('../middlewares/errorHandler')`
- All service catch blocks: `if (error instanceof AppError) throw error;`
- `next(error)` in controllers sends to the global `errorHandler` middleware
- `AppError(message, statusCode, code)` — statusCode flows through to response

---

## 5. Completed Work ✅

### Backend
- [x] Server routing — all route files mounted in `server.js`
- [x] `authMiddleware.js` — exports `protect` as default for `router.use(authMiddleware)`
- [x] `errorHandler.js` — `AppError` class defined and exported
- [x] `Company` model — CRUD without `logo_url` (column doesn't exist)
- [x] `Drive` model — uses `ctc` (not `ctc_min`/`ctc_max`), removed `created_by`/`drive_details`
- [x] `Experience` model — correct columns, `selected` not inserted
- [x] `ExperienceService.submitExperience` — integer fields sanitized (`parseInt` with null fallback)
- [x] `ExperienceService` round mapping — all optional fields null-safe
- [x] `ExperienceService.approveSubmission` — forwards `approvedBy` + `comment`, guards double-processing
- [x] `ExperienceService.rejectSubmission` — forwards `approvedBy` + `reason`, guards double-processing
- [x] `DriveService.createDrive` — `AppError` guard added, removed non-existent `created_by` field
- [x] `validationMiddleware` — `confidence_level` range 1-10, `interview_date` required, `website` https-only, `logo_url` removed
- [x] `ExperienceController`, `DriveController` — `req.userId` → `req.user.id` fixed
- [x] `AnalyticsService` + `AnalyticsController` — dashboard stats endpoint working
- [x] `JuniorService.js` — company insights, experiences by company, public stats, trending topics; `getExperiencesByCompany` joins `questions` table per round
- [x] `JuniorController.js` — 4 endpoints wired
- [x] `juniorRoutes.js` — all 4 routes live
- [x] `publicRoutes.js` — `GET /companies` + `GET /statistics` implemented inline
- [x] `ExperienceService.getExperienceById` — upgraded to rich SQL join: returns full experience + rounds + questions from `questions` table (text, category, difficulty, answer, is_common)
- [x] `Company.findById` — removed non-existent `logo_url` column (was crashing drive create)

### Frontend
- [x] `CompanyManagement.jsx` — uses `companyAPI`, strips empty strings before submit, shows backend errors
- [x] `DriveManagement.jsx` — **Add Drive** modal with company dropdown; **Edit Drive** (pre-filled modal, PUT); **Delete Drive** (confirmation dialog, DELETE); edit/delete icons appear on card hover with `stopPropagation`
- [x] `SubmitExperience.jsx` — uses `experienceAPI`, sanitizes `drive_id`, `ctc_offered`, `confidence_level`
- [x] `AdminAnalytics.jsx` — real data from analytics endpoint
- [x] `PendingApprovals.jsx` — lists pending experiences
- [x] `CompanyBrowser.jsx` — full implementation: stats banner, company cards with selection rate/CTC, trending topics, experience detail with rounds + questions from `questions` table
- [x] `MyExperiences.jsx` — clickable cards with chevron; clicking shows `ExperienceDetail` inline with back button
- [x] `ExperienceDetail.jsx` — new component: approval status banner, admin note/rejection reason, stats row (result/CTC/duration/confidence), accordion rounds (topics, skills, questions with difficulty badges + collapsible answers, approach, interviewer feedback, tips)
- [x] `api/index.js` — `juniorAPI` added; `driveAPI.update` + `driveAPI.delete` confirmed present

---

## 6. Pending Work 🔧

### Remaining Items

#### P1 — PreparationRoadmap (Junior)
`frontend/src/components/Junior/PreparationRoadmap.jsx` is still a stub.
Could show trending topics + round types as a study guide for juniors.

#### P2 — Student Insights Endpoints
Add to `studentRoutes.js`:
- `GET /api/student/insights/company/:name` — patterns for a specific company
- `GET /api/student/insights/topics` — trending topics the student hasn't prepared

#### P3 — Experience Delete (Student)
`experienceAPI.delete(id)` exists in `api/index.js` but no backend route is wired.
To enable: add `DELETE /api/student/experience/:id` in `studentRoutes.js` and implement `ExperienceService.deleteExperience(userId, id)` with ownership check.

---

## 7. Frontend API Utility Reference

All API calls go through `frontend/src/api/index.js`. Use these — never use raw `fetch`.

```js
import { companyAPI, driveAPI, experienceAPI, approvalAPI, driveAPI } from '../../api';

companyAPI.getAll({ page, limit })         // GET /admin/companies
companyAPI.getById(id)                      // GET /admin/companies/:id
companyAPI.create(data)                     // POST /admin/companies
companyAPI.update(id, data)                 // PUT /admin/companies/:id
companyAPI.delete(id)                       // DELETE /admin/companies/:id

driveAPI.getAll({ status, company_id })     // GET /admin/drives
driveAPI.getById(id)                        // GET /admin/drives/:id
driveAPI.create(data)                       // POST /admin/drives
driveAPI.update(id, data)                   // PUT /admin/drives/:id

experienceAPI.submit(data)                  // POST /student/experience
experienceAPI.getMyExperiences()            // GET /student/experiences
experienceAPI.getById(id)                   // GET /student/experience/:id

approvalAPI.getPending()                    // GET /admin/submissions/pending
approvalAPI.approve(id, comment)            // POST /admin/submissions/:id/approve
approvalAPI.reject(id, reason)             // POST /admin/submissions/:id/reject
```

---

## 8. Common Pitfalls to Avoid

1. **Always use `req.user.id`** — never `req.userId` (authMiddleware sets `req.user`, not `req.userId`)
2. **`AppError instanceof` guard** in every service catch block — `if (error instanceof AppError) throw error;`
3. **Check `setup_database.sql`** before adding columns to model SQL — schema and models have drifted before
4. **`parseInt`/`parseFloat` with null fallback** for all numeric fields from request body:
   ```js
   someIntField: value ? parseInt(value) : null
   ```
5. **Strip empty strings** before API calls in frontend:
   ```js
   const payload = Object.fromEntries(Object.entries(formData).filter(([_, v]) => v !== '' && v !== null));
   ```
6. **`selected` is a GENERATED column** in `experiences` — never include it in INSERT/UPDATE
7. **`approval_status` values** in DB: `'pending'`, `'accepted'`, `'rejected'` (NOT `'approved'`)
