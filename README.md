# Placement Community Portal

Placement Community Portal is a full-stack placement support platform built for three roles:

- `admin` manages companies, drives, approvals, analytics, and access control
- `student` submits structured interview experiences
- `junior` explores approved placement insights, companies, and drives

The project includes a React frontend, a Node.js + Express backend, and a PostgreSQL database with role-based access control, approval workflows, analytics, and batch-wise company/drive management.

## Stack

- Frontend: React, React Router, Material UI, Tailwind CSS, Axios
- Backend: Node.js, Express, PostgreSQL, `pg`, JWT auth, `express-validator`
- Database: PostgreSQL schema in `backend/setup_database.sql`

## Main Features

- Authentication and RBAC for `admin`, `student`, and `junior`
- Admin company management with batch-wise navigation
- Admin drive management with batch-wise navigation
- Student experience submission, edit, and tracking
- Junior company insights and junior drive browsing
- Analytics dashboard, pending approvals, and experience access controls
- Email utility endpoints and Excel import for access management

## Batch-Wise Modules

- Company management is organized by academic batch
- Drive management is organized by academic batch
- Junior drives are also organized batch-wise
- Drive records are synchronized with both `batch` and `eligible_batches` fields

## Quick Start

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

- Create a PostgreSQL database
- Run `backend/setup_database.sql`
- Configure backend `.env` values for database and auth

## Project Structure

```text
backend/
  config/
  controllers/
  middlewares/
  models/
  routes/
  services/
  utils/
  scripts/
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

## Documentation

- High-level and technical project summary: `PROJECT_SUMMARY.md`

## Current State

- Core backend and frontend are implemented
- Batch-wise company and drive flows are implemented
- Admin and junior drive filtering, batch handling, and nullable drive form logic are implemented

## Notes

- Third-party Markdown files inside `node_modules` are dependency docs, not project documentation.
