let googleApis;

try {
  googleApis = require('googleapis');
} catch (err) {
  googleApis = null;
}

function getOAuth2Client(refreshToken) {
  if (!googleApis || !refreshToken) return null;

  const client = new googleApis.google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google-calendar/callback'
  );

  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

function buildCalendarEventPayload({ event }) {
  const startDateTime = event.starts_at || event.start_time || event.startTime || null;
  const endDateTime = event.ends_at || event.end_time || event.endTime || startDateTime;
  const location = event.venue_name || event.location || '';

  return {
    summary: event.title || 'Event',
    description: event.description || '',
    location: location || undefined,
    start: {
      dateTime: new Date(startDateTime).toISOString(),
      timeZone: process.env.GOOGLE_CALENDAR_TIMEZONE || 'UTC',
    },
    end: {
      dateTime: new Date(endDateTime || startDateTime).toISOString(),
      timeZone: process.env.GOOGLE_CALENDAR_TIMEZONE || 'UTC',
    },
  };
}

async function createCalendarEvent({ user, event }) {
  if (!user?.google_refresh_token || !event?.title) {
    return null;
  }

  const auth = getOAuth2Client(user.google_refresh_token);
  if (!auth || !googleApis) {
    console.warn('[GoogleCalendar] Google API client unavailable; skipping calendar sync.');
    return null;
  }

  try {
    const calendar = googleApis.google.calendar({ version: 'v3', auth });
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: buildCalendarEventPayload({ event }),
      sendUpdates: 'all',
      supportsAttachments: false,
    });

    return { googleEventId: response.data.id };
  } catch (err) {
    console.error('[GoogleCalendar] createCalendarEvent error:', err.message);
    return null;
  }
}

async function deleteCalendarEvent({ user, googleEventId }) {
  if (!user?.google_refresh_token || !googleEventId) return null;

  const auth = getOAuth2Client(user.google_refresh_token);
  if (!auth || !googleApis) return null;

  try {
    const calendar = googleApis.google.calendar({ version: 'v3', auth });
    await calendar.events.delete({ calendarId: 'primary', eventId: googleEventId });
    return true;
  } catch (err) {
    if (err.code === 404) {
      return false;
    }
    console.error('[GoogleCalendar] deleteCalendarEvent error:', err.message);
    return false;
  }
}

module.exports = {
  buildCalendarEventPayload,
  createCalendarEvent,
  deleteCalendarEvent,
};
