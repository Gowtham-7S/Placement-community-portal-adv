const { pool } = require('../config/database');
const Experience = require('../models/Experience');
const Round = require('../models/Round');
const Question = require('../models/Question');
const ExperienceAccessService = require('./ExperienceAccessService');
const { AppError } = require('../middlewares/errorHandler');
const constants = require('../config/constants');
const EmailService = require('./EmailService');
const User = require('../models/User');

/**
 * Experience Service
 * Handles interview experience submission and management
 */
class ExperienceService {
  /**
   * Submit new experience
   */
  static async submitExperience(userId, experienceData) {
    await ExperienceAccessService.assertStudentCanSubmitExperience(userId);

    if (experienceData.drive_id) {
      const existing = await Experience.findByUserAndDrive(userId, experienceData.drive_id);
      if (existing) {
        throw new AppError(
          'You have already submitted an experience for this drive.',
          400,
          'DUPLICATE_EXPERIENCE'
        );
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Create Experience (Map snake_case req data to camelCase model params)
      const experience = await Experience.create({
        userId,
        driveId: experienceData.drive_id || null,
        companyName: experienceData.company_name,
        roleApplied: experienceData.role_applied,
        result: experienceData.result,
        offerReceived: experienceData.offer_received || false,
        ctcOffered: experienceData.ctc_offered ? parseFloat(experienceData.ctc_offered) : null,
        isAnonymous: experienceData.is_anonymous || false,
        interviewDuration: experienceData.interview_duration ? parseInt(experienceData.interview_duration) : null,
        overallDifficulty: experienceData.overall_difficulty || 'medium',
        overallFeedback: experienceData.overall_feedback || null,
        confidenceLevel: experienceData.confidence_level ? parseInt(experienceData.confidence_level) : null
      }, client);

      // 2. Create Rounds & Questions
      if (experienceData.rounds && Array.isArray(experienceData.rounds)) {
        for (const roundData of experienceData.rounds) {
          const round = await Round.create({
            experienceId: experience.id,
            roundNumber: roundData.round_number ? parseInt(roundData.round_number) : null,
            roundType: roundData.round_type,
            durationMinutes: roundData.duration_minutes ? parseInt(roundData.duration_minutes) : null,
            result: roundData.result || null,
            roundDate: roundData.round_date || null,
            topics: roundData.topics || [],
            questions: roundData.questions || [],
            difficultyLevel: roundData.difficulty_level || 'medium',
            problemStatement: roundData.problem_statement || null,
            approachUsed: roundData.approach_used || null,
            codeSnippet: roundData.code_snippet || null,
            tipsAndInsights: roundData.tips_and_insights || null,
            interviewerFeedback: roundData.interviewer_feedback || null,
            skillsTested: roundData.skills_tested || []
          }, client);

          if (roundData.questions_list && Array.isArray(roundData.questions_list)) {
            for (const questionData of roundData.questions_list) {
              await Question.create({
                roundId: round.id,
                questionText: questionData.question_text,
                category: questionData.category,
                subcategory: questionData.subcategory,
                difficulty: questionData.difficulty,
                answerProvided: questionData.answer_provided,
                answerQuality: questionData.answer_quality,
                isCommon: questionData.is_common
              }, client);
            }
          }
        }
      }

      await client.query('COMMIT');
      return experience;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Submit experience error: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get user's experiences
   */
  static async getUserExperiences(userId, limit = 20, offset = 0) {
    try {
      return await Experience.getByUserId(userId, limit, offset);
    } catch (error) {
      throw new Error(`Get experiences error: ${error.message}`);
    }
  }

  /**
   * Get experience by ID with full rounds + questions
   */
  static async getExperienceById(id) {
    try {
      const query = `
        SELECT
          e.id, e.user_id, e.drive_id, e.company_name, e.role_applied, e.result, e.selected,
          e.offer_received, e.ctc_offered, e.is_anonymous, e.approval_status,
          e.interview_duration, e.overall_difficulty, e.overall_feedback, e.confidence_level,
          e.admin_comments,
          CASE
            WHEN e.approval_status = 'rejected' THEN COALESCE(e.rejection_reason, e.admin_comments)
            ELSE e.rejection_reason
          END AS rejection_reason,
          e.submitted_at, e.approved_at, e.created_at,
          (
            SELECT json_agg(round_data ORDER BY (round_data->>'round_number')::int)
            FROM (
              SELECT json_build_object(
                'id', r.id,
                'round_number', r.round_number,
                'round_type', r.round_type,
                'difficulty_level', r.difficulty_level,
                'duration_minutes', r.duration_minutes,
                'result', r.result,
                'topics', r.topics,
                'skills_tested', r.skills_tested,
                'tips_and_insights', r.tips_and_insights,
                'interviewer_feedback', r.interviewer_feedback,
                'approach_used', r.approach_used,
                'questions_jsonb', r.questions,
                'questions', (
                  SELECT json_agg(json_build_object(
                    'id', q.id,
                    'question_text', q.question_text,
                    'category', q.category,
                    'difficulty', q.difficulty,
                    'answer_provided', q.answer_provided,
                    'is_common', q.is_common
                  ) ORDER BY q.id)
                  FROM questions q WHERE q.round_id = r.id
                )
              ) AS round_data
              FROM rounds r WHERE r.experience_id = e.id
            ) rd
          ) AS rounds
        FROM experiences e
        WHERE e.id = $1
      `;
      const result = await pool.query(query, [id]);
      const experience = result.rows[0] || null;

      if (!experience) {
        throw new AppError(
          constants.ERROR_NOT_FOUND,
          constants.HTTP_NOT_FOUND,
          'EXPERIENCE_NOT_FOUND'
        );
      }
      return experience;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Get experience error: ${error.message}`);
    }
  }


  /**
   * Update experience (Student only - own submissions)
   */
  static async updateExperience(userId, experienceId, updates) {
    try {
      const experience = await Experience.findById(experienceId);
      if (!experience) {
        throw new AppError(
          constants.ERROR_NOT_FOUND,
          constants.HTTP_NOT_FOUND,
          'EXPERIENCE_NOT_FOUND'
        );
      }

      // Check if user is the owner
      if (experience.user_id !== userId) {
        throw new AppError(
          constants.ERROR_FORBIDDEN,
          constants.HTTP_FORBIDDEN,
          'NOT_OWNER'
        );
      }

      // Can only update pending submissions
      if (experience.approval_status !== 'pending') {
        throw new AppError(
          'Cannot update approved or rejected submissions',
          constants.HTTP_FORBIDDEN,
          'CANNOT_UPDATE'
        );
      }

      return await Experience.update(experienceId, updates);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Update experience error: ${error.message}`);
    }
  }

  /**
   * Get pending submissions (Admin only)
   */
  static async getPendingSubmissions(limit = 20, offset = 0, filters = {}) {
    try {
      return await Experience.getByApprovalStatus('pending', limit, offset, filters);
    } catch (error) {
      throw new Error(`Get pending submissions error: ${error.message}`);
    }
  }

  /**
   * Get all submissions regardless of status (Admin only)
   */
  static async getAllSubmissions(limit = 30, offset = 0, filters = {}) {
    try {
      const { status, company_name } = filters;
      console.log('ExperienceService getAllSubmissions - Received filters:', { status, company_name }); // Debug log
      const validStatuses = ['pending', 'accepted', 'rejected'];
      const resolvedStatus = validStatuses.includes(status) ? status : null;
      console.log('ExperienceService getAllSubmissions - Resolved status:', resolvedStatus); // Debug log
      return await Experience.getByApprovalStatus(resolvedStatus, limit, offset, { company_name });
    } catch (error) {
      throw new Error(`Get all submissions error: ${error.message}`);
    }
  }

  /**
   * Approve submission (Admin only)
   */
  static async approveSubmission(experienceId, approvedBy, comment) {
    try {
      const experience = await Experience.findById(experienceId);
      if (!experience) {
        throw new AppError(
          constants.ERROR_NOT_FOUND,
          constants.HTTP_NOT_FOUND,
          'EXPERIENCE_NOT_FOUND'
        );
      }

      if (experience.approval_status !== 'pending') {
        throw new AppError(
          `Submission is already ${experience.approval_status}`,
          400,
          'ALREADY_PROCESSED'
        );
      }

      const updated = await Experience.updateApprovalStatus(experienceId, 'accepted', approvedBy, comment);

      // Notify student via email — fire-and-forget
      User.findById(experience.user_id).then((user) => {
        if (user?.email) {
          EmailService.sendApprovalNotification({
            to: user.email,
            studentName: [user.first_name, user.last_name].filter(Boolean).join(' '),
            companyName: experience.company_name,
            comment,
          }).catch((err) =>
            console.error(`[ExperienceService] Approval email failed for user ${experience.user_id}:`, err.message)
          );
        }
      }).catch(() => {});

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Approve submission error: ${error.message}`);
    }
  }

  /**
   * Reject submission (Admin only)
   */
  static async rejectSubmission(experienceId, approvedBy, reason) {
    try {
      if (!reason || !String(reason).trim()) {
        throw new AppError(
          'Rejection reason is required',
          400,
          'REJECTION_REASON_REQUIRED'
        );
      }

      const experience = await Experience.findById(experienceId);
      if (!experience) {
        throw new AppError(
          constants.ERROR_NOT_FOUND,
          constants.HTTP_NOT_FOUND,
          'EXPERIENCE_NOT_FOUND'
        );
      }

      if (experience.approval_status !== 'pending') {
        throw new AppError(
          `Submission is already ${experience.approval_status}`,
          400,
          'ALREADY_PROCESSED'
        );
      }

      const updated = await Experience.updateApprovalStatus(experienceId, 'rejected', approvedBy, reason);

      // Notify student via email — fire-and-forget
      User.findById(experience.user_id).then((user) => {
        if (user?.email) {
          EmailService.sendRejectionNotification({
            to: user.email,
            studentName: [user.first_name, user.last_name].filter(Boolean).join(' '),
            companyName: experience.company_name,
            reason,
          }).catch((err) =>
            console.error(`[ExperienceService] Rejection email failed for user ${experience.user_id}:`, err.message)
          );
        }
      }).catch(() => {});

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Reject submission error: ${error.message}`);
    }
  }

  /**
   * Get detailed experience data including rounds and questions (Admin only)
   */
  static async getDetailedExperience(experienceId) {
    try {
      return await Experience.getDetailedExperience(experienceId);
    } catch (error) {
      throw new Error(`Get detailed experience error: ${error.message}`);
    }
  }

  /**
   * Delete experience (Student only - own submissions)
   */
  static async deleteExperienceByUser(userId, experienceId) {
    try {
      const experience = await Experience.findById(experienceId);
      if (!experience) {
        throw new AppError(
          constants.ERROR_NOT_FOUND,
          constants.HTTP_NOT_FOUND,
          'EXPERIENCE_NOT_FOUND'
        );
      }

      if (experience.user_id !== userId) {
        throw new AppError(
          constants.ERROR_FORBIDDEN,
          constants.HTTP_FORBIDDEN,
          'NOT_OWNER'
        );
      }

      if (experience.approval_status !== 'pending') {
        throw new AppError(
          'Only pending submissions can be deleted',
          constants.HTTP_FORBIDDEN,
          'CANNOT_DELETE'
        );
      }

      const deleted = await Experience.delete(experienceId);
      return deleted;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Delete experience error: ${error.message}`);
    }
  }

  /**
   * Delete experience (Admin only)
   */
  static async deleteExperienceAsAdmin(experienceId) {
    try {
      const experience = await Experience.findById(experienceId);
      if (!experience) {
        throw new AppError(
          constants.ERROR_NOT_FOUND,
          constants.HTTP_NOT_FOUND,
          'EXPERIENCE_NOT_FOUND'
        );
      }
      const deleted = await Experience.delete(experienceId);
      return deleted;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Delete experience error: ${error.message}`);
    }
  }
}

module.exports = ExperienceService;
