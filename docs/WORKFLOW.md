# 🔄 COMPLETE SYSTEM WORKFLOW DOCUMENTATION

## 1. USER REGISTRATION & ONBOARDING WORKFLOW

```
STEP 1: USER VISITS PLATFORM
         ↓
         ├─ Sees: Home page with role selection
         ├─ Options: Login or Register
         └─ Chooses: Register

STEP 2: REGISTRATION FORM
         ├─ Enters: Email, Password, Name
         ├─ Selects: Role (Admin/Student/Junior)
         ├─ Additional: Phone, Department, Batch (if Student)
         └─ Validates: Email uniqueness, Password strength

STEP 3: BACKEND PROCESSING
         ├─ Hash password: bcrypt (10 rounds, ~100ms)
         ├─ Validate: All fields against schema
         ├─ Check: Email not already registered
         ├─ Insert: New user record
         └─ Generate: JWT token pair

STEP 4: RESPONSE & REDIRECT
         ├─ Returns: { success: true, token, user }
         ├─ Frontend stores: Token in secure cookie
         ├─ Redirects: To role-based dashboard
         └─ User logged in: Ready to perform role-specific actions

DATABASE CHANGES:
         INSERT INTO users (email, password_hash, role, ...)
         VALUES ('student@example.com', '$2b$10$...', 'student', ...)
```

---

## 2. LOGIN & AUTHENTICATION WORKFLOW

```
STEP 1: USER LOGIN
         ├─ Enters: Email, Password
         └─ Submits: POST /api/auth/login

STEP 2: BACKEND VERIFICATION
         ├─ Query: Find user by email
         ├─ Check: User exists
         ├─ Verify: Password hash matches (bcrypt)
         ├─ If fail: Return 401 Unauthorized
         └─ If success: Continue

STEP 3: TOKEN GENERATION
         ├─ Create: Payload {
         │   "userId": 5,
         │   "email": "student@example.com",
         │   "role": "student",
         │   "exp": 1644059400 (30 min from now)
         │ }
         ├─ Sign: Using private key (RS256)
         ├─ Also create: Refresh token (7 days)
         └─ Return: Both tokens

TOKEN STRUCTURE (JWT):
         Header: { alg: "RS256", typ: "JWT" }
         Payload: { userId, email, role, exp, iat }
         Signature: sign(header + payload, privateKey)

STEP 4: CLIENT SIDE
         ├─ Receive: Access token + Refresh token
         ├─ Store: In secure HttpOnly cookie (not localStorage)
         ├─ Set: Authorization header for future requests
         └─ Redirect: To dashboard based on role

STEP 5: SUBSEQUENT REQUESTS
         ├─ Header: Authorization: Bearer <TOKEN>
         ├─ Server: Verifies token using public key
         ├─ Valid: Request processed
         └─ Invalid/Expired: Return 401, trigger refresh

EXAMPLE TOKEN (decoded):
         {
           "userId": 5,
           "email": "student@example.com",
           "role": "student",
           "iat": 1644056400,
           "exp": 1644060000
         }
```

---

## 3. ADMIN WORKFLOW: SETTING UP PLACEMENT DRIVE

```
STEP 1: ADMIN LOGS IN
         └─ Access: Admin Dashboard

STEP 2: ADD/SELECT COMPANY
         ├─ Option A: Create new company
         │  ├─ Form: Name, Logo, Website, Industry
         │  ├─ Backend: POST /api/admin/companies
         │  └─ DB: INSERT INTO companies
         │
         └─ Option B: Select existing company
            └─ Query: GET /api/admin/companies

STEP 3: CREATE INTERVIEW DRIVE
         ├─ Form fields:
         │  ├─ Company: (dropdown)
         │  ├─ Role: "Software Engineer"
         │  ├─ CTC Range: 15-25 LPA
         │  ├─ Interview Date: 2026-03-15
         │  ├─ Total Positions: 50
         │  ├─ Number of Rounds: 3
         │  ├─ Mode: Online/Offline/Hybrid
         │  └─ Requirements: "CGPA > 7.0"
         │
         ├─ Backend: POST /api/admin/drives
         ├─ Validation: All required fields present
         └─ DB: INSERT INTO drives

STEP 4: PUBLISH DRIVE
         ├─ Status: upcoming (auto)
         ├─ Visibility: Shown to eligible students
         ├─ Notification: Email sent to registered students
         └─ Timeline: Updates as date approaches

DATABASE CHANGES:
         INSERT INTO drives (company_id, role_name, ctc_min, ctc_max, ...)
         INSERT INTO companies (name, logo_url, industry, ...)

NEXT: Students can now see this drive and submit experiences
```

