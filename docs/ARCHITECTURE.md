# 🏗️ SYSTEM ARCHITECTURE & DESIGN PATTERNS

## High-Level Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐  │
│  │   Admin Dashboard    │  │  Student Dashboard   │  │  Junior Portal  │  │
│  │   (React.js)         │  │   (React.js)         │  │   (React.js)    │  │
│  └──────────────────────┘  └──────────────────────┘  └─────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
                          ┌──────────────────────┐
                          │  Authentication      │
                          │  (JWT Token)         │
                          └──────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  • Request Routing      • Rate Limiting      • CORS Handling                │
│  • Request Validation   • Logging            • Error Handling               │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MIDDLEWARE LAYER (Express)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Auth Middleware → JWT Verification → Extract User Context          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                     ↓                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Role Middleware → Check User Role → Verify Permissions             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                     ↓                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Validation Middleware → Input Validation → Sanitization            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                     ↓                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Error Handler → Catch Exceptions → Format Error Response           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ROUTE LAYER (Express Router)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  • /api/auth/*      → Auth Routes                                          │
│  • /api/admin/*     → Admin Routes                                         │
│  • /api/student/*   → Student Routes                                       │
│  • /api/junior/*    → Junior Routes                                        │
│  • /api/public/*    → Public Routes                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONTROLLER LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ AuthController│  │AdminController│ │StudentController│ │JuniorController│ │
│  │ ├─ register  │  │ ├─ addCompany │  │├─ submitExperience│├─ searchCompany│ │
│  │ ├─ login     │  │ ├─ createDrive│  │├─ getSubmissions  │├─ getRoadmap   │ │
│  │ ├─ logout    │  │ ├─ approveData│  │├─ updateProfile   │├─ getInsights  │ │
│  │ └─ refreshToken│ │ └─ getAnalytics  │└─ getInsights    │└─ getStatistics│ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                                             │
│              ┌──────────────────────────────────────┐                      │
│              │ AnalyticsController                  │                      │
│              │ ├─ getTopicFrequency                 │                      │
│              │ ├─ getDifficultyDistribution         │                      │
│              │ ├─ getSkillsAnalysis                 │                      │
│              │ └─ generateReport                    │                      │
│              └──────────────────────────────────────┘                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐  │
│  │  AuthService         │  │  CompanyService      │  │ ExperienceService│ │
│  │ ├─ hashPassword      │  │ ├─ addCompany        │  │ ├─ validateData   │ │
│  │ ├─ generateToken     │  │ ├─ updateCompany     │  │ ├─ submitExp      │ │
│  │ ├─ verifyToken       │  │ ├─ deleteCompany     │  │ ├─ updateExp      │ │
│  │ └─ authenticateUser  │  │ └─ getCompanyDetails │  │ └─ deleteExp      │ │
│  └──────────────────────┘  └──────────────────────┘  └─────────────────┘  │
│                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐  │
│  │  AnalyticsService    │  │  RoadmapService      │  │  ApprovalService │ │
│  │ ├─ calculateFreq     │  │ ├─ generateRoadmap   │  │ ├─ approveExp     │ │
│  │ ├─ calculateDifficulty│ │ ├─ getTopicFocus     │  │ ├─ rejectExp      │ │
│  │ ├─ getSkillsMatrix   │  │ ├─ getHRGuide        │  │ ├─ updateStatus   │ │
│  │ └─ cacheResults      │  │ └─ getStrategyTips   │  │ └─ getHistory     │ │
│  └──────────────────────┘  └──────────────────────┘  └─────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATA ACCESS LAYER (Models)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  • User Model         • Company Model      • Drive Model                    │
│  • Experience Model   • Round Model        • Question Model                 │
│  • Approval Model     • AnalyticsCache Model                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                     ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                          MySQL Database                                    │
│                                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ users    │ │companies │ │ drives   │ │experiences│ │ rounds   │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Design Patterns Used

### 1. **MVC (Model-View-Controller)**

```
Model Layer      → Database & Data Logic (models/)
View Layer       → React Components (frontend/)
Controller Layer → Express Controllers (controllers/)
Service Layer    → Business Logic (services/)
```

### 2. **Service-Oriented Architecture**

Each microfunction has dedicated service:
- `AuthService` — Authentication logic
- `CompanyService` — Company management
- `AnalyticsService` — Analytics computation
- `RoadmapService` — Roadmap generation

### 3. **Middleware Pattern**

```
Request → authMiddleware → roleMiddleware → validationMiddleware → Controller → Response
```

### 4. **Repository Pattern (Optional Enhancement)**

```
Service → Repository → Model → Database
```

### 5. **Factory Pattern**

Creating different response objects based on role:
```javascript
const responseFactory = {
  admin: (data) => ({ ...data, includeUserId: true }),
  junior: (data) => ({ ...data, anonymizeUser: true }),
  student: (data) => ({ ...data, onlyOwnData: true })
}
```

### 6. **Singleton Pattern**

```javascript
// Database connection - created once
const db = new Database();
module.exports = db;
```

### 7. **Strategy Pattern**

```javascript
// Different approval strategies
const approvalStrategies = {
  automatic: () => { /* auto-approve logic */ },
  manual: () => { /* manual review logic */ },
  conditional: () => { /* conditional logic */ }
}
```

---

## Request-Response Flow

### Successful Request Flow

```
1. CLIENT REQUEST
   ├─ POST /api/student/experiences
   ├─ Headers: { Authorization: "Bearer JWT_TOKEN" }
   └─ Body: { experience data }
        ↓
