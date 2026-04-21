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
  static async getAllCompanies(limit = 20, offset = 0, batch = null) {
    try {
      return await Company.getAll(limit, offset, batch);
    } catch (error) {
      throw new Error(`Get companies error: ${error.message}`);
    }
  }

  /**
   * Get batch cards for company management
   */
  static async getCompanyBatches() {
    try {
      return await Company.getBatchOptions();
    } catch (error) {
      throw new Error(`Get company batches error: ${error.message}`);
    }
  }

  /**
   * Create company batch card
   */
  static async createCompanyBatch(batchValue) {
    try {
      const normalizedBatch = String(batchValue || '').trim();
      if (!/^\d{4}-\d{4}$/.test(normalizedBatch)) {
        throw new AppError(
          'Batch is required in YYYY-YYYY format',
          constants.HTTP_BAD_REQUEST,
          'INVALID_BATCH'
        );
      }

      const [startYear, endYear] = normalizedBatch.split('-').map(Number);
      if (endYear - startYear !== 4) {
        throw new AppError(
          'Batch must span 4 years, like 2023-2027',
          constants.HTTP_BAD_REQUEST,
          'INVALID_BATCH'
        );
      }

      const existingBatch = await Company.findBatchByValue(normalizedBatch);
      if (existingBatch?.is_active) {
        throw new AppError(
          'Batch already exists',
          constants.HTTP_CONFLICT,
          'BATCH_EXISTS'
        );
      }

      if (existingBatch && !existingBatch.is_active) {
        return await Company.reactivateBatch(existingBatch.id);
      }

      return await Company.createBatch(normalizedBatch);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Create company batch error: ${error.message}`);
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
      if (!companyData.batch || !/^\d{4}-\d{4}$/.test(String(companyData.batch).trim())) {
        throw new AppError(
          'Batch is required in YYYY-YYYY format',
          constants.HTTP_BAD_REQUEST,
          'INVALID_BATCH'
        );
      }

      const normalizedBatch = String(companyData.batch).trim();

      const existingBatch = await Company.findBatchByValue(normalizedBatch);
      if (!existingBatch || !existingBatch.is_active) {
        throw new AppError(
          'Create the batch first before adding companies',
          constants.HTTP_BAD_REQUEST,
          'BATCH_NOT_FOUND'
        );
      }

      // Check if company already exists
      const existing = await Company.findByName(companyData.name, normalizedBatch);
      if (existing) {
        if (!existing.is_active) {
          const reactivated = await Company.update(existing.id, {
            ...companyData,
            batch: normalizedBatch,
            is_active: true,
          });
          return reactivated;
        }
        throw new AppError(
          'Company already exists',
          constants.HTTP_CONFLICT,
          'COMPANY_EXISTS'
        );
      }

      return await Company.create({
        ...companyData,
        batch: normalizedBatch,
      });
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
      const currentCompany = await Company.findById(id);
      if (!currentCompany) {
        throw new AppError(
          constants.ERROR_NOT_FOUND,
          constants.HTTP_NOT_FOUND,
          'COMPANY_NOT_FOUND'
        );
      }

      const nextName = (updates.name || currentCompany.name || '').trim();
      const nextBatch = String(updates.batch || currentCompany.batch || '').trim();

      if (updates.batch && !/^\d{4}-\d{4}$/.test(nextBatch)) {
        throw new AppError(
          'Batch must be in YYYY-YYYY format',
          constants.HTTP_BAD_REQUEST,
          'INVALID_BATCH'
        );
      }

      if (nextName && nextBatch) {
        const existing = await Company.findByName(nextName, nextBatch);
        if (existing && Number(existing.id) !== Number(id)) {
          throw new AppError(
            'Company already exists for this batch',
            constants.HTTP_CONFLICT,
            'COMPANY_EXISTS'
          );
        }
      }

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
