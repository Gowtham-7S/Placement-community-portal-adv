const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { pool } = require('../config/database');
const ExperienceAccessService = require('../services/ExperienceAccessService');
const logger = require('../utils/logger');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (id, role, roles = [role]) => {
  return jwt.sign({ id, role, roles }, process.env.JWT_SECRET || 'default_secret_key', {
    expiresIn: '1d',
  });
};

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const deriveRolesFromEmail = (email, persistedRole) => {
  const normalizedEmail = normalizeEmail(email);
  const roles = [];

  const adminEmails = String(process.env.ADMIN_EMAILS || 'gowthamsubramaniam789@gmail.com')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean);

  const campusDomain = String(process.env.CAMPUS_DOMAIN || 'bitsathy.ac.in')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase();

  const isCampusEmail = normalizedEmail.endsWith(`@${campusDomain}`);
  const isAdminEmail = adminEmails.includes(normalizedEmail);

  if (isAdminEmail) roles.push('admin');
  if (isCampusEmail) {
    // Default campus users go to Junior. Student is granted only via Experience Access.
    roles.push('junior');
  }

  // If admin is also on campus domain, allow multiple portals.
  if (isAdminEmail && isCampusEmail) {
    if (!roles.includes('student')) roles.push('student');
  }

  const unique = [...new Set(roles)];

  if (unique.length === 0) return [];
  return unique;
};

const resolvePrimaryRole = (roles, preferredRole) => {
  if (preferredRole && roles.includes(preferredRole)) return preferredRole;
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('student')) return 'student';
  if (roles.includes('junior')) return 'junior';
  return roles[0] || 'junior';
};

// @desc    Register a new user (Student/Junior)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { first_name, last_name, email, password, role, phone, department, batch_year } = req.body;

  try {
    // 1. Check if user already exists
    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 3. Insert user
    // Default role is 'junior' if not specified, but we allow 'student'
    const validRole = ['student', 'junior', 'admin'].includes(role) ? role : 'junior';

    const newUser = await pool.query(
      `INSERT INTO users (
        first_name, last_name, email, password_hash, role, phone, department, batch_year
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING id, first_name, last_name, email, role, created_at`,
      [first_name, last_name, email, password_hash, validRole, phone, department, batch_year]
    );

    const user = newUser.rows[0];

    // 4. Generate Token
    const token = generateToken(user.id, user.role, [user.role]);

    logger.info(`New user registered: ${email} (${user.role})`);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // 1. Check for user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const roles = deriveRolesFromEmail(user.email, user.role);
    if (roles.length === 0) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_DOMAIN_NOT_ALLOWED',
        message: 'Only campus email addresses can access the junior portal.'
      });
    }
    const preferredRole = req.body.preferred_role;

    if (preferredRole && !roles.includes(preferredRole)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ROLE_SELECTION',
        message: 'Selected role is not available for this account'
      });
    }
    const activeRole = preferredRole || user.role || resolvePrimaryRole(roles);

    // 3. Generate Token
    const token = generateToken(user.id, activeRole, roles);

    // 4. Update last login (optional, if we had a last_login field)
    // await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: activeRole,
        roles,
        active_role: activeRole
      },
      available_roles: roles
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login/Register user with Google
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res, next) => {
  const { id_token, preferred_role } = req.body;

  if (!id_token) {
    return res.status(400).json({ success: false, message: 'Google ID token is required' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = normalizeEmail(payload?.email);
    const firstName = payload?.given_name || 'User';
    const lastName = payload?.family_name || '';

    if (!email) {
      return res.status(400).json({ success: false, message: 'Unable to read email from Google account' });
    }

    let userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = userResult.rows[0];

    const derivedRoles = deriveRolesFromEmail(email, user?.role);
    if (derivedRoles.length === 0) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_DOMAIN_NOT_ALLOWED',
        message: 'Only campus email addresses can access the junior portal.'
      });
    }

    let accessRoles = derivedRoles;
    if (email) {
      try {
        const hasStudentAccess = await ExperienceAccessService.hasEmailAccessForStudent(email);
        if (hasStudentAccess && !accessRoles.includes('student')) {
          accessRoles = [...accessRoles, 'student'];
        }
      } catch (accessError) {
        logger.warn('Experience access lookup failed', accessError);
      }
    }

    if (accessRoles.length > 1 && !preferred_role) {
      return res.status(409).json({
        success: false,
        code: 'ROLE_SELECTION_REQUIRED',
        message: 'Multiple portal roles available. Select one role to continue.',
        available_roles: accessRoles
      });
    }

    if (preferred_role && !accessRoles.includes(preferred_role)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ROLE_SELECTION',
        message: 'Selected role is not available for this account'
      });
    }

    const activeRole = resolvePrimaryRole(accessRoles, preferred_role);

    if (!user) {
      const randomPasswordHash = await bcrypt.hash(
        `google-${payload.sub}-${crypto.randomBytes(8).toString('hex')}`,
        10
      );

      const created = await pool.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id, first_name, last_name, email, role, created_at`,
        [firstName, lastName, email, randomPasswordHash, activeRole]
      );
      user = created.rows[0];
    } else if (user.role !== activeRole) {
      // Keep DB role aligned to selected active role for compatibility with existing modules.
      const updated = await pool.query(
        'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [activeRole, user.id]
      );
      user = updated.rows[0];
    }

    const token = generateToken(user.id, activeRole, accessRoles);

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      token,
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`.trim(),
        email: user.email,
        role: activeRole,
        roles: derivedRoles,
        active_role: activeRole
      },
      available_roles: accessRoles
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await pool.query('SELECT id, first_name, last_name, email, role FROM users WHERE id = $1', [req.user.id]);
    const row = user.rows[0];
    const roles = req.user.roles && Array.isArray(req.user.roles)
      ? req.user.roles
      : deriveRolesFromEmail(row?.email, row?.role);
    const activeRole = req.user.role || resolvePrimaryRole(roles);
    
    res.status(200).json({
      success: true,
      data: {
        ...row,
        name: `${row?.first_name || ''} ${row?.last_name || ''}`.trim(),
        role: activeRole,
        roles,
        active_role: activeRole
      }
    });
  } catch (err) {
    next(err);
  }
};
