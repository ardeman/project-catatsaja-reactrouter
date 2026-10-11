// Tests for turning a receipt read by Gemini into finance entries:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  receiptDate,
  receiptDiscount,
  receiptLines,
  receiptMismatch,
  receiptToEntries,
  receiptTotal,
} from '../app/lib/utils/receipt.ts'

const idr = { code: 'IDR', symbol: 'Rp', maximumFractionDigits: 0 }
const usd = { code: 'USD', symbol: '$', maximumFractionDigits: 2 }

const receipt = (overrides = {}) => ({
  merchant: 'Indomaret',
  date: '2026-10-10',
  currency: 'IDR',
  items: [
    {
      description: 'Indomie Goreng',
      quantity: 5,
      unitPrice: 3500,
      discount: 0,
    },
    { description: 'Aqua 600ml', quantity: 1, unitPrice: 4000, discount: 0 },
  ],
  charges: [],
  discount: 0,
  total: 21_500,
  ...overrides,
})

const entriesFor = (read, mode, options = {}) => {
  let id = 0
  return receiptToEntries({
    receipt: read,
    mode,
    date: '2026-10-10',
    currency: idr,
    rate: 1,
    categoryFor: (description) =>
      ({ Indomaret: 'groceries', 'Indomie Goreng': 'fnb' })[description],
    fallbackCategory: 'otherExpenses',
    newId: () => `entry-${++id}`,
    ...options,
  })
}

describe('receipt dates', () => {
  const today = '2026-10-12'

  test('keeps a recent past date', () => {
    assert.deepEqual(receiptDate('2026-10-01', today), { date: '2026-10-01' })
    assert.deepEqual(receiptDate(today, today), { date: today })
  })

  test('uses today for a missing date, and says so', () => {
    assert.deepEqual(receiptDate('', today), { date: today, issue: 'missing' })
  })

  test('uses today for a date that isn’t a real day', () => {
    for (const read of ['10/01/2026', '2026-02-30', '2026-13-01'])
      assert.deepEqual(receiptDate(read, today), {
        date: today,
        issue: 'unreadable',
      })
  })

  test('swaps day and month back when that makes a future date past', () => {
    // 11/10/2026 (11 October) read month first as 10 November.
    assert.deepEqual(receiptDate('2026-11-10', today), {
      date: '2026-10-11',
      issue: 'swapped',
    })
  })

  test('uses today for a future date that swapping doesn’t fix', () => {
    assert.deepEqual(receiptDate('2026-12-25', today), {
      date: today,
      issue: 'future',
    })
    assert.deepEqual(receiptDate('2027-01-05', today), {
      date: today,
      issue: 'future',
    })
  })

  test('keeps an old date, flagged to check', () => {
    assert.deepEqual(receiptDate('2026-08-17', today), {
      date: '2026-08-17',
      issue: 'old',
    })
    assert.deepEqual(receiptDate('2026-09-11', today), { date: '2026-09-11' })
  })
})

describe('receipt lines', () => {
  test('lists items, then charges, leaving out lines without a price', () => {
    const lines = receiptLines(
      receipt({
        items: [
          {
            description: 'Nasi goreng',
            quantity: 2,
            unitPrice: 25_000,
            discount: 0,
          },
          {
            description: 'Free sambal',
            quantity: 1,
            unitPrice: 0,
            discount: 0,
          },
        ],
        charges: [
          { description: 'PB1 10%', amount: 5000 },
          { description: 'Service', amount: 0 },
        ],
      }),
      0,
    )
    assert.deepEqual(lines, [
      { description: 'Nasi goreng', quantity: 2, amount: 25_000, discount: 0 },
      { description: 'PB1 10%', quantity: 1, amount: 5000, discount: 0 },
    ])
  })

  test('spreads a discount on the whole bill over the items by price', () => {
    const lines = receiptLines(
      receipt({
        items: [
          { description: 'Shirt', quantity: 1, unitPrice: 30, discount: 0 },
          { description: 'Socks', quantity: 2, unitPrice: 5, discount: 0 },
        ],
        discount: 4,
        total: 36,
      }),
      2,
    )
    assert.deepEqual(
      lines.map((line) => line.amount),
      [27, 4.5],
    )
  })

  test('takes a line’s own discount off that line only', () => {
    // As printed by Indomaret: "HEMAT SUSU -4.000" under the milk.
    const lines = receiptLines(
      receipt({
        items: [
          { description: 'Indomie', quantity: 5, unitPrice: 3500, discount: 0 },
          { description: 'Aqua', quantity: 1, unitPrice: 4000, discount: 0 },
          {
            description: 'Susu UHT',
            quantity: 2,
            unitPrice: 19_900,
            discount: 4000,
          },
        ],
        total: 57_300,
      }),
      0,
    )
    assert.deepEqual(
      lines.map((line) => [line.quantity, line.amount, line.discount]),
      [
        [5, 3500, 0],
        [1, 4000, 0],
        [2, 17_900, 4000],
      ],
    )
  })

  test('applies line discounts before spreading one on the whole bill', () => {
    const lines = receiptLines(
      receipt({
        items: [
          { description: 'Shirt', quantity: 1, unitPrice: 40, discount: 10 },
          { description: 'Socks', quantity: 2, unitPrice: 5, discount: 0 },
        ],
        discount: 4,
        total: 36,
      }),
      2,
    )
    // 30 and 10 after the shirt's own discount; the bill's 4 is 10% of 40.
    assert.deepEqual(
      lines.map((line) => [line.amount, line.discount]),
      [
        [27, 13],
        [4.5, 1],
      ],
    )
  })

  test('a line discount can’t make a line cost less than nothing', () => {
    const lines = receiptLines(
      receipt({
        items: [
          {
            description: 'Free gift',
            quantity: 1,
            unitPrice: 5000,
            discount: 9000,
          },
          { description: 'Kopi', quantity: 1, unitPrice: 18_000, discount: 0 },
        ],
      }),
      0,
    )
    assert.deepEqual(
      lines.map((line) => line.description),
      ['Kopi'],
    )
  })

  test('treats a missing quantity as one', () => {
    const [line] = receiptLines(
      receipt({
        items: [
          { description: 'Kopi', quantity: 0, unitPrice: 18_000, discount: 0 },
        ],
      }),
      0,
    )
    assert.equal(line.quantity, 1)
  })

  test('rounds to the currency’s decimals', () => {
    const [line] = receiptLines(
      receipt({
        items: [
          { description: 'Gas', quantity: 1, unitPrice: 12.345, discount: 0 },
        ],
      }),
      2,
    )
    assert.equal(line.amount, 12.35)
  })
})

