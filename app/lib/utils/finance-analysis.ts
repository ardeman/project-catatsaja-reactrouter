import {
  TCategoryTotal,
  TFinanceEntry,
  TFinanceResponse,
  TFinanceSummary,
} from '~/lib/types/finance'

import { entryBookTotal, newestFirst, summarize } from './finance'

// Analysis of one book, in the book's currency. Computed in the browser from
// the entries; nothing is stored.

type TTimeGranularity = 'day' | 'week' | 'month'

// A period of time, or one day of the week added up over the whole range.
export type TGranularity = TTimeGranularity | 'weekday'

// What the analysis groups entries by, chosen by the person.
export const groupings = [
  'day',
  'week',
  'month',
  'weekday',
  'category',
  'item',
] as const

export type TGroupBy = (typeof groupings)[number]

export type TPeriod = {
  // First day of the period, YYYY-MM-DD. For a day of the week, a date
  // that falls on it (see `groupByWeekday`).
  start: string
  income: number
  expense: number
  // The book's balance at the end of the period.
  balance: number
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

const periodStart = (date: string, granularity: TTimeGranularity) => {
  if (granularity === 'day') return date
  return granularity === 'week' ? weekStart(date) : `${date.slice(0, 7)}-01`
}

const nextStart = (start: string, granularity: TTimeGranularity) => {
  if (granularity === 'day') return toDate(toTime(start) + DAY)
  if (granularity === 'week') return toDate(toTime(start) + 7 * DAY)
  const [year, month] = start.split('-').map(Number)
  return toDate(Date.UTC(year, month, 1))
}

// Days from `from` to `to`, both counted.
export const rangeDays = (from: string, to: string) =>
  Math.round((toTime(to) - toTime(from)) / DAY) + 1

// The grouping offered first for a range of `days`: days for a month,
// weeks up to half a year, months beyond.
export const pickGranularity = (days: number): TTimeGranularity => {
  if (days <= 31) return 'day'
  return days <= 183 ? 'week' : 'month'
}

// Every period from the first entry to the last, empty ones included, so
// gaps show as gaps. A chosen range (`from`, `to`) is covered whole, and the
// balance starts from `opening`, what the book held before it.
export const groupByPeriod = (
  entries: TFinanceEntry[],
  granularity: TTimeGranularity,
  { from = '', to = '', opening = 0 } = {},
): TPeriod[] => {
  if (entries.length === 0) return []
  const totals = new Map<string, { income: number; expense: number }>()
  for (const entry of entries) {
    const start = periodStart(entry.date, granularity)
    const total = totals.get(start) ?? { income: 0, expense: 0 }
    total[entry.type] += entryBookTotal(entry)
    totals.set(start, total)
  }
  let first = from && periodStart(from, granularity)
  let last = to && periodStart(to, granularity)
  for (const start of totals.keys()) {
    if (!first || start < first) first = start
    if (start > last) last = start
  }
  const periods: TPeriod[] = []
  let balance = opening
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

// 2024-01-01 was a Monday: the dates of that week stand for the days of the
// week, so charts and tooltips can label them like any period.
const weekdayDates = Array.from({ length: 7 }, (_, index) =>
  toDate(Date.UTC(2024, 0, 1 + index)),
)

// Income and expenses on each day of the week, Monday first. Balances mean
// nothing here and stay 0.
export const groupByWeekday = (entries: TFinanceEntry[]): TPeriod[] => {
  const periods = weekdayDates.map((start) => ({
    start,
    income: 0,
    expense: 0,
    balance: 0,
  }))
  for (const entry of entries) {
    const weekday = (new Date(toTime(entry.date)).getUTCDay() + 6) % 7
    periods[weekday][entry.type] += entryBookTotal(entry)
  }
  return periods
}

// What the book held before `date`.
export const balanceBefore = (entries: TFinanceEntry[], date: string) => {
  let balance = 0
  for (const entry of entries) {
    if (entry.date >= date) continue
    balance += (entry.type === 'income' ? 1 : -1) * entryBookTotal(entry)
  }
  return balance
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
  if (previous === 0) return
  const current = periods.at(-1)?.expense ?? 0
  return (current - previous) / previous
}

export type TComparedCategory = {
  category: string
  current: number
  previous: number
}

// Each category's total in two ranges, largest now first. Past `limit`
// categories, the rest fold into one "other" row, as in `totalsByCategory`.
export const compareCategories = (
  current: TFinanceEntry[],
  previous: TFinanceEntry[],
  type: TFinanceEntry['type'],
  limit = 6,
): TComparedCategory[] => {
  const totals = new Map<string, TComparedCategory>()
  const add = (entries: TFinanceEntry[], key: 'current' | 'previous') => {
    for (const entry of entries) {
      if (entry.type !== type) continue
      const total = totals.get(entry.category) ?? {
        category: entry.category,
        current: 0,
        previous: 0,
      }
      total[key] += entryBookTotal(entry)
      totals.set(entry.category, total)
    }
  }
  add(current, 'current')
  add(previous, 'previous')
  const sorted = Array.from(totals, ([, total]) => total).toSorted(
    (a, b) => b.current - a.current || b.previous - a.previous,
  )
  if (sorted.length <= limit + 1) return sorted
  const rest = { category: 'rest', current: 0, previous: 0 }
  for (const item of sorted.slice(limit)) {
    rest.current += item.current
    rest.previous += item.previous
  }
  return [...sorted.slice(0, limit), rest]
}

// The largest value a chart's scale is drawn to: the largest within four
// times a typical value (the upper quartile), so a payday or a big purchase
// doesn't flatten daily spending. Those above are drawn cut off, but never
// more than an eighth of the values, or the chart would be mostly cut marks.
export const scaleLimit = (values: number[]) => {
  const sorted = values.filter((value) => value > 0).toSorted((a, b) => a - b)
  const last = sorted.length - 1
  if (last < 0) return 0
  const typical = sorted[Math.floor(last * 0.75)]
  const fits = sorted.findLast((value) => value <= 4 * typical) ?? typical
  const cutAtMost = Math.min(last, Math.max(1, Math.floor(sorted.length / 8)))
  return Math.max(fits, sorted[last - cutAtMost])
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
// with the year when `withYear` (months spanning years, long labels). A day
// of the week is "Mon", or "Monday" for long labels.
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
    ...(granularity === 'weekday'
      ? { weekday: withYear ? 'long' : 'short' }
      : {
          month: 'short',
          ...(granularity !== 'month' && { day: 'numeric' }),
          ...(withYear && { year: 'numeric' }),
        }),
  }).format(new Date(toTime(start)))

// How many of the newest entries a book's summary keeps, for cards, search
// and category suggestions in other books.
const recentInSummary = 50

export const bookSummary = (entries: TFinanceEntry[]): TFinanceSummary => {
  const { income, expense } = summarize(entries)
  return {
    count: entries.length,
    income,
    expense,
    spending: totalsByCategory(entries, 'expense'),
    recent: newestFirst(entries).slice(0, recentInSummary),
  }
}

const emptySummary = bookSummary([])

// A book's summary: worked out from its entries when they are at hand (an
// open book), otherwise the stored one.
export const summaryOf = (
  book: Pick<TFinanceResponse, 'content' | 'summary'>,
) => (book.content ? bookSummary(book.content) : (book.summary ?? emptySummary))

// The entries known without opening a book: its summary's newest ones. For
// search and category suggestions.
export const knownEntries = (book: Pick<TFinanceResponse, 'summary'>) =>
  book.summary?.recent ?? []
