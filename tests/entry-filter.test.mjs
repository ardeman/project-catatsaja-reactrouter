// Tests for filtering a book's entries by type, category and date:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  activeFilterCount,
  emptyEntryFilter,
  filterEntries,
  periodRange,
} from '../app/lib/utils/entry-filter.ts'

const entry = (id, type, category, date) => ({
  id,
  type,
  category,
  date,
  description: '',
  quantity: 1,
  amount: 1000,
  rate: 1,
  currency: { code: 'IDR', symbol: 'Rp', maximumFractionDigits: 0 },
})

const entries = [
  entry('salary', 'income', 'salary', '2026-10-01'),
  entry('lunch', 'expense', 'fnb', '2026-10-20'),
  entry('rice', 'expense', 'groceries', '2026-09-30'),
  entry('old', 'expense', 'fnb', '2025-12-31'),
]
const today = new Date(2026, 9, 27)
const ids = (filter) =>
  filterEntries(entries, { ...emptyEntryFilter, ...filter }, today).map(
    (item) => item.id,
  )

describe('filterEntries', () => {
  test('keeps every entry without filters', () => {
    assert.deepEqual(ids({}), ['salary', 'lunch', 'rice', 'old'])
  })

  test('by type and category', () => {
    assert.deepEqual(ids({ type: 'expense' }), ['lunch', 'rice', 'old'])
    assert.deepEqual(ids({ category: 'fnb' }), ['lunch', 'old'])
    assert.deepEqual(ids({ type: 'income', category: 'fnb' }), [])
  })

  test('by period', () => {
    assert.deepEqual(ids({ period: 'thisMonth' }), ['salary', 'lunch'])
    assert.deepEqual(ids({ period: 'lastMonth' }), ['rice'])
    assert.deepEqual(ids({ period: 'last3Months' }), [
      'salary',
      'lunch',
      'rice',
    ])
    assert.deepEqual(ids({ period: 'thisYear' }), ['salary', 'lunch', 'rice'])
  })

  test('by custom dates, open ended or the wrong way round', () => {
    assert.deepEqual(ids({ period: 'custom', from: '2026-10-01' }), [
      'salary',
      'lunch',
    ])
    assert.deepEqual(ids({ period: 'custom', to: '2026-09-30' }), [
      'rice',
      'old',
    ])
    assert.deepEqual(
      ids({ period: 'custom', from: '2026-10-01', to: '2026-09-30' }),
      ['salary', 'rice'],
    )
    // Dates are ignored unless the period is custom.
    assert.deepEqual(ids({ from: '2026-10-01' }).length, 4)
  })
})

describe('periodRange', () => {
  test('last month across a new year', () => {
    assert.deepEqual(
      periodRange(
        { period: 'lastMonth', from: '', to: '' },
        new Date(2026, 0, 5),
      ),
      { from: '2025-12-01', to: '2025-12-31' },
    )
  })

  test('last 3 months include this one', () => {
    assert.deepEqual(
      periodRange(
        { period: 'last3Months', from: '', to: '' },
        new Date(2026, 1, 10),
      ),
      { from: '2025-12-01', to: '2026-02-28' },
    )
  })
})

describe('activeFilterCount', () => {
  test('counts type, category and a period', () => {
    assert.equal(activeFilterCount(emptyEntryFilter), 0)
    assert.equal(
      activeFilterCount({
        ...emptyEntryFilter,
        type: 'expense',
        category: 'fnb',
        period: 'thisMonth',
      }),
      3,
    )
    // A custom period with no dates filters nothing.
    assert.equal(
      activeFilterCount({ ...emptyEntryFilter, period: 'custom' }),
      0,
    )
  })
})