describe('receipt discount', () => {
  test('adds up the lines’ discounts and the bill’s', () => {
    const read = receipt({
      items: [
        { description: 'Susu', quantity: 2, unitPrice: 19_900, discount: 4000 },
        { description: 'Roti', quantity: 1, unitPrice: 15_000, discount: 1500 },
      ],
      discount: 2000,
    })
    assert.equal(receiptDiscount(read, 0), 7500)
  })
})

describe('receipt total', () => {
  test('is the printed total', () => {
    assert.equal(receiptTotal(receipt(), 0), 21_500)
  })

  test('adds up the lines when the total couldn’t be read', () => {
    assert.equal(receiptTotal(receipt({ total: 0 }), 0), 21_500)
  })
})

describe('lines against the total', () => {
  test('rounding a spread discount still adds up to the total', () => {
    const lines = receiptLines(
      receipt({
        items: [
          { description: 'Indomie', quantity: 5, unitPrice: 3500, discount: 0 },
          { description: 'Aqua', quantity: 1, unitPrice: 4000, discount: 0 },
          {
            description: 'Susu UHT',
            quantity: 2,
            unitPrice: 19_900,
            discount: 0,
          },
        ],
        discount: 4000,
        total: 57_300,
      }),
      0,
    )
    assert.deepEqual(
      lines.map((line) => [line.quantity, line.amount]),
      [
        [5, 3272],
        [1, 3738],
        [2, 18_601],
      ],
    )
  })

  test('rounding a spread discount is no mismatch', () => {
    // As Gemini read a real-looking receipt: the line discount on the milk
    // came back as a discount on the whole bill.
    const read = receipt({
      items: [
        { description: 'Indomie', quantity: 5, unitPrice: 3500, discount: 0 },
        { description: 'Aqua', quantity: 1, unitPrice: 4000, discount: 0 },
        {
          description: 'Susu UHT',
          quantity: 2,
          unitPrice: 19_900,
          discount: 0,
        },
      ],
      discount: 4000,
      total: 57_300,
    })
    const { lines, isMismatch } = receiptMismatch(read, 0)
    assert.equal(lines, 57_300)
    assert.equal(isMismatch, false)
  })

  test('a missing line is a mismatch', () => {
    const { lines, isMismatch } = receiptMismatch(receipt({ total: 30_000 }), 0)
    assert.equal(lines, 21_500)
    assert.equal(isMismatch, true)
  })
})

describe('entries from a receipt', () => {
  test('one entry for the total, named and filed by the shop', () => {
    const entries = entriesFor(receipt(), 'total')
    assert.equal(entries.length, 1)
    assert.deepEqual(entries[0], {
      id: 'entry-1',
      date: '2026-10-10',
      type: 'expense',
      category: 'groceries',
      description: 'Indomaret',
      quantity: 1,
      amount: 21_500,
      currency: idr,
      rate: 1,
    })
  })

  test('one entry per item, filed by the item, else by the shop', () => {
    const entries = entriesFor(receipt(), 'items')
    assert.deepEqual(
      entries.map(({ description, quantity, amount, category }) => ({
        description,
        quantity,
        amount,
        category,
      })),
      [
        {
          description: 'Indomie Goreng',
          quantity: 5,
          amount: 3500,
          category: 'fnb',
        },
        {
          description: 'Aqua 600ml',
          quantity: 1,
          amount: 4000,
          category: 'groceries',
        },
      ],
    )
  })

  test('uses the fallback category for an unknown shop', () => {
    const [entry] = entriesFor(receipt({ merchant: 'Toko Baru' }), 'total')
    assert.equal(entry.category, 'otherExpenses')
  })

  test('keeps the currency and rate it is given', () => {
    const [entry] = entriesFor(receipt({ total: 12.5 }), 'total', {
      currency: usd,
      rate: 16_250,
    })
    assert.equal(entry.amount, 12.5)
    assert.deepEqual(entry.currency, usd)
    assert.equal(entry.rate, 16_250)
  })

  test('adds nothing for a receipt without amounts', () => {
    const empty = receipt({ items: [], total: 0 })
    assert.deepEqual(entriesFor(empty, 'total'), [])
    assert.deepEqual(entriesFor(empty, 'items'), [])
  })
})
