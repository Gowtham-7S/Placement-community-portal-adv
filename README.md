# 🎓 Placement Intelligence & Interview Experience Portal

## 📌 Project Overview

A **production-level, role-based placement intelligence platform** that transforms student interview experiences into structured, analyzable placement data for juniors and analytics insights for administrators.

**Not a simple CRUD app** — includes advanced features like data approval workflows, analytics engine, pattern detection, and preparation roadmap generation.

---

## 🎯 Key Objectives

✅ Enable students to document interview experiences with structured data  
✅ Provide real-time analytics and insights for administrators  
✅ Generate AI-powered interview preparation roadmaps for juniors  
✅ Implement sophisticated role-based access control (RBAC)  
✅ Ensure data quality through approval workflows  
✅ Create interactive dashboards with advanced visualizations  

---

## 🧱 TECH STACK

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React.js | 18.x |
| **Backend** | Node.js + Express | 18.x + 4.x |
| **Database** | PostgreSQL | 14+ |
| **Authentication** | JWT + bcrypt | RS256 |
| **Charts** | Recharts / Chart.js | Latest |
| **API Style** | REST | JSON |
| **Package Manager** | npm | Latest |

---

## 👥 SYSTEM ROLES & PERMISSIONS (RBAC)

### 1️⃣ **Admin** (System Controller & Analyst)
- ✅ Add/Edit Companies
- ✅ Create/Edit Interview Drives
- ✅ Approve/Reject student submissions
- ✅ View comprehensive analytics dashboard
- ✅ Generate placement reports & trends
- ✅ Manage user roles & permissions
- ❌ Cannot submit interview experiences

### 2️⃣ **Placement Attended Student** (Data Contributor)
- ✅ Submit structured interview experiences
- ✅ Add round-wise details (HR, Technical, Coding, Managerial)
- ✅ Submit anonymously if desired
- ✅ Track submission status (pending → approved → rejected)
- ✅ View company insights
- ✅ Download preparation materials
- ❌ Cannot approve data
- ❌ Cannot access admin analytics

### 3️⃣ **Junior Student** (Data Consumer)
- ✅ View company interview patterns
- ✅ Access preparation roadmaps
- ✅ Search & filter companies by role/CTC/skills
- ✅ View statistics & insights
- ✅ Download interview guides
- ❌ Cannot submit experiences
- ❌ Cannot view raw/unapproved data
- ❌ Cannot access admin dashboard

---

## 📁 PROJECT FOLDER STRUCTURE

```
Placement_community_portal/
│
├── README.md                          # Project documentation (this file)
├── SETUP.md                          # Installation & setup guide
│
├── docs/                              # Documentation
│   ├── DATABASE_SCHEMA.md            # Complete database design
│   ├── API_ENDPOINTS.md              # All REST API endpoints
│   ├── ARCHITECTURE.md               # System architecture
│   ├── WORKFLOW.md                   # Complete workflow documentation
│   └── DEPLOYMENT.md                 # Deployment guide
│
├── backend/                           # Node.js + Express Backend
│   ├── package.json
│   ├── .env.example
│   ├── server.js                     # Entry point
│   │
│   ├── config/
│   │   ├── database.js              # Database connection
│   │   ├── environment.js           # Environment variables
│   │   └── constants.js             # App constants
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js        # JWT verification
│   │   ├── roleMiddleware.js        # Role-based authorization
│   │   ├── errorHandler.js          # Global error handling
│   │   └── validationMiddleware.js  # Input validation
│   │
│   ├── routes/
│   │   ├── auth.routes.js           # Auth endpoints
│   │   ├── admin.routes.js          # Admin endpoints
│   │   ├── student.routes.js        # Student endpoints
│   │   ├── junior.routes.js         # Junior endpoints
│   │   └── public.routes.js         # Public endpoints
│   │
│   ├── controllers/
│   │   ├── authController.js        # Auth logic
│   │   ├── adminController.js       # Admin operations
│   │   ├── studentController.js     # Student operations
│   │   ├── juniorController.js      # Junior operations
│   │   └── analyticsController.js   # Analytics logic
│   │
│   ├── services/
│   │   ├── authService.js           # Authentication service
│   │   ├── companyService.js        # Company management
│   │   ├── driveService.js          # Drive management
│   │   ├── experienceService.js     # Experience operations
│   │   ├── analyticsService.js      # Analytics engine
│   │   ├── roadmapService.js        # Preparation roadmap
│   │   └── emailService.js          # Email notifications
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Company.js
│   │   ├── Drive.js
│   │   ├── Experience.js
│   │   └── Round.js
│   │
│   ├── utils/
│   │   ├── tokenUtils.js            # JWT utils
│   │   ├── validationUtils.js       # Validators
│   │   └── helpers.js               # Helper functions
│   │
│   └── logs/                         # Application logs
│       └── .gitkeep
│
├── frontend/                          # React.js Frontend
│   ├── package.json
│   ├── .env.example
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── index.js                 # Entry point
│   │   ├── App.js
│   │   │
│   │   ├── components/              # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ProtectedRoute.jsx   # Route protection
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   │
│   │   ├── pages/                   # Page components
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   └── ForgotPassword.jsx
│   │   │   │
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── ManageCompanies.jsx
│   │   │   │   ├── ManageDrives.jsx
│   │   │   │   ├── ApproveSubmissions.jsx
│   │   │   │   ├── Analytics.jsx
│   │   │   │   └── ReportGeneration.jsx
│   │   │   │
│   │   │   ├── student/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── SubmitExperience.jsx
│   │   │   │   ├── MySubmissions.jsx
│   │   │   │   ├── CompanyInsights.jsx
│   │   │   │   └── Profile.jsx
│   │   │   │
│   │   │   └── junior/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── CompanySearch.jsx
│   │   │       ├── PreparationRoadmap.jsx
│   │   │       └── StudyResources.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.js              # Axios config & base
│   │   │   ├── authService.js      # Auth API calls
│   │   │   ├── companyService.js   # Company API calls
│   │   │   ├── analyticsService.js # Analytics API calls
│   │   │   └── experienceService.js # Experience API calls
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js          # Auth hook
│   │   │   ├── useFetch.js         # Data fetching hook
│   │   │   └── useForm.js          # Form handling hook
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.js      # Global auth state
│   │   │
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   ├── variables.css       # CSS variables
│   │   │   └── responsive.css      # Responsive design
│   │   │
│   │   └── utils/
│   │       ├── constants.js
│   │       ├── validators.js
│   │       └── formatters.js
│   │
│   └── public/
│       └── .env.example
│
└── .gitignore                         # Git ignore rules
```

