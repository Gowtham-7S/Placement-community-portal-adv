const express = require('express');
const ExperienceController = require('../controllers/ExperienceController');
const { validators, handleValidationErrors } = require('../middlewares/validationMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

/**
 * Student Routes (Protected)
 * Routes for students who attended placement
 */

router.use(authMiddleware);
router.use(roleMiddleware('student'));

// ========== EXPERIENCE SUBMISSION ==========

// Submit interview experience
router.post(
  '/experience',
  validators.experienceValidation,
  handleValidationErrors,
  ExperienceController.submitExperience
);

// Get user's experiences
router.get('/experiences', ExperienceController.getUserExperiences);

// Get single experience
router.get('/experience/:id', validators.idParam, handleValidationErrors, ExperienceController.getExperience);

// Update experience (only pending submissions)
router.put(
  '/experience/:id',
  validators.idParam,
  handleValidationErrors,
  ExperienceController.updateExperience
);

// Delete experience (own submission)
router.delete(
  '/experience/:id',
  validators.idParam,
  handleValidationErrors,
  ExperienceController.deleteExperience
);

// ========== INSIGHTS & DATA ==========
// Student-specific insights endpoints will be added in next phase

module.exports = router;
