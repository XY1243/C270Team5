const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { fail } = require('../utils/apiResponse');

function verifyToken(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return fail(res, 401, 'UNAUTHORIZED', 'Missing or malformed Authorization header');
  }

  try {
    const payload = jwt.verify(token, env.jwt.secret);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch (err) {
    return fail(res, 401, 'UNAUTHORIZED', 'Invalid or expired token');
  }
}

function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return fail(res, 403, 'FORBIDDEN', 'You do not have permission to perform this action');
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
