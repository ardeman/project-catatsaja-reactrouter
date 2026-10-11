// Tests for turning a receipt read by Gemini into finance entries:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  receiptDate,
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
    { description: 'Indomie Goreng', quantity: 5, unitPrice: 3500 },
    { description: 'Aqua 600ml', quantity: 1, unitPrice: 4000 },
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
  test('keeps a real past date', () => {
    assert.equal(receiptDate('2026-10-01', '2026-10-11'), '2026-10-01')
  })

  test('uses today for a missing, impossible or future date', () => {
    assert.equal(receiptDate('', '2026-10-11'), '2026-10-11')
    assert.equal(receiptDate('10/01/2026', '2026-10-11'), '2026-10-11')
    assert.equal(receiptDate('2026-02-30', '2026-10-11'), '2026-10-11')
    assert.equal(receiptDate('2027-01-01', '2026-10-11'), '2026-10-11')
  })
})

describe('receipt lines', () => {
  test('lists items, then charges, leaving out lines without a price', () => {
    const lines = receiptLines(
      receipt({
        items: [
          { description: 'Nasi goreng', quantity: 2, unitPrice: 25_000 },
          { description: 'Free sambal', quantity: 1, unitPrice: 0 },
        ],
        charges: [
          { description: 'PB1 10%', amount: 5000 },
          { description: 'Service', amount: 0 },
        ],
      }),
      0,
    )
    assert.deepEqual(lines, [
      { description: 'Nasi goreng', quantity: 2, amount: 25_000 },
      { description: 'PB1 10%', quantity: 1, amount: 5000 },
    ])
  })

  test('spreads a discount on the whole bill over the items by price', () => {
    const lines = receiptLines(
      receipt({
        items: [
          { description: 'Shirt', quantity: 1, unitPrice: 30 },
          { description: 'Socks', quantity: 2, unitPrice: 5 },
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

  test('treats a missing quantity as one', () => {
    const [line] = receiptLines(
      receipt({
        items: [{ description: 'Kopi', quantity: 0, unitPrice: 18_000 }],
      }),
      0,
    )
    assert.equal(line.quantity, 1)
  })

  test('rounds to the currency’s decimals', () => {
    const [line] = receiptLines(
      receipt({
        items: [{ description: 'Gas', quantity: 1, unitPrice: 12.345 }],
      }),
      2,
    )
    assert.equal(line.amount, 12.35)
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
          { description: 'Indomie', quantity: 5, unitPrice: 3500 },
          { description: 'Aqua', quantity: 1, unitPrice: 4000 },
          { description: 'Susu UHT', quantity: 2, unitPrice: 19_900 },
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
        { description: 'Indomie', quantity: 5, unitPrice: 3500 },
        { description: 'Aqua', quantity: 1, unitPrice: 4000 },
        { description: 'Susu UHT', quantity: 2, unitPrice: 19_900 },
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