---

## 4. STUDENT WORKFLOW: SUBMITTING INTERVIEW EXPERIENCE

```
STEP 1: STUDENT LOGS IN
         ├─ Role: 'student'
         ├─ Access: Student Dashboard
         └─ View: Available drives to apply for

STEP 2: BROWSE AVAILABLE DRIVES
         ├─ Query: GET /api/student/drives
         ├─ Filter: By company, role, CTC
         ├─ View: Drive details, interview pattern
         └─ Decision: Choose to participate

STEP 3: ATTEND INTERVIEW
         ├─ Interview Round 1: HR (30 min)
         ├─ Interview Round 2: Technical (60 min)
         ├─ Interview Round 3: Coding (90 min)
         └─ Result: Pass/Fail/Not Sure

STEP 4: FILL EXPERIENCE FORM
         ├─ Company: Google India (auto-filled)
         ├─ Role: Software Engineer
         ├─ Overall Result: pass/fail/not_sure
         ├─ Offer: Yes/No, CTC offered
         ├─ Anonymous: Toggle privacy
         ├─ Difficulty: easy/medium/hard
         └─ Overall Feedback: Text

         FOR EACH ROUND (1, 2, 3):
         ├─ Round Type: HR / Technical / Coding / Managerial
         ├─ Duration: 30/60/90 minutes
         ├─ Result: pass/fail/not_evaluated
         ├─ Topics: [ "Data Structures", "Algorithms", ... ]
         ├─ Questions: [ "Design LRU Cache", "Longest substring...", ... ]
         ├─ Difficulty: easy/medium/hard
         ├─ Tips: "Practice on LeetCode, focus on optimization"
         ├─ Skills: [ "Problem Solving", "Coding", "DSA" ]
         │
         ├─ Technical Details (if applicable):
         │  ├─ Problem Statement: "Design Instagram notification system"
         │  ├─ Approach Used: "Message queue + Cache + Database replication"
         │  ├─ Code Snippet: (optional)
         │  └─ Test Cases Passed: 15/20
         │
         └─ Interviewer Info (optional):
            └─ Interviewer Name: "John Smith"

STEP 5: VALIDATION
         ├─ At least 1 round required
         ├─ Each round: round_number, round_type, questions
         ├─ At least 1 question per round
         ├─ Difficulty level selected
         └─ Pass validation: Success

STEP 6: SUBMIT EXPERIENCE
         ├─ Endpoint: POST /api/student/experiences
         ├─ Body: Complete experience + rounds data
         ├─ Status: approval_status = 'pending'
         ├─ Timestamp: submitted_at = NOW()
         └─ Backend: INSERT INTO experiences + rounds + questions

         INSERT INTO experiences VALUES (
           NULL,                    -- id (auto)
           5,                       -- user_id
           1,                       -- drive_id
           'Google India',          -- company_name
           'Software Engineer',     -- role_applied
           'pass',                  -- result
           TRUE,                    -- selected
           TRUE,                    -- offer_received
           20.5,                    -- ctc_offered
           NULL,                    -- negotiated_ctc
           FALSE,                   -- is_anonymous
           'pending',               -- approval_status
           NOW(),                   -- submitted_at
           NULL,                    -- approved_at
           NULL,                    -- approved_by
           NULL,                    -- rejection_reason
           NULL,                    -- admin_comments
           180,                     -- interview_duration
           'medium',                -- overall_difficulty
           'Great experience...',   -- overall_feedback
           8,                       -- confidence_level
           NOW(), NOW()             -- created_at, updated_at
         );

         FOR EACH ROUND:
         INSERT INTO rounds VALUES (
           NULL,                    -- id (auto)
           101,                     -- experience_id
           1,                       -- round_number
           'HR',                    -- round_type
           30,                      -- duration_minutes
           'pass',                  -- result
           '2026-02-01 10:00:00',   -- round_date
           JSON_ARRAY(...),         -- topics
           JSON_ARRAY(...),         -- questions
           'easy',                  -- difficulty_level
           NULL,                    -- problem_statement
           NULL,                    -- approach_used
           NULL,                    -- code_snippet
           NULL, NULL,              -- test_cases_passed, total
           'Be genuine...',         -- tips_and_insights
           NULL,                    -- common_mistakes
           NULL,                    -- interviewer_feedback
           'HR Manager',            -- interviewer_name
           JSON_ARRAY(...),         -- skills_tested
           NOW(), NOW()             -- created_at, updated_at
         );

STEP 7: CONFIRMATION
         ├─ Response: { success: true, id: 101, status: "pending" }
         ├─ Message: "Experience submitted for approval"
         ├─ Dashboard: Shows submission status as "Pending"
         ├─ Student notification: "Your submission is under review"
         └─ Admin notification: "New submission to review"

STATUS PROGRESSION:
         pending → (admin reviews) → approved OR rejected
         
         If approved:
         ├─ Student sees: "Approved ✓"
         ├─ Experience: Visible in analytics/roadmaps
         └─ Admin: Can view all data

         If rejected:
         ├─ Student sees: "Rejected ✗ - Reason: ..."
         ├─ Can resubmit: "Edit and Resubmit"
         └─ Improvement: See feedback from admin
```

