const ExperienceAccess = require('../models/ExperienceAccess');
const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');
const XLSX = require('xlsx');
const EmailService = require('./EmailService');

class ExperienceAccessService {
  static normalizeEmail(email) {
    return (email || '').trim().toLowerCase();
  }

  static normalizeStudentName(studentName) {
    return (studentName || '').trim();
  }

  static normalizeRollNumber(rollNumber) {
    return (rollNumber || '').trim();
  }

  static normalizeCompanyName(companyName) {
    return (companyName || '').trim();
  }

  static getAccessDomain() {
    return String(process.env.EXPERIENCE_ACCESS_DOMAIN || process.env.CAMPUS_DOMAIN || 'bitsathy.ac.in')
      .trim()
      .replace(/^@+/, '')
      .toLowerCase();
  }

  static isAllowedDomain(email) {
    const domain = this.getAccessDomain();
    return email && email.toLowerCase().endsWith(`@${domain}`);
  }

  static async getAccessList(search = '') {
    return ExperienceAccess.list(search);
  }

  static async addOrUpdateAccess(rollNumber, email, adminId, studentName = '', companyName = '') {
    const normalizedRollNumber = this.normalizeRollNumber(rollNumber);
    const normalizedEmail = this.normalizeEmail(email);
    const normalizedStudentName = this.normalizeStudentName(studentName);
    const normalizedCompanyName = this.normalizeCompanyName(companyName);

    if (!normalizedEmail) {
      throw new AppError('Email is required', 400, 'EMAIL_REQUIRED');
    }
    if (!normalizedRollNumber) {
      throw new AppError('Roll number is required', 400, 'ROLL_NUMBER_REQUIRED');
    }
    if (!this.isAllowedDomain(normalizedEmail)) {
      throw new AppError(
        `Only ${this.getAccessDomain()} email addresses are allowed`,
        400,
        'EMAIL_DOMAIN_NOT_ALLOWED'
      );
    }

    const record = await ExperienceAccess.upsert(
      normalizedRollNumber,
      normalizedStudentName,
      normalizedEmail,
      normalizedCompanyName,
      adminId
    );

    // Always email when access is granted/updated.
    EmailService.sendExperienceInvitation({
      to: normalizedEmail,
      studentName: normalizedStudentName,
      companyName: normalizedCompanyName,
    }).catch((err) =>
      console.error(`[ExperienceAccessService] Failed to send invitation email to ${normalizedEmail}:`, err.message)
    );

    return record;
  }

  static async removeAccess(id) {
    const deleted = await ExperienceAccess.remove(id);
    if (!deleted) {
      throw new AppError('Access record not found', 404, 'ACCESS_RECORD_NOT_FOUND');
    }
    return deleted;
  }

  static async assertStudentCanSubmitExperience(userId) {
    const user = await User.findById(userId);
    const email = (user?.email || '').trim();

    if (!email) {
      throw new AppError(
        'Your account does not have an email. Contact admin to update profile and enable experience submission.',
        403,
        'EMAIL_MISSING'
      );
    }

    if (!this.isAllowedDomain(email)) {
      throw new AppError(
        `Only ${this.getAccessDomain()} email addresses can submit interview experiences.`,
        403,
        'EMAIL_DOMAIN_NOT_ALLOWED'
      );
    }

    const allowedByEmail = await ExperienceAccess.hasActiveEmail(email);

    if (!allowedByEmail) {
      throw new AppError(
        'You are not allowed to submit interview experiences. Contact admin for access.',
        403,
        'EXPERIENCE_ACCESS_DENIED'
      );
    }
  }

