// Filtering a book's entries by words, type, category and date. No app imports
// (types only), so `pnpm test:unit` runs it directly.
import type { TFinanceEntry } from '~/lib/types/finance'

export const entryPeriods = [
  'all',
  'thisMonth',
  'lastMonth',
  'last3Months',
  'thisYear',
  'custom',
] as const

export type TEntryPeriod = (typeof entryPeriods)[number]

export type TEntryFilter = {
  // Words looked for in the description and category name; empty for all.
  text: string
  type: 'all' | TFinanceEntry['type']
  // Empty for every category.
  category: string
  period: TEntryPeriod
  // YYYY-MM-DD, used when the period is custom; either may be empty.
  from: string
  to: string
}

export const emptyEntryFilter: TEntryFilter = {
  text: '',
  type: 'all',
  category: '',
  period: 'all',
  from: '',
  to: '',
}

export const toValue = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')

// A YYYY-MM-DD date as midnight local time.
export const fromValue = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// The first and last day a period covers, as YYYY-MM-DD; empty is open.
export const periodRange = (
  filter: Pick<TEntryFilter, 'period' | 'from' | 'to'>,
  today = new Date(),
) => {
  const year = today.getFullYear()
  const month = today.getMonth()
  switch (filter.period) {
    case 'thisMonth': {
      return {
        from: toValue(new Date(year, month, 1)),
        to: toValue(new Date(year, month + 1, 0)),
      }
    }
    case 'lastMonth': {
      return {
        from: toValue(new Date(year, month - 1, 1)),
        to: toValue(new Date(year, month, 0)),
      }
    }
    case 'last3Months': {
      return {
        from: toValue(new Date(year, month - 2, 1)),
        to: toValue(new Date(year, month + 1, 0)),
      }
    }
    case 'thisYear': {
      return { from: `${year}-01-01`, to: `${year}-12-31` }
    }
    case 'custom': {
      // Dates typed the wrong way round still cover the days between them.
      const { from, to } = filter
      return from && to && from > to ? { from: to, to: from } : { from, to }
    }
    default: {
      return { from: '', to: '' }
    }
  }
}

// How many of the filters are in use, for the Filter button's badge.
export const activeFilterCount = (filter: TEntryFilter) => {
  const { from, to } = periodRange(filter)
  return [
    filter.text.trim() !== '',
    filter.type !== 'all',
    filter.category !== '',
    !!(from || to),
  ].filter(Boolean).length
}

type TFilterOptions = {
  today?: Date
  // The category's name in the person's language, so it can be searched.
  categoryLabel?: (category: string) => string
}

export const filterEntries = (
  entries: TFinanceEntry[],
  filter: TEntryFilter,
  {
    today = new Date(),
    categoryLabel = (category) => category,
  }: TFilterOptions = {},
) => {
  const { from, to } = periodRange(filter, today)
  const text = filter.text.trim().toLowerCase()
  return entries.filter(
    (entry) =>
      (!text ||
        `${entry.description} ${categoryLabel(entry.category)}`
          .toLowerCase()
          .includes(text)) &&
      (filter.type === 'all' || entry.type === filter.type) &&
      (!filter.category || entry.category === filter.category) &&
      (!from || entry.date >= from) &&
      (!to || entry.date <= to),
  )
}

// What a range is compared with: the range just before it, or the same
// dates a year earlier.
export const comparisons = ['previous', 'lastYear'] as const

export type TComparison = (typeof comparisons)[number]

// Calendar periods move back by whole months, so a month compares with a
// month.
const periodMonths: Partial<Record<TEntryPeriod, number>> = {
  thisMonth: 1,
  lastMonth: 1,
  last3Months: 3,
  thisYear: 12,
}

const daysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate()

// The same day `months` earlier, or that month's last day if it is shorter.
// A month's last day stays its last day (31 March → 28 February).
const monthsBefore = (date: string, months: number) => {
  const [year, month, day] = date.split('-').map(Number)
  const target = month - 1 - months
  const isLastDay = day === daysInMonth(year, month - 1)
  const length = daysInMonth(year, target)
  return toValue(
    new Date(year, target, isLastDay ? length : Math.min(day, length)),
  )
}

const daysBefore = (date: string, days: number) => {
  const value = fromValue(date)
  value.setDate(value.getDate() - days)
  return toValue(value)
}

// The range compared with `from`–`to` (both YYYY-MM-DD, counted), where `to`
// is how far the range has got: this month so far compares with the same
// days of last month. A custom range compares with as many days just before
// it.
export const comparedRange = (
  { from, to }: { from: string; to: string },
  period: TEntryPeriod,
  comparison: TComparison,
) => {
  const months = comparison === 'lastYear' ? 12 : periodMonths[period]
  if (months)
    return { from: monthsBefore(from, months), to: monthsBefore(to, months) }
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number)
  const [toYear, toMonth, toDay] = to.split('-').map(Number)
  const days =
    Math.round(
      (Date.UTC(toYear, toMonth - 1, toDay) -
        Date.UTC(fromYear, fromMonth - 1, fromDay)) /
        86_400_000,
    ) + 1
  return { from: daysBefore(from, days), to: daysBefore(from, 1) }
}