---

## 5. ADMIN WORKFLOW: REVIEWING & APPROVING SUBMISSIONS

```
STEP 1: ADMIN VIEWS PENDING SUBMISSIONS
         ├─ Dashboard: Shows "5 pending submissions"
         ├─ Endpoint: GET /api/admin/submissions?status=pending
         ├─ Response: List of pending experiences
         └─ View: Student name, company, submitted_at, completeness %

STEP 2: ADMIN REVIEWS SUBMISSION
         ├─ Clicks: "Review" button
         ├─ Modal/Page: Shows complete experience
         │  ├─ Student Info: Name, Department, Batch (if not anonymous)
         │  ├─ Overall Info: Company, Role, Result, CTC
         │  ├─ Data Completeness Score: 95% (auto-calculated)
         │  ├─ Round-wise Details: All 3 rounds expanded
         │  │  ├─ Round 1: HR details, questions, difficulty
         │  │  ├─ Round 2: Technical details, questions, difficulty
         │  │  └─ Round 3: Coding details, problem, approach, code
         │  └─ Admin Comment Box: For notes
         │
         └─ Quality Check:
            ├─ Data Completeness: ≥ 80% required
            ├─ Consistency: No contradictions
            ├─ Appropriateness: No spam/irrelevant content
            └─ Decision: Ready to approve/reject

STEP 3: DATA VALIDATION (BACKEND)
         ├─ Auto-check:
         │  ├─ All required fields present
         │  ├─ Data types correct
         │  ├─ Length/format validation
         │  ├─ No SQL injection attempts
         │  └─ Calculate completeness_score
         │
         └─ Manual review by admin:
            ├─ Read all round details
            ├─ Check for spam/inappropriate content
            ├─ Verify data makes sense
            └─ Add comments if needed

STEP 4: ADMIN DECISION
         ├─ Option A: APPROVE
         │  ├─ Click: "Approve" button
         │  ├─ Comments: (optional) "Data looks good and complete"
         │  ├─ Verification: Mark as "verified"
         │  └─ Submit
         │
         └─ Option B: REJECT
            ├─ Click: "Reject" button
            ├─ Reason: Select/type reason
            │  ├─ "Incomplete round details"
            │  ├─ "Duplicate submission"
            │  ├─ "Inappropriate content"
            │  └─ "Other"
            ├─ Comments: "Please resubmit with complete round 2 details"
            └─ Submit

STEP 5: BACKEND PROCESSING
         ├─ Endpoint: PUT /api/admin/submissions/:id/approve
         ├─ Body: {
         │   "status": "approved",
         │   "admin_comments": "...",
         │   "verification_status": "verified"
         │ }
         │
         ├─ Update SQL:
         │  UPDATE experiences SET
         │    approval_status = 'approved',
         │    approved_at = NOW(),
         │    approved_by = 2,  -- admin_id
         │    admin_comments = '...'
         │  WHERE id = 101;
         │
         │  INSERT INTO approvals (experience_id, admin_id, status, ...)
         │  VALUES (101, 2, 'approved', ...);
         │
         └─ Trigger: Update analytics_cache (if approved)

STEP 6: ANALYTICS UPDATE (if approved)
         ├─ Service: analyticsService.updateCache(experience_id)
         ├─ Process:
         │  ├─ Get: All approved experiences for company
         │  ├─ Calculate: Topic frequency, difficulty distribution
         │  ├─ Calculate: Skills matrix, round distribution
         │  ├─ Calculate: CTC statistics, success rate
         │  └─ Store: In analytics_cache table
         │
         └─ Duration: 2-5 seconds (background)

         UPDATE analytics_cache SET
           topic_frequency = 450,
           topic_difficulty_avg = 7.2,
           avg_rounds_per_experience = 3.0,
           cached_at = NOW(),
           expires_at = DATE_ADD(NOW(), INTERVAL 1 HOUR)
         WHERE company_id = 1;

STEP 7: NOTIFICATION
         ├─ Student Email: "Your submission approved! ✓"
         │  └─ "Your interview experience has been verified"
         ├─ Dashboard Update: Status shows "Approved" with date
         ├─ Admin View: Submission moves from pending to approved list
         └─ System: Analytics updated, juniors can now see this data

TIME TAKEN:
         ├─ Form filling: 10-15 minutes
         ├─ Submission: 1 second
         ├─ Admin review: 2-5 minutes
         ├─ Approval processing: 1 second
         ├─ Analytics update: 2-5 seconds
         └─ Notification: 1-2 seconds
```

