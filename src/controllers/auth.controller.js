const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userModel = require('../models/user.model');
const { hashPassword, comparePassword } = require('../utils/password');
const { success, fail } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const ALLOWED_SIGNUP_ROLES = ['user', 'organiser'];

function toSafeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return fail(res, 400, 'VALIDATION_ERROR', 'name, email, and password are required');
  }

  const requestedRole = ALLOWED_SIGNUP_ROLES.includes(role) ? role : 'user';

  const existing = await userModel.findByEmail(email);
  if (existing) {
    return fail(res, 409, 'EMAIL_TAKEN', 'An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const user = await userModel.createUser({ name, email, passwordHash, role: requestedRole });
  const token = signToken(user);

  return success(res, { user: toSafeUser(user), token }, 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return fail(res, 400, 'VALIDATION_ERROR', 'email and password are required');
  }

  const user = await userModel.findByEmail(email);
  if (!user || !(await comparePassword(password, user.password_hash))) {
    return fail(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (user.status === 'suspended') {
    return fail(res, 403, 'ACCOUNT_SUSPENDED', 'This account has been suspended');
  }

  const token = signToken(user);
  return success(res, { user: toSafeUser(user), token });
});

const me = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user.id);
  if (!user) {
    return fail(res, 404, 'NOT_FOUND', 'User not found');
  }
  return success(res, { user: toSafeUser(user) });
});

module.exports = { signup, login, me };
