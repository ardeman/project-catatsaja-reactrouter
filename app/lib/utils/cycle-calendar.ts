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