---

## 6. JUNIOR WORKFLOW: ACCESSING PREPARATION ROADMAP

```
STEP 1: JUNIOR LOGS IN
         ├─ Role: 'junior'
         ├─ Access: Junior Dashboard
         └─ View: Company search and statistics

STEP 2: SEARCH COMPANIES
         ├─ Search Bar: Type "Google"
         ├─ Endpoint: GET /api/junior/companies?search=Google
         ├─ Filters: Industry, Company Size, CTC Range
         └─ Results: List of matching companies

         GET /api/junior/companies?search=Google&industry=Technology
         Response: [
           {
             "id": 1,
             "name": "Google India",
             "logo_url": "...",
             "industry": "Technology",
             "company_size": "10000+",
             "total_experiences": 450,
             "recent_drives": [ ... ]
           }
         ]

STEP 3: VIEW COMPANY DETAILS
         ├─ Click: Company card
         ├─ Endpoint: GET /api/junior/companies/:company_id
         ├─ Response: Company info + interview patterns
         │  ├─ Company info
         │  ├─ Average rounds, duration
         │  ├─ Round type distribution
         │  ├─ Recent drives
         │  ├─ Most asked topics
         │  └─ Success rate

         GET /api/junior/companies/1
         Response: {
           "company": { ... },
           "interview_patterns": {
             "avg_rounds": 3.2,
             "avg_duration": 210,
             "round_distribution": [ ... ],
             "success_rate": 45
           },
           "most_asked_topics": [
             {
               "topic": "Data Structures",
               "frequency_percentage": 85,
               "difficulty": "medium"
             }
           ]
         }

STEP 4: REQUEST PREPARATION ROADMAP
         ├─ Click: "Get Preparation Roadmap" button
         ├─ Endpoint: GET /api/junior/roadmap/:company_id
         └─ Backend Process:
            ├─ Query: All approved experiences for company
            ├─ Service: roadmapService.generateRoadmap(company_id)
            ├─ Calculation:
            │  ├─ Get top 10 topics by frequency
            │  ├─ Difficulty distribution for each
            │  ├─ Round-wise analysis
            │  ├─ Skills matrix
            │  ├─ CTC statistics
            │  └─ Success patterns
            │
            └─ Cache: Check if exists in analytics_cache
               ├─ If yes (not expired): Return cached version
               └─ If no/expired: Compute and cache

STEP 5: VIEW ROADMAP
         ├─ Receives: Comprehensive roadmap object
         ├─ Display:
         │  ├─ Executive Summary
         │  │  ├─ Company name, CTC from latest drive (not calculated average)
         │  │  ├─ Avg rounds, success rate
         │  │  └─ Based on 450 experiences
         │  │
         │  ├─ Interview Pattern
         │  │  ├─ Round 1: HR (20 min avg)
         │  │  ├─ Round 2: Technical (45 min avg)
         │  │  └─ Round 3: Coding (60 min avg)
         │  │
         │  ├─ Top Topics (Ranked)
         │  │  ├─ 1. Data Structures (85% asked, difficulty 7.2)
         │  │  ├─ 2. Algorithms (78% asked, difficulty 7.5)
         │  │  ├─ 3. DBMS (65% asked, difficulty 6.8)
         │  │  └─ ... more topics
         │  │
         │  ├─ Difficulty Breakdown
         │  │  ├─ Easy: 20% (pie chart)
         │  │  ├─ Medium: 50%
         │  │  └─ Hard: 30%
         │  │
         │  ├─ HR Preparation Guide
         │  │  ├─ Common Questions
         │  │  ├─ Company Culture Tips
         │  │  └─ Preparation Timeline: 1-2 weeks
         │  │
         │  ├─ Technical Focus Areas
         │  │  ├─ MUST KNOW: [Arrays, Linked List, Sorting, Searching]
         │  │  ├─ GOOD TO KNOW: [Dynamic Programming, Bit Manipulation]
         │  │  └─ NICE TO HAVE: [Machine Learning basics]
         │  │
         │  ├─ Strategy & Tips
         │  │  ├─ Time Management
         │  │  ├─ Common Mistakes to Avoid
         │  │  ├─ Success Tips from Accepted Students
         │  │  └─ Recommended Prep Time: 3-4 months
         │  │
         │  └─ Resources
         │     ├─ Free: LeetCode, GeeksforGeeks
         │     ├─ Paid: InterviewBit, AlgoExpert
         │     └─ Books: Cracking the Coding Interview

STEP 6: DOWNLOAD/SAVE ROADMAP
         ├─ Options:
         │  ├─ Download as PDF
         │  ├─ Print to PDF
         │  ├─ Share link
         │  └─ Email to self
         │
         └─ Persistence: Saved to junior's account

STEP 7: BEGIN PREPARATION
         ├─ Uses: Roadmap as study guide
         ├─ Follows: Recommended topics in order
         ├─ Practices: LeetCode problems, HR scenarios
         ├─ Preparation: 3-4 months
         └─ Result: Interview-ready for Google

DATABASE QUERIES INVOLVED:
         -- Get approved experiences for roadmap
         SELECT r.*, q.* FROM rounds r
         JOIN questions q ON r.id = q.round_id
         JOIN experiences e ON r.experience_id = e.id
         WHERE e.drive_id IN (
           SELECT id FROM drives WHERE company_id = 1
         ) AND e.approval_status = 'approved'
         
         -- Get topic frequency
         SELECT topic, COUNT(*) as frequency
         FROM questions
         WHERE difficulty = 'easy'
         GROUP BY topic
         ORDER BY frequency DESC

ROADMAP GENERATION TIME:
         ├─ From cache: <100 ms
         ├─ Fresh computation: 2-5 seconds
         └─ Most views: Served from cache
```

