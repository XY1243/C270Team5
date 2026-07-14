const test = require('node:test');
const assert = require('node:assert/strict');

const { buildCalendarEventPayload, buildConfirmationEmailHtml } = require('../src/services');

test('buildCalendarEventPayload creates a Google Calendar event payload from an event', () => {
  const payload = buildCalendarEventPayload({
    event: {
      title: 'Launch Party',
      description: 'Bring your friends',
      starts_at: '2026-08-01T19:00:00.000Z',
      ends_at: '2026-08-01T21:00:00.000Z',
      venue_name: 'Riverside Hall',
    },
  });

  assert.equal(payload.summary, 'Launch Party');
  assert.equal(payload.location, 'Riverside Hall');
  assert.ok(payload.start.dateTime.includes('2026-08-01T19:00:00'));
  assert.ok(payload.end.dateTime.includes('2026-08-01T21:00:00'));
});

test('buildConfirmationEmailHtml includes booking details', () => {
  const html = buildConfirmationEmailHtml({
    eventName: 'Launch Party',
    startTime: 'Aug 1, 2026 7:00 PM',
    endTime: 'Aug 1, 2026 9:00 PM',
    location: 'Riverside Hall',
    ticketCount: 2,
    eventId: 42,
  });

  assert.match(html, /Launch Party/);
  assert.match(html, /Riverside Hall/);
  assert.match(html, /2 ticket\(s\)/);
  assert.match(html, /EF-42/);
});
