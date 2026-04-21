# Placement Community Portal - Full Project Summary

## 1. Overview

Placement Community Portal is a role-based platform that helps capture, review, analyze, and consume placement interview experiences. It connects three user groups in one system:

- `admin`
- `student`
- `junior`

The platform combines:

- structured experience collection
- admin moderation and approval
- company and drive management
- analytics and reporting
- junior-facing preparation insights

## 2. Architecture

### Frontend

- React
- React Router
- Material UI
- Tailwind CSS
- Axios

### Backend

- Node.js
- Express
- PostgreSQL
- JWT authentication
- `express-validator`

### Database

The main schema lives in:

- `backend/setup_database.sql`

The database includes user management, companies, drives, rounds, questions, experiences, access-control data, and batch support.

## 3. Portals

### Admin Portal

Implemented areas:

- company management
- drive management
- batch-wise company browsing
- batch-wise drive browsing
- pending approvals
- experience management
- analytics dashboard
- experience access management
- email utilities

### Student Portal

Implemented areas:

- authentication and protected routes
- submit experience flow
- round-wise interview details
- personal submissions list
- view, edit, and delete submitted experiences where supported

### Junior Portal

Implemented areas:

- company insights browser
- approved experience viewing
- batch-wise drive browsing
- drive detail view
- search and filtering

## 4. Major Functional Modules

### Authentication and RBAC

- login and registration
- JWT-based auth
- role-based route protection
- separate admin, student, and junior permissions

### Company Management

- create, update, view, and soft-delete companies
- company batches table and routing
- batch-wise filtering and navigation

### Drive Management

- create, update, view, and delete drives
- round-based drive scheduling
- batch-wise drive cards
- nullable add-drive form with improved UX
- synced `batch` and `eligible_batches` handling

### Experience Workflow

- structured experience submissions
- round and question capture
- admin review and approval flow
- approved experience consumption for juniors

### Analytics

- dashboard totals
- recent activity
- company-wise breakdown
- experience-derived reporting

### Experience Access

- allow-list management for who can submit experiences
- Excel import support

## 5. Database Summary

Core entities include:

- `users`
- `companies`
- `company_batches`
- `drives`
- `drive_batches`
- `drive_rounds`
- `experiences`
- `rounds`
- `questions`
- `experience_access_students`

Important schema notes:

- `companies.batch` is batch-aware and used for company scoping
- `drives.batch` is required and aligned with `eligible_batches`
- `drive_batches` and `company_batches` are used for batch card navigation

## 6. Recent Important Improvements

### Batch-wise Companies

- company section opens with batch cards
- clicking a batch shows companies under that academic cycle

### Batch-wise Drives

- admin drives open with drive batch cards
- clicking a batch opens the existing drive UI under that batch
- junior drives follow the same batch-first pattern

### Drive Creation Fixes

- admin add-drive form now supports optional fields
- company selection remains required
- either a tentative drive date or round dates must exist
- drive creation writes both `batch` and `eligible_batches`

### Drive Filtering Improvements

- date filtering respects full drive schedule windows
- CTC range filters normalize min and max values
- admin and junior drive filters behave consistently

### Dashboard Count Fixes

- company totals use active company logic
- drive totals use exact batch matching instead of loose matching

## 7. API Areas

Main backend route groups:

- `/api/auth`
- `/api/admin`
- `/api/student`
- `/api/junior`
- `/api/public`

Main admin areas:

- companies
- drives
- submissions
- analytics
- experience access
- email tools

Main junior areas:

- companies
- company experiences
- stats
- topics
- drives
- drive batches

## 8. Folder Summary

```text
backend/
  config/
  controllers/
  middlewares/
  models/
  routes/
  scripts/
  services/
  utils/
  setup_database.sql

frontend/
  src/
    api/
    components/
      Admin/
      Auth/
      Junior/
      Student/
    context/
```

## 9. Setup Summary

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### Database

Run the schema in:

- `backend/setup_database.sql`

Then run any required migration scripts from:

- `backend/scripts/migrations/`

## 10. Current Status

The project is in a strong implemented state with working admin, student, and junior flows. The most recent work focused on:

- drive batch architecture
- company batch architecture
- nullable drive creation improvements
- junior drive batch support
- filter correctness
- dashboard correctness

## 11. Documentation Rule

The repository should keep only these two project-facing docs:

- `README.md` for onboarding and quick start
- `PROJECT_SUMMARY.md` for complete project understanding