---

## 7. ANALYTICS WORKFLOW: DATA TO INSIGHTS

```
APPROVAL EVENT:
Admin approves experience #101 → Trigger analytics update

STEP 1: TRIGGER
         ├─ Event: Experience approved
         ├─ Endpoint: PUT /api/admin/submissions/:id/approve
         ├─ Handler: Create approval record
         └─ Trigger: analyticsService.updateCache(experience_id)

STEP 2: DATA EXTRACTION
         ├─ Query: SELECT all approved experiences for company
         ├─ Join: With rounds and questions tables
         ├─ Filter: Only where approval_status = 'approved'
         ├─ Get: All topics, questions, difficulties, skills
         └─ Data: Ready for aggregation

         SELECT e.id, e.company_name, r.round_type, r.difficulty_level,
                q.category, q.difficulty, r.skills_tested
         FROM experiences e
         JOIN rounds r ON e.id = r.experience_id
         JOIN questions q ON r.id = q.round_id
         WHERE e.approval_status = 'approved'
         AND e.drive_id IN (SELECT id FROM drives WHERE company_id = 1)

STEP 3: ANALYTICS COMPUTATION

         A. TOPIC FREQUENCY ANALYSIS
         ├─ Count: Occurrences of each topic
         ├─ Query:
         │  SELECT q.category as topic, COUNT(*) as frequency
         │  FROM questions q
         │  WHERE ... (approved experiences only)
         │  GROUP BY q.category
         │  ORDER BY frequency DESC
         │
         ├─ Calculate: Percentage
         │  frequency = 450, total = 500 → 90%
         │
         └─ Result: [
              { topic: "Data Structures", frequency: 450, percentage: 90 },
              { topic: "Algorithms", frequency: 390, percentage: 78 },
              ...
            ]

         B. DIFFICULTY DISTRIBUTION
         ├─ Count: By difficulty level
         ├─ Query:
         │  SELECT r.difficulty_level, COUNT(*) as count
         │  FROM rounds r
         │  WHERE ... (approved)
         │  GROUP BY r.difficulty_level
         │
         ├─ Calculate: Percentages
         │  easy: 100/500 = 20%
         │  medium: 250/500 = 50%
         │  hard: 150/500 = 30%
         │
         └─ Result: { easy: 20%, medium: 50%, hard: 30% }

         C. SKILLS MATRIX
         ├─ Extract: skills from JSON column
         ├─ Count: Frequency of each skill
         ├─ Map: Skill → Round type → Difficulty
         ├─ Aggregate: Cross-tabulation
         │
         └─ Result: [
              { skill: "Problem Solving", frequency: 450, round: "Technical" },
              { skill: "Communication", frequency: 300, round: "HR" },
              ...
            ]

         D. ROUND ANALYSIS
         ├─ Count: Rounds per experience
         │  average_rounds = total_rounds / total_experiences
         │  = 1500 / 500 = 3.0
         │
         ├─ Distribution: By round type
         │  HR: 33%, Technical: 34%, Coding: 33%
         │
         ├─ Success Rate: By round
         │  HR: 95%, Technical: 85%, Coding: 70%
         │
         └─ Duration Average: Per round type
            HR: 25 min, Technical: 45 min, Coding: 90 min

         E. CTC STATISTICS
         ├─ Min: MIN(ctc_offered) = 10 LPA
         ├─ Max: MAX(ctc_offered) = 35 LPA
         ├─ Avg: AVG(ctc_offered) = 22.5 LPA
         ├─ Median: PERCENTILE_CONT(ctc_offered, 0.5) = 21 LPA
         └─ Std Dev: Standard deviation for distribution

         F. SUCCESS RATE
         ├─ Total Experiences: 500
         ├─ Selected: 225 (45%)
         ├─ Not selected: 275 (55%)
         └─ Success Rate: 45%

STEP 4: CACHE STORAGE
         ├─ INSERT INTO analytics_cache (
         │   company_id = 1,
         │   topic_name = "Data Structures",
         │   topic_frequency = 450,
         │   topic_difficulty_avg = 7.2,
         │   topic_success_rate = 48,
         │   round_type = "Technical",
         │   avg_rounds_per_experience = 3.0,
         │   total_experiences = 500,
         │   approved_experiences = 500,
         │   approval_rate = 92,
         │   avg_ctc = 22.5,
         │   min_ctc = 10,
         │   max_ctc = 35,
         │   success_rate = 45,
         │   avg_interview_duration = 185,
         │   cached_at = NOW(),
         │   expires_at = DATE_ADD(NOW(), INTERVAL 1 HOUR)
         │ )
         │
         └─ Execution: 1-2 seconds

STEP 5: DASHBOARD DISPLAY
         ├─ Admin accesses: GET /api/admin/analytics/dashboard
         ├─ Query: Read from analytics_cache
         │  ├─ Performance: < 100 ms (vs 5 seconds if computed fresh)
         │  └─ Freshness: Updated within 1 hour
         │
         ├─ Format: For chart visualization
         │  ├─ Topic frequency chart (bar chart)
         │  ├─ Difficulty distribution (pie chart)
         │  ├─ CTC range distribution (histogram)
         │  ├─ Round type distribution (pie chart)
         │  ├─ Success rate trend (line chart)
         │  └─ Skills matrix (table/heatmap)
         │
         └─ Display: In admin dashboard

         CHARTS GENERATED:
         ┌─ Topic Frequency Bar Chart
         │  Y-axis: Frequency (0-500)
         │  X-axis: Topics (Data Structures, Algorithms, DBMS, ...)
         │  Bars: Height = frequency count
         │  ✓ Identifies most asked topics
         │
         ├─ Difficulty Pie Chart
         │  Easy: 20% (blue)
         │  Medium: 50% (yellow)
         │  Hard: 30% (red)
         │  ✓ Shows interview difficulty distribution
         │
         ├─ CTC Distribution Histogram
         │  X-axis: CTC Range (10-35 LPA)
         │  Y-axis: Count of offers
         │  ✓ Salary expectation range
         │
         ├─ Skills Frequency Table
         │  Columns: Skill, Count, % Asked, Priority
         │  ✓ Which skills to focus on
         │
         └─ Round Duration Comparison
            Bars: HR=25, Technical=45, Coding=90 (minutes)
            ✓ Time management for interview prep

STEP 6: CACHE INVALIDATION
         ├─ Time-based: Expires after 1 hour
         ├─ Event-based: On new approval
         ├─ Manual: Admin refresh button
         └─ Strategy: Pre-compute at off-peak times

STEP 7: REPORTING
         ├─ Admin generates: GET /api/admin/analytics/report
         │  ├─ Date range: 2026-01-01 to 2026-02-05
         │  ├─ Company: Google India
         │  └─ Format: PDF/CSV
         │
         ├─ Report includes:
         │  ├─ Summary statistics
         │  ├─ Trend analysis
         │  ├─ Charts and visualizations
         │  ├─ Recommendations
         │  └─ Historical comparison
         │
         └─ Audience: Placement cell, management

TIME COMPLEXITY:
         ├─ Approval: O(1)
         ├─ Data extraction: O(n) where n = approved experiences
         ├─ Aggregation: O(n) with GROUP BY operations
         ├─ Cache write: O(m) where m = aggregation results
         ├─ Cache read: O(1)
         └─ Total time: 2-5 seconds (first time), <100 ms (cached)

SPACE COMPLEXITY:
         ├─ Cache storage: O(m) where m = number of metrics
         ├─ Per company: ~50-100 rows in analytics_cache
         └─ Total for all companies: ~5000 rows (500 companies)
```

---

## 8. DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION LAYER                       │
│  Admin | Student | Junior | Authentication | Navigation        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND (UI)                          │
│  Components, Pages, Forms, Charts, Services                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              HTTP/REST API REQUEST (AXIOS)                      │
│  Method: GET/POST/PUT/DELETE                                    │
│  URL: /api/admin/analytics, /api/student/experiences, etc.      │
│  Headers: Authorization: Bearer JWT_TOKEN                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS MIDDLEWARE CHAIN                     │
│  Auth Middleware → Role Middleware → Validation → Controller    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       CONTROLLERS                               │
│  adminController | studentController | juniorController        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        SERVICES                                 │
│  authService | companyService | analyticsService |             │
│  experienceService | roadmapService | approvalService          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DATA MODELS                                │
│  User | Company | Drive | Experience | Round | Approval         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      MYSQL DATABASE                             │
│  users | companies | drives | experiences | rounds | questions  │
│  approvals | analytics_cache | topics_master | skills_master   │
└─────────────────────────────────────────────────────────────────┘
```

---

**Last Updated:** February 5, 2026  
**Status:** Complete Documentation  
**Next:** Begin Phase 2 - Backend Implementation
