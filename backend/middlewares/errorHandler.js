const logger = require('../utils/logger');

/**
 * Custom application error class used across all services.
 * Allows services to throw typed errors with HTTP status codes.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
  }
}

exports.AppError = AppError;

exports.notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

exports.errorHandler = (err, req, res, next) => {
  // Use AppError's statusCode if available, else fall back to response status or 500
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  logger.error(`${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  res.status(statusCode).json({
    success: false,
    message: err.message,
    code: err.code || 'INTERNAL_ERROR',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
