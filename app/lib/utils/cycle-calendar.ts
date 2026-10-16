// What each day of a period calendar shows: logged period days in the past,
// and from today on the predicted periods, the days a period could also
// fall on, the fertile window and ovulation. Pure logic, no app imports,
// so it can be tested on its own (tests/cycle-calendar.test.mjs).

export type TCycleDay =
  'period' | 'predicted' | 'possible' | 'fertile' | 'ovulation'

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
  ovulation: 3,
  predicted: 4,
  period: 5,
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
    ovulation: [ovulation, ovulation],
  } satisfies Record<Exclude<TCycleDay, 'period'>, [string, string]>
}

export const cycleCalendar = (
  periods: TPeriod[],
  cycle: TCycle | undefined,
  today: string,
  until: string,
  // Days before this are left out, so a long history costs nothing.
  since = '',
) => {
  const days = new Map<string, TCycleDay>()
  const mark = (
    [from, to]: [string, string],
    kind: TCycleDay,
    canBePast = false,
  ) => {
    for (
      let date = from < since ? since : from;
      date <= to;
      date = addDays(date, 1)
    ) {
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

// What tapping a day opens. `start`: the period the day is part of (`id`),
// or one starting on it (`date`), which is a period starting just after
// moved back to it (`id` and `date`) or a new one. `end`: the period the
// day could be the last day of (`isEnd` when it already is), longer or
// shorter than logged. Nothing for days ahead.
export const periodTap = (
  periods: (TPeriod & { id: string })[],
  day: string,
  today: string,
  periodLength: number,
) => {
  if (day > today) return
  const sorted = periods.toSorted((a, b) => a.date.localeCompare(b.date))
  const before = sorted.findLast((period) => period.date <= day)
  const after = sorted.find((period) => period.date > day)
  const isInside =
    !!before && day <= (before.end ?? addDays(before.date, periodLength - 1))
  const start: { id?: string; date?: string } =
    before && isInside
      ? { id: before.id }
      : after && daysFrom(day, after.date) <= MOVE_START_DAYS
        ? { id: after.id, date: day }
        : { date: day }
  const end =
    before && daysFrom(before.date, day) < MAX_PERIOD_DAYS
      ? { id: before.id, isEnd: before.end === day }
      : undefined
  return { start, end }
}

// Where today falls in the cycle, for the overview: a period day (which
// one, and its logged or expected last day), ovulation, the fertile window,
// or nothing to say but the next period.
export const cycleToday = (
  periods: TPeriod[],
  cycle: TCycle,
  today: string,
) => {
  const kind = cycleCalendar(periods, cycle, today, today, today).get(today)
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
  if (kind === 'fertile')
    return {
      kind: 'fertile',
      fertileEnd: fertile[1],
      ovulation: addDays(cycle.nextStart, -LUTEAL_DAYS),
    } as const
  return { kind: 'next' } as const
}
