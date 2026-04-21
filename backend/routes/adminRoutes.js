const express = require('express');
const CompanyController = require('../controllers/CompanyController');
const DriveController = require('../controllers/DriveController');
const ExperienceController = require('../controllers/ExperienceController');
const ExperienceAccessController = require('../controllers/ExperienceAccessController');
const { validators, handleValidationErrors, body } = require('../middlewares/validationMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { excelImportUpload } = require('../middlewares/uploadMiddleware');
const EmailController = require('../controllers/EmailController');

const router = express.Router();

/**
 * Admin Routes (Protected)
 * All routes require authentication and admin role
 */

router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// ========== COMPANY MANAGEMENT ==========

// Get all companies
router.get('/companies', CompanyController.getAllCompanies);

// Get company batches
router.get('/companies/batches', CompanyController.getCompanyBatches);

// Create company batch
router.post(
  '/companies/batches',
  validators.companyBatchValidation,
  handleValidationErrors,
  CompanyController.createCompanyBatch
);

// Get company by ID
router.get('/companies/:id', validators.idParam, handleValidationErrors, CompanyController.getCompany);

// Create company
router.post(
  '/companies',
  validators.companyValidation,
  handleValidationErrors,
  CompanyController.createCompany
);

// Update company
router.put(
  '/companies/:id',
  validators.idParam,
  handleValidationErrors,
  CompanyController.updateCompany
);

// Delete company
router.delete('/companies/:id', validators.idParam, handleValidationErrors, CompanyController.deleteCompany);

// ========== DRIVE MANAGEMENT ==========

// Get all drives
router.get('/drives', DriveController.getAllDrives);

// Get drive batches
router.get('/drives/batches', DriveController.getDriveBatches);

// Create drive batch
router.post(
  '/drives/batches',
  validators.companyBatchValidation,
  handleValidationErrors,
  DriveController.createDriveBatch
);

// Get drive by ID
router.get('/drives/:id', validators.idParam, handleValidationErrors, DriveController.getDrive);

// Create drive
router.post(
  '/drives',
  validators.driveValidation,
  handleValidationErrors,
  DriveController.createDrive
);

// Update drive
router.put(
  '/drives/:id',
  validators.driveValidation,
  handleValidationErrors,
  DriveController.updateDrive
);

// Delete drive
router.delete('/drives/:id', validators.idParam, handleValidationErrors, DriveController.deleteDrive);

// ========== EXPERIENCE/SUBMISSION MANAGEMENT ==========

// Get pending submissions
router.get('/submissions/pending', ExperienceController.getPendingSubmissions);

// Get all submissions (any status)
router.get('/submissions/all', ExperienceController.getAllSubmissions);

// Approve submission
router.post(
  '/submissions/:id/approve',
  validators.idParam,
  handleValidationErrors,
  ExperienceController.approveSubmission
);

// Reject submission
router.post(
  '/submissions/:id/reject',
  validators.idParam,
  handleValidationErrors,
  ExperienceController.rejectSubmission
);

// Get detailed experience data
router.get('/experiences/:id/details', validators.idParam, handleValidationErrors, ExperienceController.getExperienceDetails);

// Delete experience (admin)
router.delete('/experiences/:id', validators.idParam, handleValidationErrors, ExperienceController.deleteExperienceAdmin);

// ========== EXPERIENCE ACCESS MANAGEMENT ==========

// Get list of allowed students for submitting experience
router.get('/experience-access', ExperienceAccessController.getAccessList);

// Add or update allowed student by roll number
router.post('/experience-access', ExperienceAccessController.addOrUpdateAccess);

// Import allowed students from Excel
router.post(
  '/experience-access/import',
  excelImportUpload,
  ExperienceAccessController.importFromExcel
);

// Remove allowed student by record id
router.delete(
  '/experience-access/:id',
  validators.idParam,
  handleValidationErrors,
  ExperienceAccessController.removeAccess
);

// ========== ANALYTICS ==========
const AnalyticsController = require('../controllers/AnalyticsController');

// Get dashboard analytics
router.get('/analytics/dashboard', AnalyticsController.getDashboardStats);

// ========== EMAIL UTILITIES ==========
router.get('/email/status', EmailController.getSmtpStatus);
router.post(
  '/email/test',
  [
    body('to').isEmail().withMessage('Valid recipient email is required').normalizeEmail(),
    body('studentName').optional().trim(),
    body('companyName').optional().trim(),
  ],
  handleValidationErrors,
  EmailController.sendTestEmail
);

module.exports = router;
