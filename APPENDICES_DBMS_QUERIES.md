# APPENDICES
## DBMS QUERIES

This appendix contains sample PostgreSQL queries used in the Placement Community Portal database. The queries are based on the actual project schema, including `users`, `companies`, `drives`, `experiences`, `rounds`, `questions`, and `experience_access_students`.

---

## 1. View All Active Companies

```sql
SELECT id, name, industry, headquarters, website
FROM companies
WHERE is_active = TRUE
ORDER BY name;
```

## 2. List Upcoming Placement Drives with Company Name

```sql
SELECT d.id, c.name AS company_name, d.role_name, d.ctc, d.interview_date, d.drive_status
FROM drives d
JOIN companies c ON d.company_id = c.id
WHERE d.drive_status = 'upcoming'
ORDER BY d.interview_date;
```

## 3. Insert a New Company Record

```sql
INSERT INTO companies (
  name, description, website, industry, headquarters, is_active
) VALUES (
  'Example Tech',
  'Product-based software company',
  'https://exampletech.com',
  'Software',
  'Bengaluru',
  TRUE
);
```

## 4. Insert a New Placement Drive

```sql
INSERT INTO drives (
  company_id, role_name, ctc, interview_date, registration_deadline,
  total_positions, drive_status, mode
) VALUES (
  1, 'Software Engineer', 12.50, '2026-05-10', '2026-05-01',
  20, 'upcoming', 'online'
);
```

## 5. View Student Experience Submissions

```sql
SELECT e.id, u.first_name, u.last_name, e.company_name, e.role_applied,
       e.result, e.approval_status, e.submitted_at
FROM experiences e
JOIN users u ON e.user_id = u.id
WHERE u.role = 'student'
ORDER BY e.submitted_at DESC;
```

## 6. Find All Pending Experiences for Admin Review

```sql
SELECT e.id, e.company_name, e.role_applied, u.email, e.submitted_at
FROM experiences e
JOIN users u ON e.user_id = u.id
WHERE e.approval_status = 'pending'
ORDER BY e.submitted_at ASC;
```

## 7. Approve an Experience Submission

```sql
UPDATE experiences
SET approval_status = 'accepted',
    approved_at = NOW(),
    approved_by = 1,
    admin_comments = 'Verified and approved'
WHERE id = 5;
```

## 8. Reject an Experience Submission

```sql
UPDATE experiences
SET approval_status = 'rejected',
    approved_at = NOW(),
    approved_by = 1,
    rejection_reason = 'Incomplete round details'
WHERE id = 8;
```

## 9. Show Round Details for a Particular Experience

```sql
SELECT r.round_number, r.round_type, r.duration_minutes,
       r.difficulty_level, r.result, r.topics, r.skills_tested
FROM rounds r
WHERE r.experience_id = 5
ORDER BY r.round_number;
```

## 10. Count Experiences Company-Wise

```sql
SELECT company_name, COUNT(*) AS total_experiences
FROM experiences
GROUP BY company_name
ORDER BY total_experiences DESC;
```

## 11. Count Approved Experiences for Junior Portal Access

```sql
SELECT company_name, COUNT(*) AS approved_count
FROM experiences
WHERE approval_status = 'accepted'
GROUP BY company_name
ORDER BY approved_count DESC;
```

## 12. Find Most Common Question Categories

```sql
SELECT q.category, COUNT(*) AS frequency
FROM questions q
GROUP BY q.category
ORDER BY frequency DESC;
```

## 13. Search Technical Rounds Containing a Topic in JSONB

```sql
SELECT r.id, r.round_type, r.topics, e.company_name
FROM rounds r
JOIN experiences e ON r.experience_id = e.id
WHERE r.round_type = 'Technical'
  AND r.topics ? 'DBMS';
```

## 14. Display Company-Wise Average Difficulty

```sql
SELECT e.company_name,
       ROUND(AVG(
         CASE e.overall_difficulty
           WHEN 'easy' THEN 1
           WHEN 'medium' THEN 2
           WHEN 'hard' THEN 3
         END
       ), 2) AS average_difficulty_score
FROM experiences e
GROUP BY e.company_name
ORDER BY average_difficulty_score DESC;
```

## 15. View Students Allowed to Submit Experiences

```sql
SELECT roll_number, student_name, email, company_name, is_active
FROM experience_access_students
WHERE is_active = TRUE
ORDER BY student_name;
```

## 16. Add an Eligible Student to Experience Access List

```sql
INSERT INTO experience_access_students (
  roll_number, email, student_name, company_name, is_active, created_by
) VALUES (
  '22CSE101',
  'student@example.com',
  'Arun Kumar',
  'Example Tech',
  TRUE,
  1
);
```

## 17. Company and Drive Summary Report

```sql
SELECT c.name AS company_name,
       COUNT(DISTINCT d.id) AS total_drives,
       COUNT(DISTINCT e.id) AS total_experiences,
       COUNT(DISTINCT CASE WHEN e.approval_status = 'accepted' THEN e.id END) AS approved_experiences
FROM companies c
LEFT JOIN drives d ON d.company_id = c.id
LEFT JOIN experiences e ON e.drive_id = d.id
GROUP BY c.name
ORDER BY c.name;
```

## 18. Delete a Cancelled Drive

```sql
DELETE FROM drives
WHERE id = 12
  AND drive_status = 'cancelled';
```

---

## Conclusion

These queries demonstrate how the Placement Community Portal uses DBMS concepts such as selection, projection, joins, grouping, aggregation, updates, deletion, and JSONB-based querying in PostgreSQL. They can be included as appendix material in the final project report or supporting documentation.
