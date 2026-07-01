const eventModel = require('../models/event.model');
const rsvpModel = require('../models/rsvp.model');
const { success, fail } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getAvailability = asyncHandler(async (req, res) => {
  const event = await eventModel.findById(req.params.id);
  if (!event) {
    return fail(res, 404, 'NOT_FOUND', 'Event not found');
  }
  return success(res, {
    eventId: event.id,
    capacity: event.capacity,
    remainingCapacity: event.remaining_capacity,
  });
});

const createRsvp = asyncHandler(async (req, res) => {
  const { eventId, ticketCount } = req.body;

  if (!eventId) {
    return fail(res, 400, 'VALIDATION_ERROR', 'eventId is required');
  }

  const rsvp = await rsvpModel.createRsvp({
    eventId,
    userId: req.user.id,
    ticketCount: ticketCount || 1,
  });
  return success(res, { rsvp }, 201);
});

const listMine = asyncHandler(async (req, res) => {
  const rsvps = await rsvpModel.listByUser(req.user.id);
  return success(res, { rsvps });
});

const cancelRsvp = asyncHandler(async (req, res) => {
  const cancelled = await rsvpModel.cancelRsvp(req.params.id, req.user.id);
  if (!cancelled) {
    return fail(res, 404, 'NOT_FOUND', 'RSVP not found or already cancelled');
  }
  return success(res, { cancelled: true });
});

module.exports = { getAvailability, createRsvp, listMine, cancelRsvp };
