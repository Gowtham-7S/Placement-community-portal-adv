# 🔌 REST API ENDPOINTS DOCUMENTATION

## API Base URL

```
Development: http://localhost:5000/api
Production: https://api.placement-portal.com/api
```

---

## 📋 AUTHENTICATION ENDPOINTS

### 1. User Registration

**Endpoint:** `POST /auth/register`

**Description:** Create a new user account

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "student",
  "phone": "+91-9876543210",
  "department": "Computer Science",
  "batch_year": 2024
}
```

**Validation Rules:**
- Email: Valid email format, must be unique
- Password: Min 8 chars, 1 uppercase, 1 number, 1 special char
- Role: Must be one of [admin, student, junior]
- Phone: Optional, valid format

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "email": "student@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "created_at": "2026-02-05T10:30:00Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- 400 Bad Request: Validation error
- 409 Conflict: Email already exists

---

### 2. User Login

**Endpoint:** `POST /auth/login`

**Description:** Authenticate user and get JWT token

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": 1,
    "email": "student@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student"
  },
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- 401 Unauthorized: Invalid credentials


### 3. User Logout

**Endpoint:** `POST /auth/logout`

**Description:** Logout user and invalidate token

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```


### 4. Get Current User

**Endpoint:** `GET /auth/me`

**Description:** Get current authenticated user details

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "student@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "student",
    "phone": "+91-9876543210",
    "department": "Computer Science",
    "batch_year": 2024,
    "profile_picture_url": "https://...",
    "created_at": "2026-02-05T10:30:00Z"
  }
}
```

---

## 🏢 ADMIN ENDPOINTS

### 1. Add Company

**Endpoint:** `POST /admin/companies`

**Authorization:** Admin only

**Request Body:**
```json
{
  "name": "Google India",
  "description": "Technology company focused on search and advertising",
  "logo_url": "https://logo.url.com/google.png",
  "website": "https://www.google.com",
  "headquarters": "Mountain View, CA",
  "industry": "Technology",
  "company_size": "10000+",
  "founded_year": 1998,
  "total_employees": 150000
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Company added successfully",
  "data": {
    "id": 1,
    "name": "Google India",
    "industry": "Technology",
    "website": "https://www.google.com",
    "created_at": "2026-02-05T10:30:00Z"
  }
}
```

---

### 2. Get All Companies

**Endpoint:** `GET /admin/companies`

**Authorization:** Admin only

**Query Parameters:**
```
?page=1&limit=10&search=Google&industry=Technology&sort=name
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Google India",
      "industry": "Technology",
      "company_size": "10000+",
      "logo_url": "https://...",
      "total_drives": 5,
      "total_experiences": 45,
      "created_at": "2026-02-05T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

### 3. Update Company

**Endpoint:** `PUT /admin/companies/:id`

**Authorization:** Admin only

**Request Body:** (Same as Add Company)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Company updated successfully",
  "data": { /* updated company */ }
}
```

---

### 4. Delete Company

**Endpoint:** `DELETE /admin/companies/:id`

**Authorization:** Admin only

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Company deleted successfully"
}
```

---

### 5. Create Interview Drive

**Endpoint:** `POST /admin/drives`

**Authorization:** Admin only

**Request Body:**
```json
{
  "company_id": 1,
  "role_name": "Software Engineer",
  "role_description": "Full-stack development role",
  "ctc_min": 15,
  "ctc_max": 25,
  "currency": "LPA",
  "interview_date": "2026-03-15",
  "registration_deadline": "2026-03-10",
  "total_positions": 50,
  "round_count": 3,
  "requirements": "3+ years experience",
  "eligible_batches": "2023,2024",
  "location": "Bangalore",
  "mode": "hybrid",
  "drive_details": {
    "selection_criteria": "CGPA > 7.0",
    "interview_pattern": "HR -> Technical -> Coding"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Drive created successfully",
  "data": {
    "id": 1,
    "company_id": 1,
    "role_name": "Software Engineer",
    "ctc_min": 15,
    "ctc_max": 25,
    "interview_date": "2026-03-15",
    "drive_status": "upcoming",
    "created_at": "2026-02-05T10:30:00Z"
  }
}
```

---

### 6. Get All Drives

**Endpoint:** `GET /admin/drives`

