const ExperienceService = require('../services/ExperienceService');
const constants = require('../config/constants');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/queryUtils');

/**
 * Experience Controller
 */
class ExperienceController {
  /**
   * Submit experience
   * POST /api/student/experience
   */
  static async submitExperience(req, res, next) {
    try {
      const experience = await ExperienceService.submitExperience(req.user.id, req.body);

      res.status(constants.HTTP_CREATED).json({
        success: true,
        message: constants.SUCCESS_DATA_CREATED,
        data: experience,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's experiences
   * GET /api/student/experiences
   */
  static async getUserExperiences(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const { limit: limitNum, offset } = getPaginationParams(page, limit);

      const result = await ExperienceService.getUserExperiences(req.user.id, limitNum, offset);

      res.status(constants.HTTP_OK).json({
        success: true,
        ...formatPaginatedResponse(result.data, result.total, page, limitNum),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get experience by ID
   * GET /api/student/experience/:id
   */
  static async getExperience(req, res, next) {
    try {
      const experience = await ExperienceService.getExperienceById(req.params.id);

      res.status(constants.HTTP_OK).json({
        success: true,
        data: experience,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update experience
   * PUT /api/student/experience/:id
   */
  static async updateExperience(req, res, next) {
    try {
      const experience = await ExperienceService.updateExperience(req.user.id, req.params.id, req.body);

      res.status(constants.HTTP_OK).json({
        success: true,
        message: constants.SUCCESS_DATA_UPDATED,
        data: experience,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete experience (Student only)
   * DELETE /api/student/experience/:id
   */
  static async deleteExperience(req, res, next) {
    try {
      const deleted = await ExperienceService.deleteExperienceByUser(req.user.id, req.params.id);

      res.status(constants.HTTP_OK).json({
        success: true,
        message: 'Experience deleted successfully',
        data: deleted,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending submissions (Admin only)
   * GET /api/admin/submissions/pending
   */
  static async getPendingSubmissions(req, res, next) {
    try {
      const {
        page = 1, limit = 20,
        date_from, date_to, ctc_min, company_name
      } = req.query;
      const { limit: limitNum, offset } = getPaginationParams(page, limit);

      const filters = {
        date_from,
        date_to,
        ctc_min: ctc_min ? parseFloat(ctc_min) : null,
        company_name
      };

      const result = await ExperienceService.getPendingSubmissions(limitNum, offset, filters);

      res.status(constants.HTTP_OK).json({
        success: true,
        ...formatPaginatedResponse(result.data, result.total, page, limitNum),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve submission (Admin only)
   * POST /api/admin/submissions/:id/approve
   */
  static async approveSubmission(req, res, next) {
    try {
      const result = await ExperienceService.approveSubmission(
        req.params.id,
        req.user.id,
        req.body.comment
      );

      res.status(constants.HTTP_OK).json({
        success: true,
        message: 'Submission approved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject submission (Admin only)
   * POST /api/admin/submissions/:id/reject
   */
  static async rejectSubmission(req, res, next) {
    try {
      const result = await ExperienceService.rejectSubmission(
        req.params.id,
        req.user.id,
        req.body.reason
      );

      res.status(constants.HTTP_OK).json({
        success: true,
        message: 'Submission rejected successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Get all submissions (Admin only) - any status
   * GET /api/admin/submissions/all
   */
  static async getAllSubmissions(req, res, next) {
    try {
      const { page = 1, limit = 30, status, company_name } = req.query;
      console.log('Admin getAllSubmissions - Received params:', { page, limit, status, company_name }); // Debug log
      const { limit: limitNum, offset } = getPaginationParams(page, limit);

      const filters = { status, company_name };
      const result = await ExperienceService.getAllSubmissions(limitNum, offset, filters);

      res.status(constants.HTTP_OK).json({
        success: true,
        ...formatPaginatedResponse(result.data, result.total, page, limitNum),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get detailed experience by ID (Admin only) - includes rounds and questions
   * GET /api/admin/experiences/:id/details
   */
  static async getExperienceDetails(req, res, next) {
    try {
      const { id } = req.params;
      const experience = await ExperienceService.getDetailedExperience(id);

      if (!experience) {
        return res.status(constants.HTTP_NOT_FOUND).json({
          success: false,
          message: constants.ERROR_NOT_FOUND,
        });
      }

      res.status(constants.HTTP_OK).json({
        success: true,
        data: experience,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete experience (Admin only)
   * DELETE /api/admin/experiences/:id
   */
  static async deleteExperienceAdmin(req, res, next) {
    try {
      const deleted = await ExperienceService.deleteExperienceAsAdmin(req.params.id);

      res.status(constants.HTTP_OK).json({
        success: true,
        message: 'Experience deleted successfully',
        data: deleted,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ExperienceController;
