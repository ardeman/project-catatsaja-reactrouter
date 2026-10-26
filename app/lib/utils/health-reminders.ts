// Health reminders: when each is due and when its push notification goes
// out. Pure logic, no app imports, so it can be tested on its own
// (tests/health-reminders.test.mjs).

type TKind =
  | 'body'
  | 'glucose'
  | 'uricAcid'
  | 'cholesterol'
  | 'calories'
  | 'period'
  | 'intimacy'

type TReminder =
  | {
      id: string
      kind: Exclude<TKind, 'period' | 'intimacy'>
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

// When a reminder's push notification goes out: on its due day at its
// time (09:00 without one), if that is still to come. One that is already
// due shows only in the app.
export const reminderPushAt = ({
  reminder,
  status,
  today,
  now,
}: {
  reminder: TReminder
  status: TReminderStatus
  today: string
  // HH:MM
  now: string
}) => {
  if (!status.dueDate) return
  const time = (reminder.kind !== 'period' && reminder.time) || '09:00'
  if (status.dueDate < today || (status.dueDate === today && time <= now))
    return
  return { date: status.dueDate, time }
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