2. MIDDLEWARE CHAIN
   ├─ authMiddleware: Verify JWT, extract user info
   ├─ roleMiddleware: Check if role === 'student'
   ├─ validationMiddleware: Validate request body
   └─ Pass to next middleware
        ↓
3. ROUTE HANDLER
   └─ Route: POST /api/student/experiences → studentController.submitExperience
        ↓
4. CONTROLLER
   ├─ Extract: user_id from context, data from body
   ├─ Call: experienceService.submitExperience(user_id, data)
   └─ Return: response to client
        ↓
5. SERVICE
   ├─ Validate: Data completeness
   ├─ Call: Experience.create(data)
   ├─ Cache: Update analytics_cache
   └─ Return: Created experience object
        ↓
6. MODEL/DATABASE
   ├─ Insert: Into experiences table
   ├─ Insert: Into rounds table
   ├─ Verify: Foreign key constraints
   └─ Return: Saved record with ID
        ↓
7. RESPONSE
   └─ { success: true, data: { id: 101, ... }, message: "..." }
        ↓
8. CLIENT
   └─ Process response, update UI
```

---

## Data Flow for Analytics

```
APPROVED EXPERIENCES (Database)
         ↓
  [Scheduler/Trigger]
         ↓
  ANALYTICS SERVICE
  ├─ Query approved experiences
  ├─ Group by: company, topic, round_type, difficulty
  ├─ Calculate: frequencies, averages, distributions
  ├─ Generate: statistics, trends, insights
  └─ Store results in: analytics_cache table
         ↓
  CACHING LAYER
  ├─ Cache key: "analytics:company:1"
  ├─ TTL: 1 hour
  └─ Invalidate on: New approval, Rejection
         ↓
  DASHBOARD
  ├─ Query: analytics_cache (fast)
  ├─ Format: For charts/graphs
  └─ Display: To admin UI
```

---

## Authentication & Authorization Flow

```
REGISTRATION
    ├─ User submits: email, password, role
    ├─ Hash password with bcrypt (10 salt rounds)
    ├─ Store in DB
    └─ Return: Success message
         ↓
LOGIN
    ├─ User submits: email, password
    ├─ Verify: Password hash matches
    ├─ Generate: JWT token (RS256 algorithm)
    │   ├─ Payload: { userId, role, email, exp: +30min }
    │   ├─ Signature: Private key (backend only)
    │   └─ Algorithm: RS256 (asymmetric)
    ├─ Generate: Refresh token (7 days expiry)
    └─ Return: Access token + Refresh token
         ↓
PROTECTED REQUEST
    ├─ Client includes: Authorization: Bearer ACCESS_TOKEN
    ├─ Auth Middleware:
    │   ├─ Extract: Token from header
    │   ├─ Verify: Signature using public key
    │   ├─ Check: Expiry time
    │   └─ Extract: userId, role
    ├─ Role Middleware:
    │   ├─ Check: User.role in allowed_roles
    │   ├─ Yes: Continue to controller
    │   └─ No: Return 403 Forbidden
    └─ Request proceess to protected resource
         ↓
TOKEN REFRESH
    ├─ Client submits: refreshToken
    ├─ Verify: Refresh token validity
    ├─ Generate: New access token
    └─ Return: New access token
         ↓
LOGOUT
    ├─ Invalidate: Refresh token (store in blacklist)
    ├─ Clear: Client-side tokens
    └─ User needs to login again
```

---

## Approval Workflow

```
STUDENT SUBMITS EXPERIENCE
    ├─ Status: pending
    ├─ Store: In experiences table
    └─ Alert: Admin dashboard
         ↓
ADMIN REVIEWS SUBMISSION
    ├─ Check: Data completeness (completeness_score)
    ├─ Verify: No inconsistencies
    ├─ Read: All rounds and questions
    ├─ Add: Comments (optional)
    └─ Decision: Approve or Reject
         ↓
┌─────────────────┬──────────────────┐
│                 │                  │
├─ APPROVED ─────┘                  ├─ REJECTED ─────┐
│                                    │                │
│ ├─ Update: status = 'approved'    │ ├─ Send: Rejection reason to student
│ ├─ Set: approved_at timestamp      │ ├─ Add: Comments for improvement
│ ├─ Store: In approvals table       │ └─ Status = 'rejected'
│ ├─ Trigger: Analytics cache update │
│ └─ Notify: Student via email       │ Student can resubmit
│                                    │
├─ ANALYTICS UPDATED
│ ├─ Recalculate: Topic frequency
│ ├─ Update: Difficulty distribution
│ ├─ Refresh: Cache (TTL = 1 hour)
│ └─ Dashboard updated automatically
│
└─ JUNIOR CAN VIEW
  └─ In preparation roadmap
