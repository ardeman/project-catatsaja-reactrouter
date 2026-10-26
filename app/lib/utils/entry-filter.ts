// Filtering a book's entries by type, category and date. No app imports
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
  type: 'all' | TFinanceEntry['type']
  // Empty for every category.
  category: string
  period: TEntryPeriod
  // YYYY-MM-DD, used when the period is custom; either may be empty.
  from: string
  to: string
}

export const emptyEntryFilter: TEntryFilter = {
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
  return [filter.type !== 'all', filter.category !== '', !!(from || to)].filter(
    Boolean,
  ).length
}

export const filterEntries = (
  entries: TFinanceEntry[],
  filter: TEntryFilter,
  today = new Date(),
) => {
  const { from, to } = periodRange(filter, today)
  return entries.filter(
    (entry) =>
      (filter.type === 'all' || entry.type === filter.type) &&
      (!filter.category || entry.category === filter.category) &&
      (!from || entry.date >= from) &&
      (!to || entry.date <= to),
  )
}
