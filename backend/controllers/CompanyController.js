const CompanyService = require('../services/CompanyService');
const constants = require('../config/constants');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/queryUtils');

/**
 * Company Controller
 */
class CompanyController {
  /**
   * Get all companies
   * GET /api/admin/companies
   */
  static async getAllCompanies(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const { limit: limitNum, offset } = getPaginationParams(page, limit);

      const result = await CompanyService.getAllCompanies(limitNum, offset);

      res.status(constants.HTTP_OK).json({
        success: true,
        ...formatPaginatedResponse(result.data, result.total, page, limitNum),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get company by ID
   * GET /api/admin/companies/:id
   */
  static async getCompany(req, res, next) {
    try {
      const company = await CompanyService.getCompanyById(req.params.id);

      res.status(constants.HTTP_OK).json({
        success: true,
        data: company,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create company
   * POST /api/admin/companies
   */
  static async createCompany(req, res, next) {
    try {
      const company = await CompanyService.createCompany(req.body);

      res.status(constants.HTTP_CREATED).json({
        success: true,
        message: constants.SUCCESS_DATA_CREATED,
        data: company,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update company
   * PUT /api/admin/companies/:id
   */
  static async updateCompany(req, res, next) {
    try {
      const company = await CompanyService.updateCompany(req.params.id, req.body);

      res.status(constants.HTTP_OK).json({
        success: true,
        message: constants.SUCCESS_DATA_UPDATED,
        data: company,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete company
   * DELETE /api/admin/companies/:id
   */
  static async deleteCompany(req, res, next) {
    try {
      const result = await CompanyService.deleteCompany(req.params.id);

      res.status(constants.HTTP_OK).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CompanyController;
