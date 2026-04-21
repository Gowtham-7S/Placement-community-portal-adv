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

const getMeaningfulRounds = (rounds = []) => {
  return rounds.filter((round) => {
    if (!round || typeof round !== 'object') return false;
    return ['round_name', 'round_description', 'mode', 'expected_date']
      .some((key) => String(round[key] || '').trim() !== '');
  });
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
  static async getDriveBatches() {
    try {
      return await Drive.getBatchOptions();
    } catch (error) {
      throw new Error(`Get drive batches error: ${error.message}`);
    }
  }

  static async createDriveBatch(batchValue) {
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

      const existingBatch = await Drive.findBatchByValue(normalizedBatch);
      if (existingBatch?.is_active) {
        throw new AppError(
          'Batch already exists',
          constants.HTTP_CONFLICT,
          'BATCH_EXISTS'
        );
      }

      if (existingBatch && !existingBatch.is_active) {
        return await Drive.reactivateBatch(existingBatch.id);
      }

      return await Drive.createBatch(normalizedBatch);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Create drive batch error: ${error.message}`);
    }
  }

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

      const roundsInput = getMeaningfulRounds(Array.isArray(driveData.rounds) ? driveData.rounds : []);
      const rounds = normalizeRounds(roundsInput);

      const hasInvalidRound = rounds.some((round) => !round.round_name || !round.expected_date);
      if (hasInvalidRound) {
        throw new AppError(
          'Each round must include a name and expected date',
          constants.HTTP_BAD_REQUEST,
          'INVALID_ROUNDS'
        );
      }

      const interviewDate = driveData.interview_date || deriveInterviewDate(rounds);
      if (!interviewDate) {
        throw new AppError(
          'Provide a tentative drive date or at least one round date',
          constants.HTTP_BAD_REQUEST,
          'DRIVE_DATE_REQUIRED'
        );
      }

      const drivePayload = {
        ...driveData,
        role_name: String(driveData.role_name || '').trim() || 'General Drive',
        requirements: String(driveData.requirements || '').trim() || null,
        batch: String(driveData.eligible_batches || driveData.batch || '').trim() || null,
        eligible_batches: String(driveData.eligible_batches || driveData.batch || '').trim() || null,
        location: String(driveData.location || '').trim() || null,
        registration_deadline: driveData.registration_deadline || null,
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
      const currentDrive = await Drive.findById(id);
      if (!currentDrive) {
        throw new AppError(
          constants.ERROR_NOT_FOUND,
          constants.HTTP_NOT_FOUND,
          'DRIVE_NOT_FOUND'
        );
      }

      const roundsInput = Array.isArray(updates.rounds) ? updates.rounds : null;
      if (roundsInput) {
        const meaningfulRounds = getMeaningfulRounds(roundsInput);
        const rounds = normalizeRounds(meaningfulRounds);
        const hasInvalidRound = rounds.some((round) => !round.round_name || !round.expected_date);
        if (hasInvalidRound) {
          throw new AppError(
            'Each round must include a name and expected date',
            constants.HTTP_BAD_REQUEST,
            'INVALID_ROUNDS'
          );
        }

        const interviewDate = updates.interview_date
          || deriveInterviewDate(rounds)
          || currentDrive.interview_date;
        if (!interviewDate) {
          throw new AppError(
            'Provide a tentative drive date or at least one round date',
            constants.HTTP_BAD_REQUEST,
            'DRIVE_DATE_REQUIRED'
          );
        }

        const updatePayload = {
          ...updates,
          role_name: String(updates.role_name || currentDrive.role_name || '').trim() || 'General Drive',
          requirements: Object.prototype.hasOwnProperty.call(updates, 'requirements')
            ? (String(updates.requirements || '').trim() || null)
            : currentDrive.requirements,
          batch: Object.prototype.hasOwnProperty.call(updates, 'eligible_batches')
            ? (String(updates.eligible_batches || '').trim() || null)
            : (Object.prototype.hasOwnProperty.call(updates, 'batch')
              ? (String(updates.batch || '').trim() || null)
              : (currentDrive.batch || currentDrive.eligible_batches || null)),
          eligible_batches: Object.prototype.hasOwnProperty.call(updates, 'eligible_batches')
            ? (String(updates.eligible_batches || '').trim() || null)
            : (Object.prototype.hasOwnProperty.call(updates, 'batch')
              ? (String(updates.batch || '').trim() || null)
              : currentDrive.eligible_batches),
          location: Object.prototype.hasOwnProperty.call(updates, 'location')
            ? (String(updates.location || '').trim() || null)
            : currentDrive.location,
          registration_deadline: Object.prototype.hasOwnProperty.call(updates, 'registration_deadline')
            ? (updates.registration_deadline || null)
            : currentDrive.registration_deadline,
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

      const nextBatch = Object.prototype.hasOwnProperty.call(updates, 'eligible_batches')
        ? (String(updates.eligible_batches || '').trim() || null)
        : (Object.prototype.hasOwnProperty.call(updates, 'batch')
          ? (String(updates.batch || '').trim() || null)
          : (currentDrive.batch || currentDrive.eligible_batches || null));

      const drive = await Drive.update(id, {
        ...updates,
        batch: nextBatch,
        eligible_batches: nextBatch,
      });
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