```

---

## Performance Optimization Strategy

### 1. **Caching**

```
Frontend Cache:
  • React state management
  • LocalStorage for preferences
  • Browser cache for static files

Backend Cache:
  • analytics_cache table (pre-computed)
  • Redis (future consideration)
  • Query result caching

Cache Invalidation:
  • On approval: Invalidate all affected company caches
  • TTL: 1 hour for analytics
  • On-demand refresh for admins
```

### 2. **Database Optimization**

```
Indexing Strategy:
  • Primary Keys: All tables
  • Foreign Keys: Fast joins
  • Search columns: email, company_name
  • Filter columns: status, approval_status, created_at

Query Optimization:
  • Use SELECT with specific columns (not *)
  • Pagination for large result sets
  • Lazy load related data
  • Join only necessary tables
```

### 3. **API Response Optimization**

```
Compression:
  • GZIP compression on all responses
  • Minify JSON payloads
  • Pagination: Return only needed data

Load Balancing (Future):
  • Multiple backend instances
  • Load balancer routing
  • Sticky sessions for websockets
```

---

## Error Handling Strategy

### Error Hierarchy

```
Error Types:
├─ ValidationError (400)
│  ├─ Missing required field
│  ├─ Invalid data type
│  └─ Constraint violation
├─ AuthenticationError (401)
│  ├─ Invalid credentials
│  ├─ Token expired
│  └─ Token invalid
├─ AuthorizationError (403)
│  ├─ Role mismatch
│  ├─ Permission denied
│  └─ Resource access denied
├─ NotFoundError (404)
│  ├─ Resource not found
│  └─ Endpoint not found
├─ ConflictError (409)
│  ├─ Duplicate email
│  ├─ Resource already exists
│  └─ State conflict
└─ InternalError (500)
   ├─ Database error
   ├─ Service error
   └─ Unexpected error
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email format is invalid"
      }
    ]
  },
  "timestamp": "2026-02-05T10:30:00Z",
  "requestId": "req_12345"
}
```

---

## Security Architecture

### 1. **Authentication**

```
Password Storage:
  ├─ Algorithm: bcrypt
  ├─ Salt rounds: 10
  ├─ Cost: ~100ms per hash
  └─ Never store plaintext

Token Security:
  ├─ Algorithm: RS256 (asymmetric)
  ├─ Private key: Backend only
  ├─ Public key: For verification
  ├─ Expiry: 30 minutes
  ├─ Refresh: 7 days
  └─ Storage: Secure HttpOnly cookie
```

### 2. **Authorization**

```
Role-Based Access Control (RBAC):
  ├─ Admin:
  │  ├─ Add/Edit companies
  │  ├─ Approve submissions
  │  └─ Access analytics
  ├─ Student:
  │  ├─ Submit experiences
  │  ├─ View own data
  │  └─ Download resources
  └─ Junior:
     ├─ View approved data
     ├─ Access roadmaps
     └─ Search companies
```

### 3. **Data Protection**

```
Input Validation:
  ├─ Whitelist validation
  ├─ Type checking
  ├─ Length limits
  └─ Format validation

SQL Injection Prevention:
  ├─ Prepared statements
  ├─ Parameter binding
  └─ No string concatenation

XSS Prevention:
  ├─ HTML escaping
  ├─ React JSX (automatic)
  └─ Content Security Policy

CSRF Prevention:
  ├─ CSRF tokens
  ├─ SameSite cookies
  └─ Double-submit pattern
```

---

## Scalability Considerations

### Horizontal Scaling

```
Load Balancer
    ├─ Instance 1 (Node.js server)
    ├─ Instance 2 (Node.js server)
    ├─ Instance 3 (Node.js server)
    └─ Instance N (Node.js server)
         ↓
    Shared Database (MySQL)
         ↓
    Session Store (Redis/Memcached)
```

### Vertical Scaling

```
Current:
  ├─ RAM: 2GB
  ├─ CPU: 2 cores
  └─ DB storage: 50GB

Future:
  ├─ RAM: 8GB+
  ├─ CPU: 8+ cores
  └─ DB storage: 500GB+
```

### Database Optimization

```
Sharding (by company_id):
  ├─ Shard 1: Companies A-M
  ├─ Shard 2: Companies N-Z
  └─ Separate databases

Read Replicas:
  ├─ Master: For writes
  ├─ Replica 1: For analytics queries
  ├─ Replica 2: For junior searches
  └─ Replication: Real-time sync
```

---

**Last Updated:** February 5, 2026  
**Version:** 1.0
