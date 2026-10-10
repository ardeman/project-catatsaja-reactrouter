import { TFinanceEntry } from '~/lib/types/finance'

import { entryBookTotal } from './finance'

// Analysis of one book, in the book's currency. Computed in the browser from
// the entries; nothing is stored.

export type TGranularity = 'day' | 'week' | 'month'

export type TPeriod = {
  // First day of the period, YYYY-MM-DD.
  start: string
  income: number
  expense: number
  // The book's balance at the end of the period.
  balance: number
}

export type TCategoryTotal = {
  category: string
  total: number
  share: number
}

const DAY = 86_400_000

const toTime = (date: string) => Date.parse(`${date}T00:00:00Z`)

const toDate = (time: number) => new Date(time).toISOString().slice(0, 10)

// Monday of the date's week.
const weekStart = (date: string) => {
  const time = toTime(date)
  const weekday = (new Date(time).getUTCDay() + 6) % 7
  return toDate(time - weekday * DAY)
}

const periodStart = (date: string, granularity: TGranularity) => {
  if (granularity === 'day') return date
  if (granularity === 'week') return weekStart(date)
  return `${date.slice(0, 7)}-01`
}

const nextStart = (start: string, granularity: TGranularity) => {
  if (granularity === 'day') return toDate(toTime(start) + DAY)
  if (granularity === 'week') return toDate(toTime(start) + 7 * DAY)
  const [year, month] = start.split('-').map(Number)
  return toDate(Date.UTC(year, month, 1))
}

// Days from the first entry to the last, both counted.
export const spanDays = (entries: TFinanceEntry[]) => {
  if (entries.length === 0) return 0
  const times = entries.map((entry) => toTime(entry.date))
  return Math.round((Math.max(...times) - Math.min(...times)) / DAY) + 1
}

// Days for a month's book, weeks up to half a year, months beyond.
export const pickGranularity = (entries: TFinanceEntry[]): TGranularity => {
  const days = spanDays(entries)
  if (days <= 31) return 'day'
  if (days <= 183) return 'week'
  return 'month'
}

// Every period from the first entry to the last, empty ones included, so
// gaps show as gaps.
export const groupByPeriod = (
  entries: TFinanceEntry[],
  granularity: TGranularity,
): TPeriod[] => {
  if (entries.length === 0) return []
  const totals = new Map<string, { income: number; expense: number }>()
  for (const entry of entries) {
    const start = periodStart(entry.date, granularity)
    const total = totals.get(start) ?? { income: 0, expense: 0 }
    total[entry.type] += entryBookTotal(entry)
    totals.set(start, total)
  }
  let first = ''
  let last = ''
  for (const start of totals.keys()) {
    if (!first || start < first) first = start
    if (start > last) last = start
  }
  const periods: TPeriod[] = []
  let balance = 0
  for (
    let start = first;
    start <= last;
    start = nextStart(start, granularity)
  ) {
    const { income, expense } = totals.get(start) ?? { income: 0, expense: 0 }
    balance += income - expense
    periods.push({ start, income, expense, balance })
  }
  return periods
}

// Largest first. Past `limit` categories, the rest fold into one "other"
// row, so the list stays readable.
export const totalsByCategory = (
  entries: TFinanceEntry[],
  type: TFinanceEntry['type'],
  limit = 6,
): TCategoryTotal[] => {
  const totals = new Map<string, number>()
  for (const entry of entries) {
    if (entry.type !== type) continue
    totals.set(
      entry.category,
      (totals.get(entry.category) ?? 0) + entryBookTotal(entry),
    )
  }
  let sum = 0
  for (const total of totals.values()) sum += total
  if (sum === 0) return []
  const sorted = Array.from(totals, ([category, total]) => ({
    category,
    total,
    share: total / sum,
  })).toSorted((a, b) => b.total - a.total)
  if (sorted.length <= limit + 1) return sorted
  let restTotal = 0
  for (const item of sorted.slice(limit)) restTotal += item.total
  return [
    ...sorted.slice(0, limit),
    { category: 'rest', total: restTotal, share: restTotal / sum },
  ]
}

export const largestEntry = (
  entries: TFinanceEntry[],
  type: TFinanceEntry['type'],
) => {
  let largest: TFinanceEntry | undefined
  for (const entry of entries) {
    if (entry.type !== type) continue
    if (!largest || entryBookTotal(entry) > entryBookTotal(largest))
      largest = entry
  }
  return largest
}

// The last period's spending against the one before, as a fraction
// (0.2 = 20% more). Undefined when there is nothing to compare with.
export const spendingChange = (periods: TPeriod[]) => {
  if (periods.length < 2) return
  const previous = periods.at(-2)?.expense ?? 0
  const current = periods.at(-1)?.expense ?? 0
  if (previous === 0) return
  return (current - previous) / previous
}

// Round axis ticks (1, 2 or 5 × a power of ten) covering min..max, always
// including 0.
export const niceTicks = (min: number, max: number, count = 4) => {
  const low = Math.min(0, min)
  const high = Math.max(0, max)
  if (low === high) return [0]
  const rough = (high - low) / count
  const power = 10 ** Math.floor(Math.log10(rough))
  const step =
    [1, 2, 5, 10].map((factor) => factor * power).find((s) => s >= rough) ??
    10 * power
  const ticks: number[] = []
  for (
    let tick = Math.floor(low / step) * step;
    tick <= Math.ceil(high / step) * step + step / 2;
    tick += step
  )
    ticks.push(Math.round(tick / step) * step)
  return ticks
}

// "Oct 5" for days and weeks (weeks by their Monday), "Oct" for months,
// with the year when `withYear` (months spanning years, long labels).
export const formatPeriod = ({
  start,
  granularity,
  locale,
  withYear = false,
}: {
  start: string
  granularity: TGranularity
  locale: string
  withYear?: boolean
}) =>
  new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    month: 'short',
    ...(granularity !== 'month' && { day: 'numeric' }),
    ...(withYear && { year: 'numeric' }),
  }).format(new Date(toTime(start)))
