module.exports = {
  // HTTP Status Codes
  HTTP_OK: 200,
  HTTP_CREATED: 201,
  HTTP_BAD_REQUEST: 400,
  HTTP_UNAUTHORIZED: 401,
  HTTP_FORBIDDEN: 403,
  HTTP_NOT_FOUND: 404,
  HTTP_CONFLICT: 409,
  HTTP_INTERNAL_SERVER_ERROR: 500,

  // User Roles
  ROLE_ADMIN: 'admin',
  ROLE_STUDENT: 'student',
  ROLE_JUNIOR: 'junior',

  ROLES: ['admin', 'student', 'junior'],

  // User Status
  USER_ACTIVE: true,
  USER_INACTIVE: false,

  // Interview Result
  RESULT_PASS: 'pass',
  RESULT_FAIL: 'fail',
  RESULT_NOT_SURE: 'not_sure',

  INTERVIEW_RESULTS: ['pass', 'fail', 'not_sure'],

  // Approval Status
  APPROVAL_PENDING: 'pending',
  APPROVAL_APPROVED: 'approved',
  APPROVAL_REJECTED: 'rejected',

  APPROVAL_STATUSES: ['pending', 'approved', 'rejected'],

  // Verification Status
  VERIFICATION_VERIFIED: 'verified',
  VERIFICATION_UNVERIFIED: 'unverified',
  VERIFICATION_FLAGGED: 'flagged',

  VERIFICATION_STATUSES: ['verified', 'unverified', 'flagged'],

  // Round Types
  ROUND_HR: 'HR',
  ROUND_TECHNICAL: 'Technical',
  ROUND_CODING: 'Coding',
  ROUND_MANAGERIAL: 'Managerial',
  ROUND_GROUP_DISCUSSION: 'Group_Discussion',
  ROUND_OTHER: 'Other',

  ROUND_TYPES: ['HR', 'Technical', 'Coding', 'Managerial', 'Group_Discussion', 'Other'],

  // Difficulty Levels
  DIFFICULTY_EASY: 'easy',
  DIFFICULTY_MEDIUM: 'medium',
  DIFFICULTY_HARD: 'hard',

  DIFFICULTY_LEVELS: ['easy', 'medium', 'hard'],

  // Drive Status
  DRIVE_UPCOMING: 'upcoming',
  DRIVE_ONGOING: 'ongoing',
  DRIVE_COMPLETED: 'completed',
  DRIVE_CANCELLED: 'cancelled',

  DRIVE_STATUSES: ['upcoming', 'ongoing', 'completed', 'cancelled'],

  // Interview Mode
  MODE_ONLINE: 'online',
  MODE_OFFLINE: 'offline',
  MODE_HYBRID: 'hybrid',

  INTERVIEW_MODES: ['online', 'offline', 'hybrid'],

  // Skill Level
  SKILL_BEGINNER: 'beginner',
  SKILL_INTERMEDIATE: 'intermediate',
  SKILL_ADVANCED: 'advanced',

  SKILL_LEVELS: ['beginner', 'intermediate', 'advanced'],

  // Priority Level
  PRIORITY_CRITICAL: 'critical',
  PRIORITY_IMPORTANT: 'important',
  PRIORITY_NICE_TO_HAVE: 'nice_to_have',

  PRIORITY_LEVELS: ['critical', 'important', 'nice_to_have'],

  // Error Messages
  ERROR_INVALID_CREDENTIALS: 'Invalid email or password',
  ERROR_USER_NOT_FOUND: 'User not found',
  ERROR_EMAIL_EXISTS: 'Email already registered',
  ERROR_UNAUTHORIZED: 'Unauthorized access',
  ERROR_FORBIDDEN: 'Access forbidden',
  ERROR_NOT_FOUND: 'Resource not found',
  ERROR_INVALID_INPUT: 'Invalid input data',
  ERROR_SERVER_ERROR: 'Internal server error',

  // Success Messages
  SUCCESS_LOGIN: 'Login successful',
  SUCCESS_LOGOUT: 'Logout successful',
  SUCCESS_REGISTERED: 'User registered successfully',
  SUCCESS_DATA_UPDATED: 'Data updated successfully',
  SUCCESS_DATA_CREATED: 'Data created successfully',
  SUCCESS_DATA_DELETED: 'Data deleted successfully',

  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,

  // Email Regex
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Password Regex (min 8 chars, 1 uppercase, 1 number, 1 special char)
  PASSWORD_REGEX: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,

  // Token Types
  TOKEN_TYPE_ACCESS: 'access',
  TOKEN_TYPE_REFRESH: 'refresh',
};
