// Tests for a book's budgets:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  budgetUsage,
  normalizeBudgets,
  wholeBook,
} from '../app/lib/utils/budgets.ts'

const entry = (category, amount, overrides = {}) => ({
  date: '2026-10-05',
  type: 'expense',
  category,
  quantity: 1,
  amount,
  rate: 1,
  ...overrides,
})

const food = { id: 'food', category: 'fnb', limit: 1000 }
const fun = { id: 'fun', category: 'entertainment', limit: 400 }

describe('budget usage', () => {
  test("count only the month's expenses in each budget's category", () => {
    const entries = [
      entry('fnb', 300),
      entry('fnb', 100, { quantity: 2 }),
      entry('fnb', 999, { date: '2026-09-30' }),
      entry('fnb', 999, { type: 'income' }),
      entry('transport', 50),
    ]
    assert.deepEqual(budgetUsage(entries, [food], '2026-10'), [
      {
        id: 'food',
        category: 'fnb',
        period: 'month',
        limit: 1000,
        spent: 500,
        left: 500,
        share: 0.5,
      },
    ])
  })

  test('count the rate into the book currency', () => {
    const [row] = budgetUsage(
      [entry('fnb', 10, { rate: 50 })],
      [food],
      '2026-10',
    )
    assert.equal(row.spent, 500)
  })

  test('go below zero when over, most used first', () => {
    const rows = budgetUsage(
      [entry('fnb', 200), entry('entertainment', 500)],
      [food, fun],
      '2026-10',
    )
    assert.deepEqual(
      rows.map(({ id, left }) => [id, left]),
      [
        ['fun', -100],
        ['food', 800],
      ],
    )
  })

  test('a budget with nothing spent shows all of it left', () => {
    const [row] = budgetUsage([], [food], '2026-10')
    assert.equal(row.left, 1000)
    assert.equal(row.share, 0)
  })

  test('leave out budgets without a limit', () => {
    assert.deepEqual(
      budgetUsage(
        [entry('fnb', 100)],
        [
          { id: 'a', category: 'fnb', limit: null },
          { id: 'b', category: 'bills', limit: 0 },
        ],
        '2026-10',
      ),
      [],
    )
  })
})

describe('the whole book budget', () => {
  test("counts all of the month's expenses and comes first", () => {
    const all = { id: 'all', category: wholeBook, limit: 2000 }
    const usage = budgetUsage(
      [
        entry('fnb', 900),
        entry('transport', 300),
        entry('fnb', 999, { date: '2026-09-30' }),
        entry('salary', 5000, { type: 'income' }),
      ],
      [food, all],
      '2026-10',
    )
    assert.deepEqual(
      usage.map(({ id, spent, left }) => ({ id, spent, left })),
      [
        { id: 'all', spent: 1200, left: 800 },
        { id: 'food', spent: 900, left: 100 },
      ],
    )
  })
})

describe('whole book budgets', () => {
  test("count every month's expenses, not only this month's", () => {
    const usage = budgetUsage(
      [
        entry('fnb', 300),
        entry('fnb', 200, { date: '2026-09-30' }),
        entry('transport', 100, { date: '2026-08-01' }),
      ],
      [
        { ...food, period: 'book' },
        { id: 'all', category: wholeBook, limit: 1000, period: 'book' },
      ],
      '2026-10',
    )
    assert.deepEqual(
      usage.map(({ id, period, spent }) => ({ id, period, spent })),
      [
        { id: 'all', period: 'book', spent: 600 },
        { id: 'food', period: 'book', spent: 500 },
      ],
    )
  })
})

describe('normalizing budgets', () => {
  test('typed limits become numbers, empty ones null', () => {
    assert.deepEqual(
      normalizeBudgets([
        { id: 'a', category: 'fnb', limit: '1500' },
        { id: 'b', category: 'bills', limit: '' },
      ]),
      [
        { id: 'a', category: 'fnb', limit: 1500 },
        { id: 'b', category: 'bills', limit: null },
      ],
    )
  })

  test('a category keeps its first budget', () => {
    assert.deepEqual(
      normalizeBudgets([food, { id: 'twice', category: 'fnb', limit: 5 }]),
      [food],
    )
  })

  test('every budget takes the first one’s period', () => {
    assert.deepEqual(
      normalizeBudgets([
        { id: 'a', category: 'fnb', limit: 1, period: 'book' },
        { id: 'b', category: 'bills', limit: 2, period: 'month' },
        { id: 'c', category: 'transport', limit: 3 },
      ]).map(({ period }) => period),
      ['book', 'book', 'book'],
    )
  })
})
