const eventModel = require('../models/event.model');
const rsvpModel = require('../models/rsvp.model');
const { success, fail } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

async function loadOwnedEvent(req, res) {
  const event = await eventModel.findById(req.params.id);
  if (!event) {
    fail(res, 404, 'NOT_FOUND', 'Event not found');
    return null;
  }
  if (event.organiser_id !== req.user.id) {
    fail(res, 403, 'FORBIDDEN', 'You do not own this event');
    return null;
  }
  return event;
}

const listEvents = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const events = await eventModel.listApproved({ category, search });
  return success(res, { events });
});

const getEvent = asyncHandler(async (req, res) => {
  const event = await eventModel.findById(req.params.id);
  if (!event || event.status !== 'approved') {
    return fail(res, 404, 'NOT_FOUND', 'Event not found');
  }
  return success(res, { event });
});

const createEvent = asyncHandler(async (req, res) => {
  const { title, description, category, venueName, lat, lng, startsAt, endsAt, capacity } = req.body;

  if (!title || !startsAt || capacity === undefined) {
    return fail(res, 400, 'VALIDATION_ERROR', 'title, startsAt, and capacity are required');
  }

  const event = await eventModel.createEvent({
    organiserId: req.user.id,
    title,
    description,
    category,
    venueName,
    lat,
    lng,
    startsAt,
    endsAt,
    capacity,
  });
  return success(res, { event }, 201);
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await loadOwnedEvent(req, res);
  if (!event) return;

  const updated = await eventModel.updateEvent(event.id, req.body);
  return success(res, { event: updated });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const event = await loadOwnedEvent(req, res);
  if (!event) return;

  await eventModel.deleteEvent(event.id);
  return success(res, { deleted: true });
});

const uploadBanner = asyncHandler(async (req, res) => {
  const event = await loadOwnedEvent(req, res);
  if (!event) return;

  if (!req.file) {
    return fail(res, 400, 'VALIDATION_ERROR', 'banner file is required');
  }

  const bannerUrl = `/uploads/banners/${req.file.filename}`;
  const updated = await eventModel.setBannerUrl(event.id, bannerUrl);
  return success(res, { event: updated });
});

const listMine = asyncHandler(async (req, res) => {
  const events = await eventModel.listByOrganiser(req.user.id);
  return success(res, { events });
});

const getRsvpCount = asyncHandler(async (req, res) => {
  const event = await loadOwnedEvent(req, res);
  if (!event) return;

  const count = await rsvpModel.countConfirmedForEvent(event.id);
  return success(res, { eventId: event.id, confirmedTickets: count });
});

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  uploadBanner,
  listMine,
  getRsvpCount,
};