**Authorization:** Admin only

**Query Parameters:**
```
?company_id=1&status=upcoming&page=1&limit=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "company_id": 1,
      "company_name": "Google India",
      "role_name": "Software Engineer",
      "ctc_min": 15,
      "ctc_max": 25,
      "interview_date": "2026-03-15",
      "drive_status": "upcoming",
      "filled_positions": 10,
      "total_positions": 50,
      "total_submissions": 45,
      "created_at": "2026-02-05T10:30:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### 7. Update Drive

**Endpoint:** `PUT /admin/drives/:id`

**Authorization:** Admin only

**Request Body:** (Same as Create Drive)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Drive updated successfully",
  "data": { /* updated drive */ }
}
```

---

### 8. Get Pending Submissions

**Endpoint:** `GET /admin/submissions`

**Authorization:** Admin only

**Query Parameters:**
```
?status=pending&drive_id=1&sort=-submitted_at&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "user_id": 5,
      "user_name": "Rajesh Kumar",
      "drive_id": 1,
      "company_name": "Google India",
      "role_applied": "Software Engineer",
      "result": "pass",
      "approval_status": "pending",
      "submitted_at": "2026-02-04T14:30:00Z",
      "overall_difficulty": "medium",
      "round_count": 3,
      "data_completeness": 95
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### 9. Approve/Reject Submission

**Endpoint:** `POST /admin/submissions/:id/approve`

**Authorization:** Admin only

**Request Body:**
```json
{
  "status": "approved",
  "admin_comments": "Data looks complete and verified",
  "verification_status": "verified"
}
```

**Alternative for Rejection:**
```json
{
  "status": "rejected",
  "rejection_reason": "Incomplete round details",
  "admin_comments": "Please resubmit with complete information"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Submission approved successfully",
  "data": {
    "id": 101,
    "approval_status": "approved",
    "approved_at": "2026-02-05T10:30:00Z",
    "approved_by": 2
  }
}
```

---

### 10. Admin Analytics Dashboard

**Endpoint:** `GET /admin/analytics/dashboard`

**Authorization:** Admin only

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_companies": 50,
      "total_drives": 120,
      "total_submissions": 5420,
      "approved_submissions": 4850,
      "pending_submissions": 570,
      "rejected_submissions": 0,
      "approval_rate": 89.5
    },
    "student_participation": {
      "total_students": 2500,
      "students_submitted": 1850,
      "participation_rate": 74,
      "new_students_this_month": 150
    },
    "company_statistics": [
      {
        "company_id": 1,
        "company_name": "Google India",
        "total_drives": 3,
        "total_experiences": 450,
        "approval_rate": 92,
        // value now reflects CTC from the company drive rather than an average of submitted offers
        "avg_ctc": 22.5
      }
    ],
    "topic_frequency": [
      {
        "topic": "Data Structures",
        "frequency": 450,
        "percentage": 35,
        "difficulty_average": 7.2
      }
    ],
    "difficulty_distribution": {
      "easy": { count: 800, percentage: 16 },
      "medium": { count: 2800, percentage: 57 },
      "hard": { count: 1650, percentage: 27 }
    },
    "recent_submissions": [
      {
        "id": 101,
        "student_name": "Rajesh Kumar",
        "company": "Google India",
        "submitted_at": "2026-02-04T14:30:00Z"
      }
    ]
  }
}
```

---

### 11. Generate Analytics Report

**Endpoint:** `GET /admin/analytics/report`

**Authorization:** Admin only

**Query Parameters:**
```
?company_id=1&start_date=2026-01-01&end_date=2026-02-05&format=pdf
```

**Response:** PDF/CSV file download

---

## 👨‍🎓 STUDENT ENDPOINTS

### 1. Submit Interview Experience

**Endpoint:** `POST /student/experiences`

**Authorization:** Student only

