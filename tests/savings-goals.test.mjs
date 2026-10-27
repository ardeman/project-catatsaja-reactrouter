// Tests for a book's savings goals:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  bookSavings,
  normalizeGoals,
  normalizePayday,
  paydaysBefore,
  savingsPlan,
  suggestPayday,
} from '../app/lib/utils/savings-goals.ts'

const goal = (id, amount, due, overrides = {}) => ({
  id,
  name: id,
  amount,
  due,
  done: false,
  spent: null,
  ...overrides,
})

const income = (date, amount, overrides = {}) => ({
  date,
  type: 'income',
  category: 'income',
  description: 'Salary',
  quantity: 1,
  amount,
  rate: 1,
  ...overrides,
})

describe('paydays before a due month', () => {
  test('count from today to the end of the month before', () => {
    // 25 Oct is past; 25 Nov and 25 Dec count; January is the due month.
    assert.equal(paydaysBefore('2026-10-27', 25, '2027-01'), 2)
  })

  test('today counts when it is payday', () => {
    assert.equal(paydaysBefore('2026-10-25', 25, '2026-11'), 1)
  })

  test('none for a goal due this month or earlier', () => {
    assert.equal(paydaysBefore('2026-10-01', 1, '2026-10'), 0)
    assert.equal(paydaysBefore('2026-10-01', 1, '2026-08'), 0)
  })

  test("a payday past the month's end falls on its last day", () => {
    // 30 Nov, 31 Dec, 31 Jan, 28 Feb, all before March.
    assert.equal(paydaysBefore('2026-11-30', 31, '2027-03'), 4)
  })
})

describe('savings plan', () => {
  test('group by due month with a running total and shortfall', () => {
    const plan = savingsPlan({
      goals: [
        goal('laptop', 900, '2027-01'),
        goal('school', 300, '2026-12'),
        goal('shoes', 100, '2027-01'),
      ],
      savings: 200,
      payday: 25,
      today: '2026-10-27',
    })
    assert.deepEqual(
      plan.months.map(({ due, total, cumulative, shortfall, paydays }) => ({
        due,
        total,
        cumulative,
        shortfall,
        paydays,
      })),
      [
        {
          due: '2026-12',
          total: 300,
          cumulative: 300,
          shortfall: 100,
          paydays: 1,
        },
        {
          due: '2027-01',
          total: 1000,
          cumulative: 1300,
          shortfall: 1100,
          paydays: 2,
        },
      ],
    )
    assert.equal(plan.total, 1300)
  })

  test('save the highest amount any due month needs per payday', () => {
    const plan = savingsPlan({
      goals: [goal('a', 600, '2026-12'), goal('b', 300, '2027-04')],
      savings: 0,
      payday: 1,
      today: '2026-10-15',
    })
    // December: 1 Nov only → 600. April: 5 paydays for 900 → 180.
    assert.deepEqual(
      plan.months.map(({ perPayday }) => perPayday),
      [600, 180],
    )
    assert.equal(plan.monthly, 600)
    assert.equal(plan.neededNow, 0)
  })

  test("what is short this month can't wait for a payday", () => {
    const plan = savingsPlan({
      goals: [goal('rent', 500, '2026-10'), goal('trip', 400, '2026-12')],
      savings: 100,
      payday: 25,
      today: '2026-10-27',
    })
    assert.equal(plan.neededNow, 400)
    assert.equal(plan.months[1].perPayday, 800)
  })

  test('round amounts to save up to the smallest unit', () => {
    const plan = savingsPlan({
      // 1 Nov, 1 Dec and 1 Jan: 100 / 3.
      goals: [goal('a', 100, '2027-02')],
      savings: 0,
      payday: 1,
      today: '2026-10-15',
      fractionDigits: 2,
    })
    assert.equal(plan.monthly, 33.34)
  })

  test('without a payday, shortfalls only', () => {
    const plan = savingsPlan({
      goals: [goal('a', 100, '2027-01')],
      savings: 30,
      payday: null,
      today: '2026-10-15',
    })
    assert.equal(plan.months[0].shortfall, 70)
    assert.equal(plan.months[0].paydays, undefined)
    assert.equal(plan.monthly, 0)
  })

  test('done goals and goals without an amount leave the plan', () => {
    const plan = savingsPlan({
      goals: [
        goal('done', 500, '2026-12', { done: true, spent: '450' }),
        goal('empty', null, '2026-12'),
        goal('a', 100, '2027-01'),
      ],
      savings: 0,
      payday: 1,
      today: '2026-10-15',
    })
    assert.deepEqual(
      plan.months.map(({ goals }) => goals.map(({ id }) => id)),
      [['a']],
    )
    assert.deepEqual(
      plan.done.map(({ id, spent }) => [id, spent]),
      [['done', 450]],
    )
  })
})

describe("a book's savings", () => {
  test('its accounts when they have a balance', () => {
    assert.deepEqual(bookSavings([{ balance: 300 }, { balance: null }], 50), {
      amount: 300,
      from: 'accounts',
    })
  })

  test('its balance otherwise, never below 0', () => {
    assert.deepEqual(bookSavings([{ balance: null }], 50), {
      amount: 50,
      from: 'balance',
    })
    assert.equal(bookSavings([], -20).amount, 0)
  })
})

describe('suggesting a payday', () => {
  test('the day the largest regular income arrives most often', () => {
    const suggestion = suggestPayday([
      income('2026-08-25', 5000),
      income('2026-09-25', 5000),
      income('2026-10-24', 5000),
      income('2026-09-10', 9000, { description: 'Bonus' }),
      income('2026-10-01', 800, { description: 'Side job' }),
      income('2026-09-01', 800, { description: 'side job ' }),
    ])
    assert.deepEqual(suggestion, {
      day: 25,
      category: 'income',
      description: 'Salary',
    })
  })

  test('nothing without an income in two months', () => {
    assert.equal(
      suggestPayday([income('2026-10-25', 5000), income('2026-10-26', 10)]),
      undefined,
    )
  })
})

describe('normalizing', () => {
  test('typed amounts become numbers; spent only once done', () => {
    assert.deepEqual(
      normalizeGoals([
        goal('a', '1500', '2027-01', { spent: '9' }),
        goal('b', '', '2027-01', { done: true, spent: '' }),
      ]).map(({ amount, spent }) => [amount, spent]),
      [
        [1500, null],
        [null, null],
      ],
    )
  })

  test('a payday is a day of the month', () => {
    assert.equal(normalizePayday('25'), 25)
    assert.equal(normalizePayday(0), null)
    assert.equal(normalizePayday(32), null)
    assert.equal(normalizePayday(''), null)
    assert.equal(normalizePayday(null), null)
  })
})
