// What each day of a period calendar shows: logged period days in the past,
// and from today on the predicted periods, the days a period could also
// fall on, the fertile window and ovulation. Pure logic, no app imports,
// so it can be tested on its own (tests/cycle-calendar.test.mjs).

export type TCycleDay =
  | 'period'
  | 'predicted'
  | 'possible'
  | 'fertile'
  | 'ovulationWindow'
  | 'ovulation'

type TPeriod = { date: string; end?: string }

type TCycle = {
  nextStart: string
  cycleLength: number
  periodLength: number
  shortestCycle: number
  longestCycle: number
}

// When two marks fall on one day, the higher one shows.
const rank: Record<TCycleDay, number> = {
  possible: 1,
  fertile: 2,
  ovulationWindow: 3,
  ovulation: 4,
  predicted: 5,
  period: 6,
}

const DAY = 86_400_000

const toTime = (date: string) => Date.parse(`${date}T00:00:00Z`)

const addDays = (date: string, days: number) =>
  new Date(toTime(date) + days * DAY).toISOString().slice(0, 10)

// Days a period might start before or after the predicted day: how much the
// recent cycles varied, and at least two days either way.
const MIN_SPREAD = 2

// How far ahead predictions go, in cycles.
const MAX_CYCLES = 24

// Ovulation is taken as 14 days before a period; it may be a day either side.
const LUTEAL_DAYS = 14

// The predicted windows of the cycle whose period starts on `start`, each
// as [first day, last day].
export const cycleWindows = (cycle: TCycle, start: string) => {
  const before = Math.max(MIN_SPREAD, cycle.cycleLength - cycle.shortestCycle)
  const after = Math.max(MIN_SPREAD, cycle.longestCycle - cycle.cycleLength)
  const end = addDays(start, cycle.periodLength - 1)
  const ovulation = addDays(start, -LUTEAL_DAYS)
  return {
    predicted: [start, end],
    possible: [addDays(start, -before), addDays(end, after)],
    fertile: [addDays(ovulation, -5), addDays(ovulation, 1)],
    ovulationWindow: [addDays(ovulation, -1), addDays(ovulation, 1)],
    ovulation: [ovulation, ovulation],
  } satisfies Record<Exclude<TCycleDay, 'period'>, [string, string]>
}

export const cycleCalendar = (
  periods: TPeriod[],
  cycle: TCycle | undefined,
  today: string,
  until: string,
) => {
  const days = new Map<string, TCycleDay>()
  const mark = (
    [from, to]: [string, string],
    kind: TCycleDay,
    canBePast = false,
  ) => {
    for (let date = from; date <= to; date = addDays(date, 1)) {
      if (!canBePast && date < today) continue
      const current = days.get(date)
      if (!current || rank[kind] > rank[current]) days.set(date, kind)
    }
  }

  const periodLength = cycle?.periodLength ?? 5
  for (const period of periods) {
    if (period.date > today) continue
    if (period.end) {
      mark([period.date, period.end], 'period', true)
      continue
    }
    // No end yet: logged through today at most, the rest of an average
    // period predicted.
    const end = addDays(period.date, periodLength - 1)
    mark([period.date, end < today ? end : today], 'period', true)
    if (end > today) mark([addDays(today, 1), end], 'predicted')
  }
  if (!cycle) return days

  for (let index = 0; index < MAX_CYCLES; index++) {
    const windows = cycleWindows(
      cycle,
      addDays(cycle.nextStart, index * cycle.cycleLength),
    )
    if (windows.possible[0] > until && windows.fertile[0] > until) break
    for (const [kind, window] of Object.entries(windows))
      mark(window, kind as keyof typeof windows)
  }
  return days
}

// A period is taken to last at most this long: a day further from a start
// can't be its last day.
const MAX_PERIOD_DAYS = 14

// A start this close before a logged period moves that period's start
// instead of adding another.
const MOVE_START_DAYS = 7

const daysFrom = (from: string, to: string) =>
  Math.round((toTime(to) - toTime(from)) / DAY)

// What tapping a day on the calendar can do: start a period (or move the
// next one's start back to it), make it the last day of the period before,
// undo a logged last day (the end then follows the prediction again), or
// remove the period that starts on it. Nothing for days ahead.
export type TPeriodAction =
  | { type: 'start'; id?: string }
  | { type: 'end'; id: string }
  | { type: 'clearEnd'; id: string }
  | { type: 'remove'; id: string }

export const periodActions = (
  periods: (TPeriod & { id: string })[],
  day: string,
  today: string,
  periodLength: number,
) => {
  const actions: TPeriodAction[] = []
  if (day > today) return actions
  const sorted = periods.toSorted((a, b) => a.date.localeCompare(b.date))
  const before = sorted.findLast((period) => period.date <= day)
  const after = sorted.find((period) => period.date > day)

  const isInside =
    !!before && day <= (before.end ?? addDays(before.date, periodLength - 1))
  if (!isInside)
    actions.push(
      after && daysFrom(day, after.date) <= MOVE_START_DAYS
        ? { type: 'start', id: after.id }
        : { type: 'start' },
    )
  if (before) {
    if (before.end === day) actions.push({ type: 'clearEnd', id: before.id })
    else if (daysFrom(before.date, day) < MAX_PERIOD_DAYS)
      actions.push({ type: 'end', id: before.id })
    if (before.date === day) actions.push({ type: 'remove', id: before.id })
  }
  return actions
}

// Where today falls in the cycle, for the overview: a period day (which
// one, and its logged or expected last day), ovulation, the fertile window,
// or nothing to say but the next period.
export const cycleToday = (
  periods: TPeriod[],
  cycle: TCycle,
  today: string,
) => {
  const kind = cycleCalendar(periods, cycle, today, today).get(today)
  const fertile = cycleWindows(cycle, cycle.nextStart).fertile
  if (kind === 'period') {
    const period = periods
      .filter((item) => item.date <= today)
      .toSorted((a, b) => b.date.localeCompare(a.date))[0]
    return {
      kind,
      day: daysFrom(period.date, today) + 1,
      end: period.end ?? addDays(period.date, cycle.periodLength - 1),
      isEndLogged: !!period.end,
    } as const
  }
  if (kind === 'ovulation') return { kind, fertileEnd: fertile[1] } as const
  if (kind === 'fertile' || kind === 'ovulationWindow')
    return {
      kind: 'fertile',
      fertileEnd: fertile[1],
      ovulation: addDays(cycle.nextStart, -LUTEAL_DAYS),
    } as const
  return { kind: 'next' } as const
}
