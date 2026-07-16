const eventModel = require('../models/event.model');
const rsvpModel = require('../models/rsvp.model');
const userModel = require('../models/user.model');
const { success, fail } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const googleCalendar = require('../services/googleCalendar');
const emailService = require('../services/emailService');

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

  try {
    const enriched = await rsvpModel.getRsvpWithEvent(rsvp.id);
    const user = await userModel.findById(req.user.id);

    if (user?.google_refresh_token && enriched) {
      const calendarResult = await googleCalendar.createCalendarEvent({ user, event: enriched });
      if (calendarResult?.googleEventId) {
        await rsvpModel.setGoogleEventId(rsvp.id, calendarResult.googleEventId);
      }
    }

    if (enriched) {
      await emailService.sendConfirmationEmail({
        to: user?.email,
        eventName: enriched.title,
        startTime: enriched.starts_at,
        endTime: enriched.ends_at,
        location: enriched.venue_name,
        ticketCount: rsvp.ticket_count,
        eventId: enriched.id,
      });
    }
  } catch (err) {
    console.error('[rsvp-controller] post-booking notification error:', err.message);
  }

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

  try {
    const rsvp = await rsvpModel.findById(req.params.id);
    const user = await userModel.findById(req.user.id);
    if (rsvp?.google_event_id) {
      await googleCalendar.deleteCalendarEvent({ user, googleEventId: rsvp.google_event_id });
    }
  } catch (err) {
    console.error('[rsvp-controller] cancel-booking notification error:', err.message);
  }

  return success(res, { cancelled: true });
});

const getRsvpByUserAndEvent = asyncHandler(async (req, res) => {
  const row = await rsvpModel.findByUserAndEvent(req.user.id, req.query.event_id || req.params.eventId);
  return success(res, { rsvp: row });
});

module.exports = { getAvailability, createRsvp, listMine, cancelRsvp, getRsvpByUserAndEvent };
