const Drive = require('../models/Drive');
const DriveRound = require('../models/DriveRound');
const { pool } = require('../config/database');
const Company = require('../models/Company');
const Experience = require('../models/Experience');
const { AppError } = require('../middlewares/errorHandler');
const constants = require('../config/constants');

const normalizeRounds = (rounds = []) => {
  return rounds.map((round, index) => ({
    round_number: round.round_number ? parseInt(round.round_number, 10) : index + 1,
    round_name: String(round.round_name || '').trim(),
    round_description: String(round.round_description || '').trim(),
    mode: String(round.mode || 'online').toLowerCase(),
    expected_date: round.expected_date,
  }));
};

const deriveInterviewDate = (rounds = []) => {
  const dates = rounds
    .map((round) => new Date(round.expected_date))
    .filter((d) => !Number.isNaN(d.valueOf()))
    .sort((a, b) => a - b);
  if (!dates.length) return null;
  return dates[0].toISOString().split('T')[0];
};

const deriveDriveStatus = (rounds = []) => {
  if (!rounds.length) return constants.DRIVE_UPCOMING;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = rounds
    .map((round) => new Date(round.expected_date))
    .filter((date) => !Number.isNaN(date.valueOf()))
    .map((date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    });
  if (!dates.length) return constants.DRIVE_UPCOMING;
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
  if (maxDate < today) return constants.DRIVE_COMPLETED;
  if (minDate > today) return constants.DRIVE_UPCOMING;
  return constants.DRIVE_ONGOING;
};

const deriveDriveMode = (rounds = []) => {
  const modes = new Set(rounds.map((round) => String(round.mode || '').toLowerCase()).filter(Boolean));
  if (modes.size === 1) return Array.from(modes)[0];
  if (modes.size > 1) return constants.MODE_HYBRID;
  return constants.MODE_ONLINE;
};

/**
 * Drive Service
 * Handles interview drive management operations
 */
class DriveService {
  /**
   * Get all drives with filtering
   */
  static async getAllDrives(limit = 20, offset = 0, filters = {}) {
    try {
      return await Drive.getAll(limit, offset, filters);
    } catch (error) {
      throw new Error(`Get drives error: ${error.message}`);
    }
  }

  /**
   * Get drive by ID
   */
  static async getDriveById(id) {
    try {
      const drive = await Drive.findById(id);
      if (!drive) {
        throw new AppError(
          constants.ERROR_NOT_FOUND,
          constants.HTTP_NOT_FOUND,
          'DRIVE_NOT_FOUND'
        );
      }
      return drive;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Get drive error: ${error.message}`);
    }
  }

  /**
   * Create new drive
   */
  static async createDrive(driveData, userId) {
    try {
      // Validate company exists to prevent foreign key error
      const company = await Company.findById(driveData.company_id);
      if (!company) {
        throw new AppError(
          'Company not found',
          constants.HTTP_NOT_FOUND || 404,
          'COMPANY_NOT_FOUND'
        );
      }

      if (!driveData.role_name || !driveData.eligible_batches || !driveData.requirements
        || driveData.ctc === undefined || driveData.total_positions === undefined) {
        throw new AppError(
          'Missing required drive fields',
          constants.HTTP_BAD_REQUEST,
          'DRIVE_FIELDS_REQUIRED'
        );
      }

      const roundsInput = Array.isArray(driveData.rounds) ? driveData.rounds : [];
      if (!roundsInput.length) {
        throw new AppError(
          'At least one round is required',
          constants.HTTP_BAD_REQUEST,
          'ROUNDS_REQUIRED'
        );
      }

      const rounds = normalizeRounds(roundsInput);
      const interviewDate = deriveInterviewDate(rounds);
      if (!interviewDate) {
        throw new AppError(
          'Each round must have a valid expected date',
          constants.HTTP_BAD_REQUEST,
          'INVALID_ROUND_DATE'
        );
      }

      const drivePayload = {
        ...driveData,
        round_count: rounds.length,
        interview_date: interviewDate,
        drive_status: deriveDriveStatus(rounds),
        mode: deriveDriveMode(rounds),
      };

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const drive = await Drive.create(drivePayload, client);
        await DriveRound.createMany(client, drive.id, rounds);
        await client.query('COMMIT');
        return drive;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Create drive error: ${error.message}`);
    }
  }

  /**
   * Update drive
   */
  static async updateDrive(id, updates) {
    try {
      const roundsInput = Array.isArray(updates.rounds) ? updates.rounds : null;
      if (roundsInput) {
        if (!updates.role_name || !updates.eligible_batches || !updates.requirements
          || updates.ctc === undefined || updates.total_positions === undefined) {
          throw new AppError(
            'Missing required drive fields',
            constants.HTTP_BAD_REQUEST,
            'DRIVE_FIELDS_REQUIRED'
          );
        }
        if (!roundsInput.length) {
          throw new AppError(
            'At least one round is required',
            constants.HTTP_BAD_REQUEST,
            'ROUNDS_REQUIRED'
          );
        }
        const rounds = normalizeRounds(roundsInput);
        const interviewDate = deriveInterviewDate(rounds);
        if (!interviewDate) {
          throw new AppError(
            'Each round must have a valid expected date',
            constants.HTTP_BAD_REQUEST,
            'INVALID_ROUND_DATE'
          );
        }

        const updatePayload = {
          ...updates,
          round_count: rounds.length,
          interview_date: interviewDate,
          drive_status: deriveDriveStatus(rounds),
          mode: deriveDriveMode(rounds),
        };

        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const drive = await Drive.update(id, updatePayload, client);
          if (!drive) {
            throw new AppError(
              constants.ERROR_NOT_FOUND,
              constants.HTTP_NOT_FOUND,
              'DRIVE_NOT_FOUND'
            );
          }
          await DriveRound.deleteByDriveId(client, id);
          await DriveRound.createMany(client, id, rounds);
          await client.query('COMMIT');
          return drive;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }

      const drive = await Drive.update(id, updates);
      if (!drive) {
        throw new AppError(
          constants.ERROR_NOT_FOUND,
          constants.HTTP_NOT_FOUND,
          'DRIVE_NOT_FOUND'
        );
      }
      return drive;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Update drive error: ${error.message}`);
    }
  }

  /**
   * Delete drive
   */
  static async deleteDrive(id) {
    try {
      const linkedCount = await Experience.countByDriveId(id);
      if (linkedCount > 0) {
        throw new AppError(
          'Cannot delete drive as it has associated student experiences. Please remove or reassign them first.',
          400,
          'DRIVE_HAS_EXPERIENCES'
        );
      }

      const result = await Drive.delete(id);
      if (!result) {
        throw new AppError(
          constants.ERROR_NOT_FOUND,
          constants.HTTP_NOT_FOUND,
          'DRIVE_NOT_FOUND'
        );
      }
      return { success: true, message: 'Drive deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Delete drive error: ${error.message}`);
    }
  }
}

module.exports = DriveService;