---

## 🗄️ DATABASE STRUCTURE (OVERVIEW)

### Core Tables
- **users** — User accounts with role-based data
- **companies** — Company information
- **drives** — Interview drives (role, CTC, dates)
- **experiences** — Submitted interview experiences
- **rounds** — Round-wise details (HR, Technical, etc.)
- **approvals** — Approval workflow tracking
- **analytics_cache** — Pre-computed analytics for performance

### Relationships
```
users (1) ──→ (many) experiences
companies (1) ──→ (many) drives
drives (1) ──→ (many) experiences
experiences (1) ──→ (many) rounds
rounds (1) ──→ (many) topics
users (1 Admin) ──→ (many) approvals
```

---

## 🔄 SYSTEM WORKFLOW

### Complete User Journey

```
1. USER REGISTRATION & LOGIN
   ├─ Visitor → Register (creates account)
   ├─ Choose Role (Admin/Student/Junior)
   └─ Login via JWT

2. ADMIN WORKFLOW
   ├─ Add Companies
   ├─ Create Interview Drives
   ├─ Review Student Submissions (pending → approve/reject)
   └─ Access Analytics Dashboard

3. PLACEMENT ATTENDED STUDENT WORKFLOW
   ├─ Login
   ├─ Browse Available Drives
   ├─ Fill Experience Form (structured)
   │  ├─ Round 1: HR (Questions, Difficulty, Tips)
   │  ├─ Round 2: Technical (Topics, Questions, Difficulty)
   │  └─ Round 3: Coding (Problems, Duration, Difficulty)
   ├─ Submit (Status: Pending)
   ├─ Admin Reviews → Approves
   ├─ Status: Approved
   └─ Track Submission Status

4. JUNIOR STUDENT WORKFLOW
   ├─ Login
   ├─ Browse Companies
   ├─ View Interview Patterns
   ├─ Access Preparation Roadmap
   │  ├─ Key Topics to Focus
   │  ├─ HR Preparation Guide
   │  ├─ Technical Topics Frequency
   │  └─ Strategy Tips
   └─ Download Resources

5. ANALYTICS PROCESSING
   ├─ Raw Data (Approved Experiences)
   ├─ Analytics Engine
   │  ├─ Calculate Topic Frequency
   │  ├─ Average Rounds per Company
   │  ├─ Difficulty Distribution
   │  ├─ Skills Tested Frequency
   │  └─ Round Type Distribution
   └─ Dashboard Visualization
```

---

## 🔐 AUTHENTICATION FLOW

