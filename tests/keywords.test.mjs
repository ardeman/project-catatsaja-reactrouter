// Tests for a book's keywords:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { keywordTotals, normalizeKeywords } from '../app/lib/utils/keywords.ts'

const entry = (description, amount, overrides = {}) => ({
  type: 'expense',
  description,
  quantity: 1,
  amount,
  rate: 1,
  ...overrides,
})

describe('keyword totals', () => {
  test('add up the entries of the type whose description has the keyword', () => {
    const entries = [
      entry('Bensin Pertalite', 100),
      entry('bensin', 50, { quantity: 2 }),
      entry('Kopi susu', 25, { rate: 2 }),
      entry('Bensin refund', 999, { type: 'income' }),
      entry('Parkir', 250),
    ]
    assert.deepEqual(
      keywordTotals(entries, 'expense', [
        { id: 'fuel', text: 'BENSIN' },
        { id: 'coffee', text: 'kopi' },
        { id: 'none', text: 'pulsa' },
      ]),
      [
        { id: 'fuel', text: 'BENSIN', count: 2, total: 200, share: 0.4 },
        { id: 'coffee', text: 'kopi', count: 1, total: 50, share: 0.1 },
      ],
    )
  })

  test('count an entry once when it has several of the alternatives', () => {
    const entries = [
      entry('Grab ke kantor', 30),
      entry('Gojek', 20),
      entry('grab gojek promo', 10),
    ]
    const [row] = keywordTotals(entries, 'expense', [
      { id: 'ride', text: 'grab, gojek' },
    ])
    assert.equal(row.count, 3)
    assert.equal(row.total, 60)
  })

  test('let keywords overlap', () => {
    const entries = [entry('Kopi susu', 40), entry('Susu UHT', 60)]
    const rows = keywordTotals(entries, 'expense', [
      { id: 'milk', text: 'susu' },
      { id: 'coffee', text: 'kopi' },
    ])
    assert.deepEqual(
      rows.map((row) => [row.id, row.total, row.share]),
      [
        ['milk', 100, 1],
        ['coffee', 40, 0.4],
      ],
    )
  })
})

describe('normalizing keywords', () => {
  test('trim them and drop empty and repeated ones', () => {
    assert.deepEqual(
      normalizeKeywords([
        { id: 'a', text: ' Bensin ' },
        { id: 'b', text: '' },
        { id: 'c', text: ' , ' },
        { id: 'd', text: 'bensin' },
        { id: 'e', text: 'Grab,Gojek' },
        { id: 'f', text: 'grab, gojek' },
      ]),
      [
        { id: 'a', text: 'Bensin' },
        { id: 'e', text: 'Grab,Gojek' },
      ],
    )
  })
})
