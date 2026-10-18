// Medication reminders: which doses are scheduled on a day, which are
// waiting to be marked taken or skipped, the next one, and when a course
// ends. Pure logic, no app imports, so it can be tested on its own
// (tests/medication-schedule.test.mjs). Dates are YYYY-MM-DD and times
// HH:MM, both in the person's own time zone.

type TCourse =
  | { kind: 'ongoing' }
  | { kind: 'until'; date: string }
  | { kind: 'days'; days: number }
  | { kind: 'doses'; doses: number }

type TMedication = {
  id: string
  times: string[]
  everyDays: number
  start: string
  course: TCourse
  // The last day, when stopped before the course ends.
  stopped?: string
}

type TDose = {
  medicationId: string
  date: string
  time: string
  status: 'taken' | 'skipped'
}

const DAY = 86_400_000

const addDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY)
    .toISOString()
    .slice(0, 10)

const daysBetween = (from: string, to: string) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY,
  )

const earliest = (...dates: (string | undefined)[]) =>
  dates
    .filter((date): date is string => !!date)
    .toSorted((a, b) => a.localeCompare(b))
    .at(0)

// Dates compare as text.
const latest = (a: string, b: string) => (a.localeCompare(b) > 0 ? a : b)

// Unmarked doses are looked for this many days back (yesterday's evening
// dose is still worth marking in the morning); older ones count as missed.
const WAITING_DAYS = 1

// One record per dose, so marking it on two devices keeps one answer.
export const doseId = (medicationId: string, date: string, time: string) =>
  `${medicationId}_${date}_${time}`

const sortedTimes = (medication: TMedication) =>
  [...new Set(medication.times)].toSorted((a, b) => a.localeCompare(b))

// The last day of the course, when it has a fixed end (a date, a number of
// days, or stopped early). A course of doses ends when they are taken.
export const lastDay = (medication: TMedication) =>
  earliest(
    medication.course.kind === 'until' ? medication.course.date : undefined,
    medication.course.kind === 'days'
      ? addDays(medication.start, Math.max(1, medication.course.days) - 1)
      : undefined,
    medication.stopped,
  )

const isScheduledOn = (medication: TMedication, date: string) => {
  const since = daysBetween(medication.start, date)
  const end = lastDay(medication)
  return (
    since >= 0 &&
    (!end || date <= end) &&
    since % Math.max(1, Math.round(medication.everyDays)) === 0
  )
}

const marksOf = (medicationId: string, doses: TDose[]) =>
  doses.filter((dose) => dose.medicationId === medicationId)

const takenCount = (medicationId: string, doses: TDose[]) =>
  marksOf(medicationId, doses).filter((dose) => dose.status === 'taken').length

// Whether a course of doses has had them all.
const isComplete = (medication: TMedication, doses: TDose[]) =>
  medication.course.kind === 'doses' &&
  takenCount(medication.id, doses) >= medication.course.doses

// Finished: past its last day, stopped, or every dose taken.
export const isFinished = (
  medication: TMedication,
  doses: TDose[],
  today: string,
) => {
  const end = lastDay(medication)
  return (!!end && end < today) || isComplete(medication, doses)
}

export type TScheduledDose = {
  date: string
  time: string
  status?: TDose['status']
}

// The doses of a day, marked or not. Once a course of doses is complete,
// only the marked ones are left.
export const dosesOn = (
  medication: TMedication,
  doses: TDose[],
  date: string,
): TScheduledDose[] => {
  const marks = marksOf(medication.id, doses).filter(
    (dose) => dose.date === date,
  )
  const scheduled = isScheduledOn(medication, date)
    ? sortedTimes(medication)
    : []
  const isDone = isComplete(medication, doses)
  return [...new Set([...scheduled, ...marks.map((dose) => dose.time)])]
    .toSorted((a, b) => a.localeCompare(b))
    .map((time) => ({
      date,
      time,
      status: marks.find((dose) => dose.time === time)?.status,
    }))
    .filter((dose) => dose.status || !isDone)
}