```
┌─────────────────────────────────────────────────────┐
│ USER LOGIN/REGISTER                                 │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 1. Validate Credentials / Hash Password             │
│ 2. Generate JWT Token (RS256)                       │
│ 3. Store in Secure Cookie (httpOnly, Secure)        │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ API REQUEST WITH AUTHORIZATION HEADER               │
│ Authorization: Bearer <JWT_TOKEN>                   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 1. Auth Middleware: Verify Token                    │
│ 2. Extract User ID & Role                           │
│ 3. Pass to Route Handler                            │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ ROLE MIDDLEWARE                                      │
│ ├─ Check User Role                                  │
│ ├─ Verify Permissions                               │
│ └─ Allow/Deny Access                                │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ EXECUTE CONTROLLER ACTION                           │
└─────────────────────────────────────────────────────┘
```

---

## 📊 ANALYTICS ENGINE WORKFLOW

```
APPROVED EXPERIENCES → DATA PROCESSING
                        ↓
    ┌─────────────────────────────────────┐
    │ 1. TOPIC FREQUENCY ANALYSIS         │
    │    Count occurrences of each topic  │
    │    Generate ranking by frequency    │
    └─────────────────────────────────────┘
                        ↓
    ┌─────────────────────────────────────┐
    │ 2. ROUND ANALYSIS                   │
    │    ├─ Avg rounds per company        │
    │    ├─ Round type distribution       │
    │    └─ Duration patterns             │
    └─────────────────────────────────────┘
                        ↓
    ┌─────────────────────────────────────┐
    │ 3. DIFFICULTY TRENDS                │
    │    ├─ Easy/Medium/Hard distribution │
    │    ├─ Topic-wise difficulty         │
    │    └─ Trend analysis                │
    └─────────────────────────────────────┘
                        ↓
    ┌─────────────────────────────────────┐
    │ 4. SKILLS MATRIX                    │
    │    ├─ Most tested skills            │
    │    ├─ Skills by company             │
    │    └─ Skills by round type          │
    └─────────────────────────────────────┘
                        ↓
ANALYTICS_CACHE TABLE (Pre-computed)
                        ↓
DASHBOARD VISUALIZATION (Charts, Graphs)
```

---

## 🧠 PREPARATION ROADMAP GENERATOR

For each company, the system automatically generates:

```
PREPARATION ROADMAP
├─ Executive Summary
│  ├─ Company Name
│  ├─ Average CTC
│  ├─ Number of Rounds
│  └─ Success Rate
│
├─ Interview Pattern Summary
│  ├─ Round 1: HR (20 min avg)
│  ├─ Round 2: Technical (45 min avg)
│  └─ Round 3: Coding (60 min avg)
│
├─ Most Asked Topics (Ranked)
│  ├─ 1. Data Structures (90% asked)
│  ├─ 2. Algorithms (85% asked)
│  └─ 3. DBMS (70% asked)
│
├─ Difficulty Breakdown
│  ├─ Easy: 20%
│  ├─ Medium: 50%
│  └─ Hard: 30%
│
├─ HR Preparation Guide
│  ├─ Common Questions
│  ├─ Company Culture Tips
│  └─ Behavioral Patterns
│
├─ Technical Focus Areas
│  ├─ Must Know
│  ├─ Good to Know
│  └─ Nice to Have
│
└─ Strategy & Tips
   ├─ Interview Duration Management
   ├─ Common Mistakes to Avoid
   └─ Success Tips from Accepted Students
```

---

## 🔌 REST API ENDPOINTS (HIGH LEVEL)

### Authentication
```
POST   /api/auth/register           - User registration
POST   /api/auth/login              - User login
POST   /api/auth/logout             - User logout
```

### Admin Routes
```
POST   /api/admin/companies         - Add company
GET    /api/admin/companies         - List companies
PUT    /api/admin/companies/:id     - Update company

POST   /api/admin/drives            - Create drive
GET    /api/admin/drives            - List drives
PUT    /api/admin/drives/:id        - Update drive

GET    /api/admin/submissions       - List pending submissions
PUT    /api/admin/submissions/:id   - Approve/Reject

GET    /api/admin/analytics         - Dashboard analytics
GET    /api/admin/analytics/reports - Generate reports
```

### Student Routes
```
POST   /api/student/experiences     - Submit experience
GET    /api/student/experiences     - My submissions
PUT    /api/student/experiences/:id - Edit submission (if pending)
DELETE /api/student/experiences/:id - Delete submission (if pending)

GET    /api/student/drives          - Available drives
GET    /api/student/insights        - Company insights
```

### Junior Routes
```
GET    /api/junior/companies        - Search companies
GET    /api/junior/companies/:id    - Company details & patterns
GET    /api/junior/roadmap/:companyId - Preparation roadmap
GET    /api/junior/statistics       - Overall statistics
```

