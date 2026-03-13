const ExperienceAccessService = require('../services/ExperienceAccessService');

class ExperienceAccessController {
  static async getAccessList(req, res, next) {
    try {
      const data = await ExperienceAccessService.getAccessList(req.query.search || '');
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addOrUpdateAccess(req, res, next) {
    try {
      const { roll_number, email, student_name, company_name } = req.body;
      const record = await ExperienceAccessService.addOrUpdateAccess(
        roll_number,
        email,
        req.user.id,
        student_name,
        company_name
      );

      res.status(201).json({
        success: true,
        message: 'Experience access saved successfully',
        data: record,
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeAccess(req, res, next) {
    try {
      await ExperienceAccessService.removeAccess(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Access removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async importFromExcel(req, res, next) {
    try {
      const mode = req.body.mode || 'selected_last_round';
      const result = await ExperienceAccessService.importFromExcelBuffer(
        req.file?.buffer,
        req.user.id,
        mode
      );

      res.status(200).json({
        success: true,
        message: 'Excel import completed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ExperienceAccessController;
