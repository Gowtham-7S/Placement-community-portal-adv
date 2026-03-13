const JuniorService = require('../services/JuniorService');
const DriveService = require('../services/DriveService');
const constants = require('../config/constants');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/queryUtils');

class JuniorController {
    /**
     * Get company-level insights (aggregated experiences)
     * GET /api/junior/companies
     */
    static async getCompanyInsights(req, res, next) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const { limit: limitNum, offset } = getPaginationParams(page, limit);
            const result = await JuniorService.getCompanyInsights(limitNum, offset);
            res.status(200).json({
                success: true,
                ...formatPaginatedResponse(result.data, result.total, page, limitNum),
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get approved experiences for a specific company
     * GET /api/junior/companies/:name/experiences
     */
    static async getCompanyExperiences(req, res, next) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const { limit: limitNum, offset } = getPaginationParams(page, limit);
            const companyName = decodeURIComponent(req.params.name);
            const result = await JuniorService.getExperiencesByCompany(companyName, limitNum, offset);
            res.status(200).json({
                success: true,
                ...formatPaginatedResponse(result.data, result.total, page, limitNum),
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get overall public statistics
     * GET /api/junior/stats
     */
    static async getPublicStats(req, res, next) {
        try {
            const stats = await JuniorService.getPublicStats();
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get trending interview topics
     * GET /api/junior/topics
     */
    static async getTrendingTopics(req, res, next) {
        try {
            const { limit = 10 } = req.query;
            const topics = await JuniorService.getTrendingTopics(parseInt(limit));
            res.status(200).json({ success: true, data: topics });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/junior/drives
     */
    static async getDrives(req, res, next) {
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
     * GET /api/junior/drives/:id
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
}

module.exports = JuniorController;
