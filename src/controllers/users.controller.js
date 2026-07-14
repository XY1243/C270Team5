const savedEventModel = require('../models/savedEvent.model');
const rsvpModel = require('../models/rsvp.model');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getDashboard = asyncHandler(async (req, res) => {
  const [savedEvents, rsvps] = await Promise.all([
    savedEventModel.listSavedEvents(req.user.id),
    rsvpModel.listByUser(req.user.id),
  ]);
  return success(res, { savedEvents, rsvps });
});

const saveEvent = asyncHandler(async (req, res) => {
  await savedEventModel.addSavedEvent(req.user.id, req.params.eventId);
  return success(res, { saved: true }, 201);
});

const unsaveEvent = asyncHandler(async (req, res) => {
  await savedEventModel.removeSavedEvent(req.user.id, req.params.eventId);
  return success(res, { saved: false });
});

module.exports = { getDashboard, saveEvent, unsaveEvent };