// Doses whose time has come and that nobody has marked yet, oldest first,
// from yesterday and today.
export const waitingDoses = <TItem extends TMedication>({
  medications,
  doses,
  today,
  now,
}: {
  medications: TItem[]
  doses: TDose[]
  today: string
  // HH:MM
  now: string
}) =>
  medications
    .flatMap((medication) =>
      Array.from({ length: WAITING_DAYS + 1 }, (_, index) =>
        addDays(today, index - WAITING_DAYS),
      ).flatMap((date) =>
        dosesOn(medication, doses, date)
          .filter((dose) => !dose.status && (date < today || dose.time <= now))
          .map((dose) => ({ medication, date, time: dose.time })),
      ),
    )
    .toSorted((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
    )

// The next dose still to come (after now), if the course goes on.
export const nextDose = ({
  medication,
  doses,
  today,
  now,
}: {
  medication: TMedication
  doses: TDose[]
  today: string
  now: string
}) => {
  if (isComplete(medication, doses)) return
  const from = latest(medication.start, today)
  const span = Math.max(1, Math.round(medication.everyDays)) + 1
  for (let index = 0; index < span; index++) {
    const date = addDays(from, index)
    const dose = dosesOn(medication, doses, date).find(
      (item) => !item.status && (date > today || item.time > now),
    )
    if (dose) return dose
  }
}

// Scheduled doses from `from` to `end`.
const countScheduled = (medication: TMedication, from: string, end: string) => {
  let count = 0
  const step = Math.max(1, Math.round(medication.everyDays))
  const since = Math.max(0, daysBetween(medication.start, from))
  // The first scheduled day on or after `from`.
  let date = addDays(medication.start, Math.ceil(since / step) * step)
  while (date <= end) {
    count += sortedTimes(medication).length
    date = addDays(date, step)
  }
  return count
}

// Doses left: for a course of doses, those not yet taken; for one with an
// end date, the scheduled ones from today on not yet marked. None for an
// ongoing course.
export const dosesLeft = (
  medication: TMedication,
  doses: TDose[],
  today: string,
) => {
  if (medication.course.kind === 'doses')
    return Math.max(
      0,
      medication.course.doses - takenCount(medication.id, doses),
    )
  const end = lastDay(medication)
  if (!end || end < today) return end ? 0 : undefined
  const marked = marksOf(medication.id, doses).filter(
    (dose) => dose.date >= today,
  ).length
  return Math.max(0, countScheduled(medication, today, end) - marked)
}

// The day the course is expected to end: its last day, or for a course of
// doses the day the last one left is due if none is skipped.
export const expectedEnd = (
  medication: TMedication,
  doses: TDose[],
  today: string,
) => {
  const end = lastDay(medication)
  if (end || medication.course.kind !== 'doses') return end
  const left = dosesLeft(medication, doses, today) ?? 0
  if (left === 0) return
  const perDay = Math.max(1, sortedTimes(medication).length)
  const step = Math.max(1, Math.round(medication.everyDays))
  const from = latest(medication.start, today)
  const since = Math.max(0, daysBetween(medication.start, from))
  const first = addDays(medication.start, Math.ceil(since / step) * step)
  // Today's doses already marked don't count against what is left.
  const markedToday = marksOf(medication.id, doses).filter(
    (dose) => dose.date === first,
  ).length
  const days = Math.ceil((left + markedToday) / perDay)
  return addDays(first, (days - 1) * step)
}

// Doses still to come in the next `days` days (after now), at most `limit`
// and no more than a course of doses has left: what push notifications are
// scheduled for (`use-sync-reminder-push.ts`).
export const upcomingDoses = ({
  medication,
  doses,
  today,
  now,
  days = 14,
  limit = 64,
}: {
  medication: TMedication
  doses: TDose[]
  today: string
  now: string
  days?: number
  limit?: number
}) => {
  if (isComplete(medication, doses)) return []
  const left =
    medication.course.kind === 'doses'
      ? Math.max(0, medication.course.doses - takenCount(medication.id, doses))
      : limit
  const upcoming: { date: string; time: string }[] = []
  for (let index = 0; index < days; index++) {
    const date = addDays(today, index)
    for (const dose of dosesOn(medication, doses, date))
      if (!dose.status && (date > today || dose.time > now))
        upcoming.push({ date, time: dose.time })
  }
  return upcoming.slice(0, Math.min(limit, left))
}
