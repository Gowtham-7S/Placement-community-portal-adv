const AnalyticsService = require('../services/AnalyticsService');
const constants = require('../config/constants');

class AnalyticsController {
    static async getDashboardStats(req, res, next) {
        try {
            const [overall, companyTags, recent] = await Promise.all([
                AnalyticsService.getOverallStats(),
                AnalyticsService.getCompanyStats(),
                AnalyticsService.getRecentActivity()
            ]);

            res.status(constants.HTTP_OK).json({
                success: true,
                data: {
                    overall,
                    companyStats: companyTags,
                    recentActivity: recent
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AnalyticsController;
