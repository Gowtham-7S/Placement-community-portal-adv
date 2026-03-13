const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/AuthController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Validation Rules
const registerValidation = [
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['student', 'junior', 'admin']).withMessage('Invalid role'),
  body('department').optional().isString(),
  body('batch_year').optional({ checkFalsy: true }).isInt()
];

const loginValidation = [
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').exists().withMessage('Password is required')
];

const googleValidation = [
  body('id_token').notEmpty().withMessage('Google ID token is required'),
  body('preferred_role').optional().isIn(['student', 'junior', 'admin']).withMessage('Invalid role selection')
];

// Routes

// POST /api/auth/register
router.post('/register', registerValidation, authController.register);

// POST /api/auth/login
router.post('/login', loginValidation, authController.login);

// POST /api/auth/google
router.post('/google', googleValidation, authController.googleLogin);

// GET /api/auth/me
router.get('/me', protect, authController.getMe);

module.exports = router;
