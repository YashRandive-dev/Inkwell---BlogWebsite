// Every successful response uses the same shape: { success, message, data, pagination? }
const sendResponse = (res, statusCode, message, data = null, pagination) => {
  const body = { success: true, message, data };
  if (pagination) body.pagination = pagination;
  return res.status(statusCode).json(body);
};

// Builds the pagination block returned with list endpoints.
const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.max(1, Math.ceil(total / limit)),
});

// Reads ?page and ?limit safely.
const parsePaging = (query, defaultLimit = 9, maxLimit = 50) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

module.exports = { sendResponse, buildPagination, parsePaging };
