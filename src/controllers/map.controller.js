const eventModel = require('../models/event.model');
const { success, fail } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getMapEvents = asyncHandler(async (req, res) => {
  const { minLat, maxLat, minLng, maxLng } = req.query;

  if ([minLat, maxLat, minLng, maxLng].some((v) => v === undefined)) {
    return fail(res, 400, 'VALIDATION_ERROR', 'minLat, maxLat, minLng, and maxLng are required');
  }

  const events = await eventModel.findInBoundingBox({
    minLat: Number(minLat),
    maxLat: Number(maxLat),
    minLng: Number(minLng),
    maxLng: Number(maxLng),
  });
  return success(res, { events });
});

module.exports = { getMapEvents };
