// Tests for a book's budgets:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { budgetUsage, normalizeBudgets } from '../app/lib/utils/budgets.ts'

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
})
