const DriveService = require('../services/DriveService');
const constants = require('../config/constants');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/queryUtils');

/**
 * Drive Controller
 */
class DriveController {
  /**
   * Get all drives
   * GET /api/admin/drives
   */
  static async getAllDrives(req, res, next) {
    try {
      const {
        page = 1, limit = 20, company_id, status,
        date_from, date_to, ctc_min, ctc_max, batch
      } = req.query;
      const { limit: limitNum, offset } = getPaginationParams(page, limit);

      const filters = {
        company_id: company_id ? parseInt(company_id) : null,
        status,
        date_from,
        date_to,
        ctc_min: ctc_min ? parseFloat(ctc_min) : null,
        ctc_max: ctc_max ? parseFloat(ctc_max) : null,
        batch
      };

      const result = await DriveService.getAllDrives(limitNum, offset, filters);

      res.status(constants.HTTP_OK).json({
        success: true,
        ...formatPaginatedResponse(result.data, result.total, page, limitNum),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get drive by ID
   * GET /api/admin/drives/:id
   */
  static async getDrive(req, res, next) {
    try {
      const drive = await DriveService.getDriveById(req.params.id);

      res.status(constants.HTTP_OK).json({
        success: true,
        data: drive,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create drive
   * POST /api/admin/drives
   */
  static async createDrive(req, res, next) {
    try {
      const drive = await DriveService.createDrive(req.body, req.user.id);

      res.status(constants.HTTP_CREATED).json({
        success: true,
        message: 'Drive created successfully',
        data: drive,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update drive
   * PUT /api/admin/drives/:id
   */
  static async updateDrive(req, res, next) {
    try {
      const drive = await DriveService.updateDrive(req.params.id, req.body);

      res.status(constants.HTTP_OK).json({
        success: true,
        message: 'Drive updated successfully',
        data: drive,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete drive
   * DELETE /api/admin/drives/:id
   */
  static async deleteDrive(req, res, next) {
    try {
      const result = await DriveService.deleteDrive(req.params.id);

      res.status(constants.HTTP_OK).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DriveController;