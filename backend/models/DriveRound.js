const { pool } = require('../config/database');

/**
 * Drive Round Model
 */
class DriveRound {
  static async createMany(client, driveId, rounds = []) {
    if (!rounds.length) return [];

    const values = [];
    const placeholders = rounds.map((round, index) => {
      const offset = index * 6;
      values.push(
        driveId,
        round.round_number,
        round.round_name,
        round.round_description || null,
        round.mode,
        round.expected_date
      );
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
    });

    const query = `
      INSERT INTO drive_rounds (
        drive_id, round_number, round_name, round_description, mode, expected_date
      ) VALUES ${placeholders.join(', ')}
      RETURNING id, drive_id, round_number, round_name, round_description, mode, expected_date
    `;

    const result = await client.query(query, values);
    return result.rows;
  }

  static async deleteByDriveId(client, driveId) {
    await client.query('DELETE FROM drive_rounds WHERE drive_id = $1', [driveId]);
  }
}

module.exports = DriveRound;
