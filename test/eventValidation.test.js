const test = require('node:test');
const assert = require('node:assert/strict');
const { validateEventTiming } = require('../src/utils/eventValidation');

test('rejects a start time in the past', () => {
  const now = new Date('2026-07-31T12:00:00Z');
  const result = validateEventTiming({ startsAt: '2026-07-31T11:00:00', endsAt: '2026-07-31T13:00:00', now });

  assert.equal(result.valid, false);
  assert.match(result.message, /start time/i);
});

test('rejects an end time that is before the start time', () => {
  const now = new Date('2026-07-31T12:00:00Z');
  const result = validateEventTiming({ startsAt: '2026-07-31T13:00:00', endsAt: '2026-07-31T12:00:00', now });

  assert.equal(result.valid, false);
  assert.match(result.message, /after the start time/i);
});

test('accepts a valid future event window', () => {
  const now = new Date('2026-07-31T12:00:00Z');
  const result = validateEventTiming({ startsAt: '2026-07-31T13:00:00', endsAt: '2026-07-31T15:00:00', now });

  assert.equal(result.valid, true);
  assert.equal(result.message, '');
});
