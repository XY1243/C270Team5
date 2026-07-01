const eventModel = require('../models/event.model');
const userModel = require('../models/user.model');
const { success, fail } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const listPendingEvents = asyncHandler(async (req, res) => {
  const events = await eventModel.listPending();
  return success(res, { events });
});

const approveEvent = asyncHandler(async (req, res) => {
  const event = await eventModel.findById(req.params.id);
  if (!event) {
    return fail(res, 404, 'NOT_FOUND', 'Event not found');
  }
  const updated = await eventModel.setStatus(event.id, 'approved');
  return success(res, { event: updated });
});

const rejectEvent = asyncHandler(async (req, res) => {
  const event = await eventModel.findById(req.params.id);
  if (!event) {
    return fail(res, 404, 'NOT_FOUND', 'Event not found');
  }
  const updated = await eventModel.setStatus(event.id, 'rejected');
  return success(res, { event: updated });
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await userModel.listUsers();
  return success(res, { users });
});

const suspendUser = asyncHandler(async (req, res) => {
  const user = await userModel.setStatus(req.params.id, 'suspended');
  if (!user) {
    return fail(res, 404, 'NOT_FOUND', 'User not found');
  }
  return success(res, { user });
});

const reactivateUser = asyncHandler(async (req, res) => {
  const user = await userModel.setStatus(req.params.id, 'active');
  if (!user) {
    return fail(res, 404, 'NOT_FOUND', 'User not found');
  }
  return success(res, { user });
});

const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await userModel.getPlatformAnalytics();
  return success(res, analytics);
});

module.exports = {
  listPendingEvents,
  approveEvent,
  rejectEvent,
  listUsers,
  suspendUser,
  reactivateUser,
  getAnalytics,
};