**Request Body:**
```json
{
  "drive_id": 1,
  "company_name": "Google India",
  "role_applied": "Software Engineer",
  "result": "pass",
  "selected": true,
  "offer_received": true,
  "ctc_offered": 20.5,
  "negotiated_ctc": 22,
  "is_anonymous": false,
  "overall_difficulty": "medium",
  "interview_duration": 180,
  "confidence_level": 8,
  "overall_feedback": "Great experience, interviewers were supportive",
  
  "rounds": [
    {
      "round_number": 1,
      "round_type": "HR",
      "duration_minutes": 30,
      "result": "pass",
      "topics": ["Communication", "Career Goals", "Company Culture"],
      "questions": [
        "Tell me about yourself",
        "Why do you want to join Google?",
        "What are your career goals?"
      ],
      "difficulty_level": "easy",
      "tips_and_insights": "Be genuine and enthusiastic",
      "skills_tested": ["Communication", "Passion"]
    },
    {
      "round_number": 2,
      "round_type": "Technical",
      "duration_minutes": 60,
      "result": "pass",
      "topics": ["Data Structures", "Algorithms", "DBMS"],
      "questions": [
        "Design LRU Cache",
        "Longest substring without repeating characters",
        "Write query to find duplicate records"
      ],
      "difficulty_level": "hard",
      "tips_and_insights": "Practice on LeetCode, focus on optimization",
      "skills_tested": ["Problem Solving", "Coding", "DSA"],
      "approach_used": "Hash map with doubly linked list"
    },
    {
      "round_number": 3,
      "round_type": "Coding",
      "duration_minutes": 90,
      "result": "pass",
      "topics": ["System Design"],
      "questions": ["Design Instagram notification system"],
      "difficulty_level": "hard",
      "tips_and_insights": "Think about scalability, caching strategies",
      "skills_tested": ["System Design", "Architecture"],
      "problem_statement": "Design Instagram notification system for 1B users",
      "approach_used": "Message queue + Cache + Database replication"
    }
  ]
}
```

**Validation Rules:**
- Drive must exist
- At least 1 round required
- Each round must have: round_number, round_type, questions
- result must be: pass/fail/not_sure

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Experience submitted successfully",
  "data": {
    "id": 101,
    "user_id": 5,
    "drive_id": 1,
    "company_name": "Google India",
    "approval_status": "pending",
    "submitted_at": "2026-02-05T10:30:00Z"
  }
}
```

---

### 2. Get My Submissions

**Endpoint:** `GET /student/experiences`

**Authorization:** Student only

**Query Parameters:**
```
?status=all&page=1&limit=10&sort=-submitted_at
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "company_name": "Google India",
      "role_applied": "Software Engineer",
      "result": "pass",
      "approval_status": "approved",
      "submitted_at": "2026-02-04T14:30:00Z",
      "approved_at": "2026-02-05T09:00:00Z",
      "round_count": 3,
      "ctc_offered": 20.5
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### 3. Get Single Submission Details

**Endpoint:** `GET /student/experiences/:id`

**Authorization:** Student only

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 101,
    "user_id": 5,
    "drive_id": 1,
    "company_name": "Google India",
    "role_applied": "Software Engineer",
    "result": "pass",
    "selected": true,
    "offer_received": true,
    "ctc_offered": 20.5,
    "approval_status": "approved",
    "submitted_at": "2026-02-04T14:30:00Z",
    "approved_at": "2026-02-05T09:00:00Z",
    "overall_feedback": "Great experience...",
    "rounds": [ /* ... */ ]
  }
}
```

---

### 4. Update Submission (if pending)

**Endpoint:** `PUT /student/experiences/:id`

**Authorization:** Student only

**Validation:**
- Can only edit if approval_status = "pending"
- Cannot edit after approval/rejection

**Response (200 OK):** Updated experience data

---

### 5. Delete Submission

**Endpoint:** `DELETE /student/experiences/:id`

**Authorization:** Student only

**Validation:**
- Can only delete if approval_status = "pending"

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Submission deleted successfully"
}
```

---

### 6. Get Available Drives

**Endpoint:** `GET /student/drives`

**Authorization:** Student only

**Query Parameters:**
```
?company_id=1&status=upcoming&batch_year=2024&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "company_id": 1,
      "company_name": "Google India",
      "role_name": "Software Engineer",
      "ctc_min": 15,
      "ctc_max": 25,
      "interview_date": "2026-03-15",
      "registration_deadline": "2026-03-10",
      "drive_status": "upcoming",
      "mode": "hybrid",
      "location": "Bangalore",
      "has_submitted": false
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### 7. Get Company Insights

**Endpoint:** `GET /student/companies/:company_id/insights`

**Authorization:** Student only

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "company_name": "Google India",
    "total_experiences": 450,
    "approval_rate": 92,
    "recent_drives": [
      {
        "role_name": "Software Engineer",
        "ctc_avg": 22.5,
        "avg_rounds": 3,
        "success_rate": 45
      }
    ],
    "most_asked_topics": [
      {
        "topic": "Data Structures",
        "frequency_percentage": 85,
        "difficulty_average": 7.2
      }
    ]
  }
}
```

