// Health reminders: when each is due, and a calendar file (.ics) so the
// phone's own calendar can alert on time (the app has no server to send
// notifications). Pure logic, no app imports, so it can be tested on its
// own (tests/health-reminders.test.mjs).

type TKind =
  'body' | 'glucose' | 'uricAcid' | 'cholesterol' | 'calories' | 'period'

type TReminder =
  | {
      id: string
      kind: Exclude<TKind, 'period'>
      everyDays: number
      // HH:MM, or none for any time that day.
      time?: string
    }
  | { id: string; kind: 'period'; daysBefore: number }

const DAY = 86_400_000

const addDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY)
    .toISOString()
    .slice(0, 10)

const daysBetween = (from: string, to: string) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY,
  )

export type TReminderStatus = {
  // When it is next due (YYYY-MM-DD); none for a period reminder before
  // any period is logged.
  dueDate?: string
  isDue: boolean
  // The last entry of that kind, if any.
  lastDate?: string
}

// A measurement reminder is due `everyDays` after the last entry of its
// kind (at once if there is none); a period reminder `daysBefore` the next
// expected period (`nextPeriodStart`, from the period estimates).
export const reminderStatus = ({
  reminder,
  entries,
  today,
  nextPeriodStart,
}: {
  reminder: TReminder
  entries: { kind: TKind; date: string }[]
  today: string
  nextPeriodStart?: string
}): TReminderStatus => {
  if (reminder.kind === 'period') {
    if (!nextPeriodStart) return { isDue: false }
    const dueDate = addDays(nextPeriodStart, -Math.max(0, reminder.daysBefore))
    return { dueDate, isDue: dueDate <= today }
  }
  const lastDate = entries
    .filter((entry) => entry.kind === reminder.kind)
    .map((entry) => entry.date)
    .toSorted((a, b) => a.localeCompare(b))
    .at(-1)
  const dueDate = lastDate
    ? addDays(lastDate, Math.max(1, reminder.everyDays))
    : today
  return { dueDate, isDue: dueDate <= today, lastDate }
}

// The reminders due today or earlier, most overdue first.
export const dueReminders = <TItem extends TReminder>({
  reminders,
  entries,
  today,
  nextPeriodStart,
}: {
  reminders: TItem[]
  entries: { kind: TKind; date: string }[]
  today: string
  nextPeriodStart?: string
}) =>
  reminders
    .map((reminder) => ({
      reminder,
      status: reminderStatus({ reminder, entries, today, nextPeriodStart }),
    }))
    .filter(({ status }) => status.isDue)
    .toSorted((a, b) =>
      (a.status.dueDate ?? '').localeCompare(b.status.dueDate ?? ''),
    )

// Days from `from` to `to`: positive when `to` is later.
export const daysFrom = daysBetween

// iCalendar text needs commas, semicolons and backslashes escaped, and
// newlines written as \n.
const escapeText = (text: string) =>
  text
    .replaceAll('\\', '\\\\')
    .replaceAll(';', String.raw`\;`)
    .replaceAll(',', String.raw`\,`)
    .replaceAll(/\r?\n/g, String.raw`\n`)

const compact = (date: string) => date.replaceAll('-', '')

// Lines may be at most 75 octets; longer ones continue on lines starting
// with a space (RFC 5545). Folding by characters keeps multi-byte text whole.
const fold = (line: string) => {
  const parts: string[] = []
  let rest = line
  while (new TextEncoder().encode(rest).length > 75) {
    let cut = 74
    while (new TextEncoder().encode(rest.slice(0, cut)).length > 74) cut--
    parts.push(rest.slice(0, cut))
    rest = ` ${rest.slice(cut)}`
  }
  parts.push(rest)
  return parts.join('\r\n')
}

// A calendar event for a reminder, repeating every `everyDays` days when
// given (a measurement), or once (a period reminder, whose date moves with
// each cycle). Timed events alert at their time; all-day ones at 09:00.
// Times are floating (the phone's own time zone).
export const reminderCalendar = ({
  uid,
  title,
  description,
  start,
  time,
  everyDays,
  now,
}: {
  uid: string
  title: string
  description: string
  start: string
  time?: string
  everyDays?: number
  // When the file is made, as an ISO timestamp.
  now: string
}) => {
  const stamp = `${now.slice(0, 19).replaceAll(/[-:]/g, '')}Z`
  const isTimed = !!time && /^\d{2}:\d{2}$/.test(time)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Catat Saja//Health reminders//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}@catatsaja`,
    `DTSTAMP:${stamp}`,
    isTimed
      ? `DTSTART:${compact(start)}T${time.replace(':', '')}00`
      : `DTSTART;VALUE=DATE:${compact(start)}`,
    isTimed
      ? 'DURATION:PT15M'
      : `DTEND;VALUE=DATE:${compact(addDays(start, 1))}`,
    ...(everyDays && everyDays > 0
      ? [`RRULE:FREQ=DAILY;INTERVAL=${Math.round(everyDays)}`]
      : []),
    `SUMMARY:${escapeText(title)}`,
    `DESCRIPTION:${escapeText(description)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(title)}`,
    isTimed ? 'TRIGGER:PT0M' : 'TRIGGER;RELATED=START:PT9H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return `${lines.map((line) => fold(line)).join('\r\n')}\r\n`
}
