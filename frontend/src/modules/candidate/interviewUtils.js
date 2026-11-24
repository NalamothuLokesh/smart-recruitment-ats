const UPCOMING_INTERVIEW_STATUSES = new Set(['SCHEDULED', 'RESCHEDULED']);

/** Group active future interviews separately from past or inactive interviews. */
export function groupInterviews(interviews = [], now = Date.now()) {
  const upcoming = [];
  const past = [];
  const cancelled = [];

  for (const interview of interviews) {
    if (interview.status === 'CANCELLED') {
      cancelled.push(interview);
      continue;
    }
    const scheduledTime = new Date(interview.scheduled_at).getTime();
    const isFutureActive = Number.isFinite(scheduledTime)
      && scheduledTime >= now
      && UPCOMING_INTERVIEW_STATUSES.has(interview.status);
    (isFutureActive ? upcoming : past).push(interview);
  }

  upcoming.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  past.sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));
  cancelled.sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));
  return { upcoming, past, cancelled };
}

function escapeCalendarText(value = '') {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function toCalendarUtc(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('Interview date is invalid.');
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

/** Build an iCalendar event with one-hour and 15-minute device reminders. */
export function buildInterviewCalendarContent(jobTitle, interview) {
  const start = new Date(interview.scheduled_at);
  if (!Number.isFinite(start.getTime())) throw new Error('Interview date is invalid.');
  const durationMinutes = Math.max(1, Number(interview.duration_minutes) || 30);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const description = [
    `Interview for ${jobTitle}`,
    `Duration: ${durationMinutes} minutes`,
    interview.meeting_link ? `Join interview: ${interview.meeting_link}` : ''
  ].filter(Boolean).join('\n');
  const uid = `smart-ats-interview-${interview.id}@smart-ats`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Smart ATS//Candidate Interview//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeCalendarText(uid)}`,
    `DTSTAMP:${toCalendarUtc(new Date())}`,
    `DTSTART:${toCalendarUtc(start)}`,
    `DTEND:${toCalendarUtc(end)}`,
    `SUMMARY:${escapeCalendarText(`Interview: ${jobTitle}`)}`,
    `DESCRIPTION:${escapeCalendarText(description)}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Interview reminder',
    'TRIGGER:-PT1H',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Interview reminder',
    'TRIGGER:-PT15M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    ''
  ].join('\r\n');
}
