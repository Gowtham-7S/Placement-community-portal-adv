ALTER TABLE experience_access_students
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);

ALTER TABLE experience_access_students
  ALTER COLUMN student_name DROP NOT NULL;
