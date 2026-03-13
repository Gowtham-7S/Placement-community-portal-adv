const constants = require('../config/constants');

/**
 * Role-Based Authorization Middleware
 * Checks if user has required role
 */
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(constants.HTTP_UNAUTHORIZED).json({
          success: false,
          message: 'User not authenticated',
          error: 'NOT_AUTHENTICATED',
        });
      }

      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(constants.HTTP_FORBIDDEN).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
          error: 'INSUFFICIENT_PERMISSIONS',
        });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(constants.HTTP_INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Authorization error',
        error: error.message,
      });
    }
  };
};

module.exports = roleMiddleware;
