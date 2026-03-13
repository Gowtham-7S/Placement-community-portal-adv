const Company = require('../models/Company');
const { AppError } = require('../middlewares/errorHandler');
const constants = require('../config/constants');

/**
 * Company Service
 * Handles company management operations
 */
class CompanyService {
  /**
   * Get all companies
   */
  static async getAllCompanies(limit = 20, offset = 0) {
    try {
      return await Company.getAll(limit, offset);
    } catch (error) {
      throw new Error(`Get companies error: ${error.message}`);
    }
  }

  /**
   * Get company by ID
   */
  static async getCompanyById(id) {
    try {
      const company = await Company.findById(id);
      if (!company) {
        throw new AppError(
          constants.ERROR_NOT_FOUND,
          constants.HTTP_NOT_FOUND,
          'COMPANY_NOT_FOUND'
        );
      }

      return company;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Get company error: ${error.message}`);
    }
  }

  /**
   * Create new company (Admin only)
   */
  static async createCompany(companyData) {
    try {
      // Check if company already exists
      const existing = await Company.findByName(companyData.name);
      if (existing) {
        throw new AppError(
          'Company already exists',
          constants.HTTP_CONFLICT,
          'COMPANY_EXISTS'
        );
      }

      return await Company.create(companyData);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Create company error: ${error.message}`);
    }
  }

  /**
   * Update company (Admin only)
   */
  static async updateCompany(id, updates) {
    try {
      const company = await Company.update(id, updates);
      if (!company) {
        throw new AppError(
          constants.ERROR_NOT_FOUND,
          constants.HTTP_NOT_FOUND,
          'COMPANY_NOT_FOUND'
        );
      }

      return company;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Update company error: ${error.message}`);
    }
  }

  /**
   * Delete company (Admin only)
   */
  static async deleteCompany(id) {
    try {
      const company = await Company.delete(id);
      if (!company) {
        throw new AppError(
          constants.ERROR_NOT_FOUND,
          constants.HTTP_NOT_FOUND,
          'COMPANY_NOT_FOUND'
        );
      }

      return { success: true, message: 'Company deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Delete company error: ${error.message}`);
    }
  }
}

module.exports = CompanyService;
