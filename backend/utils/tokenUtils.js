const jwt = require('jsonwebtoken');
const config = require('../config/environment');

/**
 * Generate JWT Tokens
 */
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, config.JWT_PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: config.JWT_EXPIRY,
  });

  const refreshToken = jwt.sign(payload, config.JWT_PRIVATE_KEY, {
    algorithm: 'RS256',
    expiresIn: config.JWT_REFRESH_EXPIRY,
  });

  return {
    accessToken,
    refreshToken,
  };
};

/**
 * Verify JWT Token
 */
const verifyToken = (token, isRefresh = false) => {
  try {
    const decoded = jwt.verify(token, config.JWT_PUBLIC_KEY, {
      algorithms: ['RS256'],
    });
    return decoded;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Decode Token (without verification)
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error(`Token decode failed: ${error.message}`);
  }
};

module.exports = {
  generateTokens,
  verifyToken,
  decodeToken,
};