  static async hasEmailAccessForStudent(email) {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) return false;
    if (!this.isAllowedDomain(normalizedEmail)) return false;
    return ExperienceAccess.hasActiveEmail(normalizedEmail);
  }

  static normalizeHeader(header) {
    return String(header || '')
      .trim()
      .toLowerCase()
      .replace(/[()[\].]/g, ' ')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ');
  }

  static pickValue(row, aliases) {
    const entries = Object.entries(row || {});
    for (const [key, value] of entries) {
      const normalizedKey = this.normalizeHeader(key);
      if (aliases.includes(normalizedKey) && value !== undefined && value !== null && String(value).trim()) {
        return String(value).trim();
      }
    }
    return '';
  }

  static parseNumberOrNull(value) {
    if (value === undefined || value === null) return null;
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.trunc(value);
    }

    const raw = String(value || '').trim();
    if (!raw) return null;
    const match = raw.match(/\d+/);
    if (!match) return null;
    const parsed = parseInt(match[0], 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  static evaluateSelectedStatus(resultText) {
    const value = String(resultText || '').toLowerCase();

    if (!value) return false;
    if (/(waiting|wait|pending|in progress|not sure)/i.test(value)) return false;
    if (/(not selected|rejected|fail|failed|no offer|not placed)/i.test(value)) return false;
    if (/(selected|placed|offer|offered|hired|pass|passed)/i.test(value)) return true;

    return false;
  }

  static evaluateLastRound(roundsAttendedText, totalRoundsText, stageText) {
    const roundsAttended = this.parseNumberOrNull(roundsAttendedText);
    const totalRounds = this.parseNumberOrNull(totalRoundsText);
    const stage = String(stageText || '').toLowerCase();
    const attendedText = String(roundsAttendedText || '').toLowerCase();

    if (roundsAttended !== null && totalRounds !== null) {
      return roundsAttended >= totalRounds;
    }

    if (/(final|last)/i.test(stage)) return true;
    if (/(final|last)/i.test(attendedText)) return true;

    return false;
  }

  static hasRoundContext(roundsAttendedText, totalRoundsText, stageText) {
    return [
      this.parseNumberOrNull(roundsAttendedText),
      this.parseNumberOrNull(totalRoundsText),
      String(stageText || '').trim(),
    ].some((value) => value !== null && value !== '');
  }

  static isEligibleForImport({ mode, isSelected, isLastRound, hasRoundContext }) {
    if (mode === 'selected_only') {
      return isSelected;
    }

    if (isSelected && !hasRoundContext) {
      return true;
    }

    return isSelected && isLastRound;
  }

  static extractEligibleStudentsFromRows(rows, mode = 'selected_last_round') {
    const students = [];
    const skipped = [];

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rowNumber = index + 2; // header is line 1

      const email = this.pickValue(row, [
        'email',
        'email id',
        'email address',
        'college email',
        'student email',
        'student email id',
        'mail',
        'mail id',
        'mail address',
      ]);
      const studentName = this.pickValue(row, [
        'student name',
        'name',
        'candidate name',
      ]);
      const rollNumber = this.pickValue(row, [
        'roll number',
        'roll no',
        'roll',
        'register number',
        'register no',
        'register',
        'registration number',
        'registration no',
        'reg no',
        'reg number',
        'university number',
        'university no',
      ]);
      const companyName = this.pickValue(row, [
        'company',
        'company name',
        'organisation',
        'organization',
      ]);
      const result = this.pickValue(row, [
        'result',
        'status',
        'outcome',
        'selection status',
        'offer status',
        'placement status',
        'final status',
      ]);
      const roundsAttended = this.pickValue(row, [
        'rounds attended',
        'round attended',
        'rounds attened',
        'attended rounds',
        'round count',
        'no of rounds attended',
        'number of rounds attended',
        'round cleared',
      ]);
      const totalRounds = this.pickValue(row, [
        'total rounds',
        'number of rounds',
        'max rounds',
        'no of rounds',
        'rounds',
      ]);
      const stage = this.pickValue(row, [
        'round',
        'interview round',
        'current round',
        'current stage',
        'last stage',
        'final stage',
        'stage',
        'round name',
        'last round reached',
      ]);

      if (!email || !rollNumber) {
        skipped.push({ row: rowNumber, reason: 'Missing email or roll number' });
        continue;
      }

      const normalizedEmail = this.normalizeEmail(email);
      if (!this.isAllowedDomain(normalizedEmail)) {
        skipped.push({ row: rowNumber, reason: `Email domain not allowed (${this.getAccessDomain()})` });
        continue;
      }

      const isSelected = this.evaluateSelectedStatus(result);
      const isLastRound = this.evaluateLastRound(roundsAttended, totalRounds, stage);
      const hasRoundContext = this.hasRoundContext(roundsAttended, totalRounds, stage);
      const eligible = this.isEligibleForImport({
        mode,
        isSelected,
        isLastRound,
        hasRoundContext,
      });

      if (!eligible) {
        skipped.push({
          row: rowNumber,
          reason: mode === 'selected_only'
            ? 'Did not match eligibility (needs selected/placed status)'
            : 'Did not match eligibility (needs selected/placed status, and if round columns exist they must indicate last/final round)',
        });
        continue;
      }

      students.push({
        email: normalizedEmail,
        studentName: this.normalizeStudentName(studentName),
        rollNumber: this.normalizeRollNumber(rollNumber),
        companyName: this.normalizeCompanyName(companyName),
      });
    }

    return { students, skipped };
  }

  static async importFromExcelBuffer(fileBuffer, adminId, mode = 'selected_last_round') {
    if (!fileBuffer) {
      throw new AppError('Excel file is required', 400, 'FILE_REQUIRED');
    }

    let workbook;
    try {
      workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    } catch (error) {
      throw new AppError('Invalid Excel file format', 400, 'INVALID_EXCEL');
    }

    const firstSheetName = workbook.SheetNames?.[0];
    if (!firstSheetName) {
      throw new AppError('Excel file has no sheets', 400, 'EMPTY_EXCEL');
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: '',
      raw: false,
      blankrows: false,
    });

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new AppError('Excel sheet is empty', 400, 'EMPTY_SHEET');
    }

    const validModes = new Set(['selected_last_round', 'selected_only']);
    const importMode = validModes.has(mode) ? mode : 'selected_last_round';
    const { students, skipped } = this.extractEligibleStudentsFromRows(rows, importMode);

    const uniqueMap = new Map();
    students.forEach((s) => {
      if (s.rollNumber && s.email) {
        uniqueMap.set(s.email, {
          email: s.email,
          studentName: s.studentName,
          rollNumber: s.rollNumber,
          companyName: s.companyName,
        });
      }
    });

    const uniqueStudents = Array.from(uniqueMap.values());

    let importedCount = 0;
    for (const student of uniqueStudents) {
      const record = await this.addOrUpdateAccess(student.rollNumber, student.email, adminId, student.studentName, student.companyName);
      importedCount += 1;
    }

    return {
      totalRows: rows.length,
      eligibleRows: students.length,
      importedCount,
      newInvitesSent: uniqueStudents.length,
      skippedCount: skipped.length,
      skippedRows: skipped.slice(0, 20),
      mode: importMode,
    };
  }
}

module.exports = ExperienceAccessService;