---

### 8. Update Profile

**Endpoint:** `PUT /student/profile`

**Authorization:** Student only

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+91-9876543210",
  "department": "Computer Science",
  "batch_year": 2024,
  "profile_picture_url": "https://...",
  "bio": "Passionate about DSA and System Design"
}
```

**Response (200 OK):** Updated user data

---

## 🎓 JUNIOR STUDENT ENDPOINTS

### 1. Search Companies

**Endpoint:** `GET /junior/companies`

**Authorization:** Junior only

**Query Parameters:**
```
?search=Google&industry=Technology&page=1&limit=20&sort=popularity
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Google India",
      "industry": "Technology",
      "website": "https://www.google.com",
      "logo_url": "https://...",
      "company_size": "10000+",
      "total_experiences": 450,
      "recent_drives": [
        {
          "role_name": "Software Engineer",
          "ctc_avg": 22.5,
          "interview_date": "2026-03-15"
        }
      ]
    }
  ],
  "pagination": { /* ... */ }
}
```

---

### 2. Get Company Details & Patterns

**Endpoint:** `GET /junior/companies/:company_id`

**Authorization:** Junior only

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "company": {
      "id": 1,
      "name": "Google India",
      "description": "...",
      "industry": "Technology",
      "website": "https://www.google.com",
      "headquarters": "Mountain View, CA",
      "company_size": "10000+"
    },
    "interview_patterns": {
      "avg_rounds": 3.2,
      "avg_duration": 210,
      "round_distribution": [
        { "round_type": "HR", "percentage": 33 },
        { "round_type": "Technical", "percentage": 34 },
        { "round_type": "Coding", "percentage": 33 }
      ],
      "success_rate": 45
    },
    "recent_drives": [
      {
        "role_name": "Software Engineer",
        "ctc_min": 15,
        "ctc_max": 25,
        "interview_date": "2026-03-15"
      }
    ],
    "most_asked_topics": [
      {
        "topic": "Data Structures",
        "frequency_percentage": 85,
        "difficulty": "medium"
      }
    ]
  }
}
```

---

### 3. Get Preparation Roadmap

**Endpoint:** `GET /junior/roadmap/:company_id`

