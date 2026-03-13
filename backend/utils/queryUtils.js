const constants = require('../config/constants');

/**
 * Format Pagination Parameters
 */
const getPaginationParams = (page = 1, limit = constants.DEFAULT_LIMIT) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(parseInt(limit) || constants.DEFAULT_LIMIT, constants.MAX_LIMIT);
  const offset = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    offset,
  };
};

/**
 * Format Paginated Response
 */
const formatPaginatedResponse = (data, total, page, limit) => {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Build Query Filters
 */
const buildFilters = (queryParams, allowedFields) => {
  const filters = {};

  allowedFields.forEach((field) => {
    if (queryParams[field]) {
      filters[field] = queryParams[field];
    }
  });

  return filters;
};

/**
 * Build WHERE clause for PostgreSQL
 */
const buildWhereClause = (filters) => {
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  Object.keys(filters).forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== null) {
      conditions.push(`${key} = $${paramIndex}`);
      values.push(filters[key]);
      paramIndex++;
    }
  });

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
  };
};

/**
 * Format Response
 */
const formatResponse = (success = true, message = '', data = null, error = null) => {
  return {
    success,
    message,
    ...(data && { data }),
    ...(error && { error }),
  };
};

module.exports = {
  getPaginationParams,
  formatPaginatedResponse,
  buildFilters,
  buildWhereClause,
  formatResponse,
};