---

## 📊 ANALYTICS METRICS GENERATED

### Company-Level Metrics
- Total experiences submitted
- Approval rate
- Average interview rounds
- Round type distribution
- CTC statistics (Min, Max, Avg)

### Topic-Level Metrics
- Frequency count
- Difficulty distribution
- Round-wise occurrence
- Company-wise frequency

### Difficulty Metrics
- Easy/Medium/Hard distribution
- Topic-wise difficulty
- Trend over time
- Company comparison

### Skills Metrics
- Most tested skills
- Skills by company
- Skills by round
- Required vs Nice-to-have

---

## 🚀 DEVELOPMENT PHASES

### **Phase 1: Foundation** ✅ *Currently Here*
- [ ] Create README & documentation
- [ ] Design database schema
- [ ] Define API endpoints

### **Phase 2: Backend Setup**
- [ ] Initialize Express project
- [ ] Setup database connection
- [ ] Implement authentication
- [ ] Create middleware layer

### **Phase 3: Backend Features**
- [ ] Admin management APIs
- [ ] Student submission APIs
- [ ] Junior access APIs
- [ ] Analytics engine

### **Phase 4: Frontend Setup**
- [ ] Initialize React project
- [ ] Setup routing & navigation
- [ ] Create layout components
- [ ] Implement auth UI

### **Phase 5: Frontend Features**
- [ ] Admin dashboard
- [ ] Student submission forms
- [ ] Junior dashboard
- [ ] Analytics visualizations

### **Phase 6: Integration & Testing**
- [ ] API integration
- [ ] User testing
- [ ] Performance optimization
- [ ] Security audit

### **Phase 7: Deployment**
- [ ] Setup production database
- [ ] Deploy backend (Node.js server)
- [ ] Deploy frontend (React build)
- [ ] Setup monitoring & logs

---

## 🛠️ SETUP INSTRUCTIONS

### Prerequisites
- Node.js 18.x or higher
- MySQL 8.0 or higher
- npm/yarn package manager
- Git version control

### Quick Start
```bash
# Backend setup
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env
npm start
```

**Detailed setup guide:** See [SETUP.md](./SETUP.md)

---

## 📖 DOCUMENTATION FILES

| Document | Purpose |
|----------|---------|
| [DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) | Complete database design with ER diagrams |
| [API_ENDPOINTS.md](./docs/API_ENDPOINTS.md) | All REST endpoints with request/response |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture & design patterns |
| [WORKFLOW.md](./docs/WORKFLOW.md) | Detailed workflow documentation |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Production deployment guide |

---

## 🔐 Security Features

✅ JWT token-based authentication  
✅ Password hashing with bcrypt (salt rounds: 10)  
✅ Role-based authorization middleware  
✅ Input validation on all endpoints  
✅ SQL injection prevention (prepared statements)  
✅ CORS configuration  
✅ Rate limiting  
✅ Secure cookie storage (httpOnly, Secure, SameSite)  
✅ Environment variable protection  

---

## 📈 Performance Considerations

✅ Analytics caching (pre-computed results)  
✅ Database indexing on frequently queried fields  
✅ Pagination for large result sets  
✅ Lazy loading of components  
✅ Image optimization  
✅ Compression middleware  

---

## 📝 Code Standards

- **Backend:** Express.js best practices, MVC pattern
- **Frontend:** React hooks, functional components
- **Database:** Normalized schema, foreign keys
- **API:** RESTful conventions, consistent naming
- **Naming:** camelCase (JS), snake_case (database)
- **Comments:** JSDoc for functions
- **Testing:** Unit & integration tests

---

## 🐛 Error Handling

- Global error middleware for backend
- Error boundary component for frontend
- Proper HTTP status codes
- User-friendly error messages
- Logging system for debugging

---

## 📞 Support & Contribution

For issues, feature requests, or contributions:
1. Create detailed issue report
2. Follow coding standards
3. Submit pull request with description
4. Request code review

---

## 📜 License

This project is proprietary and developed for educational purposes.

---

## 🎯 Next Steps

1. ✅ **README Complete** — You are here
2. → **Database Schema** — Design and document all tables
3. → **API Endpoints** — Define all REST endpoints
4. → **Backend Setup** — Initialize Express project
5. → **Frontend Setup** — Initialize React project
6. → **Implementation** — Build features

---

**Last Updated:** February 5, 2026  
**Version:** 1.0.0  
**Status:** Development (Phase 1)
#   p l a c e m e n t _ c o m  
 #   p l a c e m e n t _ c o m  
 