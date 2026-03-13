const bcryptjs = require('bcryptjs');
const config = require('../config/environment');

/**
 * Hash Password
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcryptjs.genSalt(config.BCRYPT_SALT_ROUNDS);
    return await bcryptjs.hash(password, salt);
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
};

/**
 * Compare Password
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  try {
    return await bcryptjs.compare(plainPassword, hashedPassword);
  } catch (error) {
    throw new Error(`Password comparison failed: ${error.message}`);
  }
};

module.exports = {
  hashPassword,
  comparePassword,
};
