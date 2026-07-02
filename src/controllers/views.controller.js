const eventModel = require('../models/event.model');
const asyncHandler = require('../utils/asyncHandler');

const renderMap = asyncHandler(async (req, res) => {
  res.render('map', { title: 'Event Finder' });
});

const renderEventDetail = asyncHandler(async (req, res) => {
  const event = await eventModel.findById(req.params.id);
  if (!event || event.status !== 'approved') {
    return res.status(404).render('event', { title: 'Event not found', event: null });
  }
  return res.render('event', { title: event.title, event });
});

const renderLogin = asyncHandler(async (req, res) => {
  res.render('login', { title: 'Log in' });
});

module.exports = { renderMap, renderEventDetail, renderLogin };
