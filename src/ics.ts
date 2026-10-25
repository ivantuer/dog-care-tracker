import type { Item } from './care';
import { addInterval, localDate } from './dates';

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** RFC 5545 lines are limited to 75 octets; continuation lines start with a space. */
const fold = (line: string) => {
  const out: string[] = [];
  let cur = '';
  for (const ch of line) {
    if (te.encode(cur + ch).length > 74) { out.push(cur); cur = ' ' + ch; } else cur += ch;
  }
  out.push(cur);
  return out.join('\r\n');
};
const te = new TextEncoder();

const FREQ = { day: 'DAILY', week: 'WEEKLY', month: 'MONTHLY', year: 'YEARLY' } as const;
const compact = (day: string) => day.replace(/-/g, '');

/**
 * An all-day calendar event per dog and task at its next due date, repeating at the task's interval, with an alert on the
 * morning of the due date and one at the start of the lead window. Calendars repeat on a fixed schedule, so after
 * a late completion export again. Gives a reminder that works even when this app is closed.
 */
export function buildIcs(items: Item[], hour: number, now = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const alarm = (text: string, trigger: string) => ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(text)}`, `TRIGGER:${trigger}`, 'END:VALARM'];
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Dog Care Tracker//EN', 'CALSCALE:GREGORIAN'];
  for (const i of items) {
    const start = i.due < localDate(now) ? localDate(now) : i.due;
    const title = `${i.task.emoji} ${i.task.name}: ${i.dog.name}`;
    lines.push(
      'BEGIN:VEVENT', `UID:${i.task.id}.${i.dog.id}@dog-care-tracker`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(start)}`, `DTEND;VALUE=DATE:${compact(addInterval(start, 1, 'day'))}`,
      `RRULE:FREQ=${FREQ[i.task.unit]};INTERVAL=${Math.max(1, i.task.every)}`,
      `SUMMARY:${esc(title)}`,
    );
    if (i.task.notes) lines.push(`DESCRIPTION:${esc(i.task.notes)}`);
    lines.push(...alarm(title, `PT${hour}H`));
    if (i.task.lead > 0) lines.push(...alarm(`${title} (in ${i.task.lead} d)`, `-PT${i.task.lead * 24 - hour}H`));
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n');
}

export function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  Object.assign(document.createElement('a'), { href: url, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
