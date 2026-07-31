function parseDateTime(value) {
  if (!value) return null;

  const input = String(value).trim();
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);

  if (match) {
    const [, year, month, day, hour, minute, second = '00'] = match;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)));
  }

  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateEventTiming({ startsAt, endsAt, now = new Date() }) {
  const startDate = parseDateTime(startsAt);
  const endDate = parseDateTime(endsAt);

  if (!startDate) {
    return { valid: false, message: 'Please provide a valid start date and time.' };
  }

  if (startDate.getTime() < now.getTime()) {
    return { valid: false, message: 'The start time cannot be in the past.' };
  }

  if (endsAt) {
    if (!endDate) {
      return { valid: false, message: 'Please provide a valid end date and time.' };
    }

    if (endDate.getTime() <= startDate.getTime()) {
      return { valid: false, message: 'The end time must be after the start time.' };
    }
  }

  return { valid: true, message: '' };
}

function resolvePostalCodeLocation(postalCode, fallbackLat = null, fallbackLng = null) {
  const normalized = String(postalCode || '').trim().toUpperCase().replace(/\s+/g, '');
  const fallback = { lat: fallbackLat ?? 1.3521, lng: fallbackLng ?? 103.8198 };

  if (!normalized) {
    return fallback;
  }

  const knownCoordinates = {
    '018956': [1.2815, 103.8483],
    '079903': [1.2783, 103.8472],
    '088731': [1.2835, 103.8515],
    '138602': [1.2877, 103.8540],
    '238859': [1.3034, 103.8359],
    '309908': [1.3181, 103.8439],
    '609602': [1.3543, 103.8512],
    '609653': [1.3526, 103.8524],
    '639798': [1.3428, 103.9384],
    '637551': [1.3388, 103.8579],
  };

  if (knownCoordinates[normalized]) {
    return { lat: knownCoordinates[normalized][0], lng: knownCoordinates[normalized][1] };
  }

  return fallback;
}

module.exports = { validateEventTiming, resolvePostalCodeLocation };