**Authorization:** Junior only

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "company_name": "Google India",
    "executive_summary": {
      "company_name": "Google India",
      // this CTC is pulled from the latest company drive rather than a computed average
      "avg_ctc": 22.5,
      "avg_rounds": 3,
      "success_rate": 45,
      "total_experiences": 450
    },
    
    "interview_pattern": {
      "round_1": {
        "type": "HR",
        "avg_duration": "30 minutes",
        "focus_areas": ["Communication", "Career Goals", "Cultural Fit"]
      },
      "round_2": {
        "type": "Technical",
        "avg_duration": "60 minutes",
        "focus_areas": ["DSA", "DBMS", "System Design"]
      },
      "round_3": {
        "type": "Coding",
        "avg_duration": "90 minutes",
        "focus_areas": ["LeetCode Problems", "Optimization"]
      }
    },
    
    "top_topics": [
      {
        "rank": 1,
        "topic": "Data Structures",
        "frequency_percentage": 85,
        "difficulty_average": 7.2,
        "importance": "critical",
        "subtopics": ["Arrays", "Linked List", "Trees", "Graphs", "Heaps"]
      },
      {
        "rank": 2,
        "topic": "Algorithms",
        "frequency_percentage": 78,
        "difficulty_average": 7.5,
        "importance": "critical",
        "subtopics": ["Sorting", "Searching", "Dynamic Programming", "Greedy"]
      }
    ],
    
    "difficulty_breakdown": {
      "easy": 20,
      "medium": 50,
      "hard": 30
    },
    
    "hr_preparation": {
      "common_questions": [
        "Tell me about yourself",
        "Why do you want to join Google?",
        "What are your strengths?",
        "Tell about a challenging situation"
      ],
      "company_culture_tips": [
        "Google values innovation",
        "Collaboration is key",
        "Data-driven decisions"
      ],
      "preparation_time": "1-2 weeks",
      "resources": []
    },
    
    "technical_focus_areas": {
      "must_know": [
        "Array/String problems",
        "Tree/Graph traversals",
        "Basic DBMS queries"
      ],
      "good_to_know": [
        "Dynamic Programming",
        "Bit Manipulation",
        "Advanced SQL"
      ],
      "nice_to_have": [
        "Machine Learning basics",
        "Distributed Systems concepts"
      ]
    },
    
    "strategy_and_tips": {
      "time_management": "Spend 30 min on HR, 60 min on Technical, 90 min on Coding",
      "common_mistakes": [
        "Not asking clarifying questions",
        "Rushing to code",
        "Not thinking aloud"
      ],
      "success_tips": [
        "Practice mock interviews",
        "Solve 100+ LeetCode problems",
        "Understand complexity analysis"
      ],
      "preparation_timeline": "3-4 months of dedicated preparation"
    },
    
    "resources": {
      "free": ["LeetCode", "GeeksforGeeks", "YouTube channels"],
      "paid": ["InterviewBit", "AlgoExpert"],
      "books": ["Cracking the Coding Interview"]
    }
  }
}
```

---

### 4. Get Overall Statistics

**Endpoint:** `GET /junior/statistics`

**Authorization:** Junior only

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "platform_statistics": {
      "total_companies": 50,
      "total_drives": 120,
      "total_approved_experiences": 4850,
      "total_students_participated": 1850
    },
    
    "top_companies": [
      {
        "rank": 1,
        "company_name": "Google India",
        "total_experiences": 450,
        "success_rate": 45,
        "avg_ctc": 22.5
      }
    ],
    
    "trending_topics": [
      {
        "topic": "Data Structures",
        "frequency": 450,
        "trend": "trending_up"
      }
    ],
    
    "most_sought_companies": [
      {
        "company_name": "Microsoft India",
        "applications_count": 500,
        "selections_count": 225
      }
    ],
    
    "salary_statistics": {
      "avg_ctc": 18.5,
      "min_ctc": 10,
      "max_ctc": 35,
      "median_ctc": 17,
      "percentile_90": 28
    }
  }
}
```

---

### 5. Filter Companies by Skills/Topics

**Endpoint:** `GET /junior/companies/filter`

**Authorization:** Junior only

**Query Parameters:**
```
?skills=DSA,DBMS&difficulty=medium&ctc_min=15&ctc_max=25
```

**Response (200 OK):** Filtered companies list

---

## 📊 PUBLIC ENDPOINTS (No Auth Required)

### 1. Get Public Company Info

**Endpoint:** `GET /public/companies/:company_id`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Google India",
    "logo_url": "https://...",
    "website": "https://www.google.com",
    "industry": "Technology",
    "company_size": "10000+",
    "total_approved_experiences": 450
  }
}
```

---

### 2. Get Public Statistics

**Endpoint:** `GET /public/statistics`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total_companies": 50,
    "total_experiences": 4850,
    "total_students_benefited": 1850,
    "platform_uptime": 99.9
  }
}
```

---

## 🔍 ERROR RESPONSE FORMAT

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Access denied (authorization failed) |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| INTERNAL_ERROR | 500 | Server error |
| INVALID_TOKEN | 401 | JWT token invalid/expired |
| ROLE_MISMATCH | 403 | User role doesn't have access |

---

## 📌 AUTHENTICATION HEADER

All protected endpoints require:

```
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔄 PAGINATION FORMAT

For paginated responses:

```json
{
  "success": true,
  "data": [ /* ... */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 250,
    "pages": 25,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## 🎯 API VERSIONING

Current API Version: `v1`

For future versions, URLs would be:
```
/api/v2/auth/login
/api/v2/admin/companies
```

---

## 📝 RATE LIMITING

- **General limit:** 100 requests per minute per user
- **Auth endpoints:** 5 requests per minute (brute-force protection)
- **Analytics:** 10 requests per minute

---

**Last Updated:** February 5, 2026  
**Status:** Finalized  
**API Version:** 1.0
