// Tests for a book's recurring entries:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  dueDate,
  dueRecurring,
  entryFromRecurring,
  nextDue,
  normalizeRecurring,
  recurringFromEntry,
  upcomingRecurring,
} from '../app/lib/utils/recurring.ts'

const rupiah = { code: 'IDR', symbol: 'Rp', maximumFractionDigits: 0 }

const recurring = (overrides = {}) => ({
  id: 'salary',
  type: 'income',
  category: 'salary',
  description: 'Salary',
  amount: 10_000_000,
  currency: rupiah,
  rate: 1,
  day: 25,
  last: '2026-09',
  ...overrides,
})

describe('due dates', () => {
  test('fall on the last day of a month too short for the day', () => {
    assert.equal(dueDate('2026-11', 31), '2026-11-30')
    assert.equal(dueDate('2027-02', 30), '2027-02-28')
    assert.equal(dueDate('2028-02', 30), '2028-02-29')
    assert.equal(dueDate('2026-10', 5), '2026-10-05')
  })

  test('come in the month after the last one added or skipped', () => {
    assert.equal(nextDue({ day: 25, last: '2026-09' }), '2026-10-25')
    assert.equal(nextDue({ day: 1, last: '2026-12' }), '2027-01-01')
  })
})

describe('due recurring entries', () => {
  test('are due on their day, not before', () => {
    assert.deepEqual(dueRecurring([recurring()], '2026-10-24'), [])
    assert.deepEqual(
      dueRecurring([recurring()], '2026-10-25').map(({ date }) => date),
      ['2026-10-25'],
    )
  })

  test('show the oldest month first when months were missed', () => {
    const due = dueRecurring(
      [recurring({ id: 'rent', day: 1, last: '2026-07' }), recurring()],
      '2026-10-29',
    )
    assert.deepEqual(
      due.map(({ recurring: item, date }) => [item.id, date]),
      [
        ['rent', '2026-08-01'],
        ['salary', '2026-10-25'],
      ],
    )
  })

  test('tell the next one when none is due', () => {
    const next = upcomingRecurring(
      [
        recurring({ last: '2026-10' }),
        recurring({ id: 'rent', day: 1, last: '2026-10' }),
        recurring({ id: 'due' }),
      ],
      '2026-10-26',
    )
    assert.deepEqual([next?.recurring.id, next?.date], ['rent', '2026-11-01'])
  })
})

describe('making and adding recurring entries', () => {
  test('an entry repeats on its day, its own month counted as added', () => {
    const made = recurringFromEntry(
      {
        id: 'entry',
        date: '2026-10-25',
        type: 'expense',
        category: 'bills',
        description: 'Internet',
        quantity: 2,
        amount: 150_000,
        currency: rupiah,
        rate: 1,
      },
      'internet',
    )
    assert.deepEqual(made, {
      id: 'internet',
      type: 'expense',
      category: 'bills',
      description: 'Internet',
      amount: 300_000,
      currency: rupiah,
      rate: 1,
      day: 25,
      last: '2026-10',
    })
    assert.equal(nextDue(made), '2026-11-25')
  })

  test('a confirmed one adds an entry on the day it was due', () => {
    assert.deepEqual(
      entryFromRecurring(
        recurring({ amount: '9500000' }),
        '2026-10-25',
        'added',
      ),
      {
        id: 'added',
        date: '2026-10-25',
        type: 'income',
        category: 'salary',
        description: 'Salary',
        quantity: 1,
        amount: 9_500_000,
        currency: rupiah,
        rate: 1,
      },
    )
  })

  test('typed amounts become numbers and days stay in a month', () => {
    const [typed, empty, late] = normalizeRecurring([
      recurring({ amount: '1500000', day: '7' }),
      recurring({ amount: '', day: 0 }),
      recurring({ amount: null, day: 40 }),
    ])
    assert.deepEqual([typed.amount, typed.day], [1_500_000, 7])
    assert.deepEqual([empty.amount, empty.day], [null, 1])
    assert.deepEqual([late.amount, late.day], [null, 31])
  })
})
