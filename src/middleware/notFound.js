const { fail } = require('../utils/apiResponse');

function notFound(req, res) {
  fail(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`);
}

module.exports = notFound;
