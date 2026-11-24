import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInterviewCalendarContent, groupInterviews } from '../src/modules/candidate/interviewUtils.js';

const now = Date.parse('2026-11-22T10:00:00.000Z');

test('groups scheduled interviews and sorts future ones soonest first', () => {
  const interviews = [
    { id: 3, scheduled_at: '2026-11-24T10:00:00.000Z', status: 'SCHEDULED' },
    { id: 1, scheduled_at: '2026-11-22T09:00:00.000Z', status: 'COMPLETED' },
    { id: 2, scheduled_at: '2026-11-23T10:00:00.000Z', status: 'RESCHEDULED' }
  ];

  const result = groupInterviews(interviews, now);

  assert.deepEqual(result.upcoming.map(({ id }) => id), [2, 3]);
  assert.deepEqual(result.past.map(({ id }) => id), [1]);
  assert.deepEqual(result.cancelled, []);
});

test('keeps cancelled and invalid-date interviews out of upcoming interviews', () => {
  const interviews = [
    { id: 1, scheduled_at: '2026-11-23T10:00:00.000Z', status: 'CANCELLED' },
    { id: 2, scheduled_at: 'not-a-date', status: 'SCHEDULED' }
  ];

  const result = groupInterviews(interviews, now);

  assert.deepEqual(result.upcoming, []);
  assert.deepEqual(result.past.map(({ id }) => id), [2]);
  assert.deepEqual(result.cancelled.map(({ id }) => id), [1]);
});

test('returns empty groups when there are no interviews', () => {
  assert.deepEqual(groupInterviews([], now), { upcoming: [], past: [], cancelled: [] });
});

test('builds a calendar event with UTC dates, meeting details, and device reminders', () => {
  const content = buildInterviewCalendarContent('Senior Engineer', {
    id: 17,
    scheduled_at: '2026-11-23T10:30:00.000Z',
    duration_minutes: 45,
    meeting_link: 'https://meet.example.com/room?id=1,2'
  });

  assert.match(content, /DTSTART:20261123T103000Z/);
  assert.match(content, /DTEND:20261123T111500Z/);
  assert.match(content, /SUMMARY:Interview: Senior Engineer/);
  assert.match(content, /Join interview: https:\/\/meet\.example\.com\/room\?id=1\\,2/);
  assert.match(content, /TRIGGER:-PT1H/);
  assert.match(content, /TRIGGER:-PT15M/);
  assert.match(content, /END:VCALENDAR/);
});

test('rejects an invalid interview date when building a calendar event', () => {
  assert.throws(
    () => buildInterviewCalendarContent('Role', { scheduled_at: 'invalid' }),
    /Interview date is invalid/
  );
});
