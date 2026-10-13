// Tests for grouping a book's entries by the thing they were for:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { itemKey, similarItems } from '../app/lib/utils/similar-items.ts'

const entry = (description, amount, overrides = {}) => ({
  date: '2026-10-01',
  type: 'expense',
  description,
  quantity: 1,
  amount,
  rate: 1,
  ...overrides,
})

describe('the name of an item', () => {
  test('ignores case, accents and punctuation', () => {
    assert.equal(itemKey('  TELUR!! '), 'telur')
    assert.equal(itemKey('Café latte'), 'cafe latte')
    assert.equal(itemKey('Indomie-Goreng'), 'indomie goreng')
  })

  test('drops sizes, counts and amounts', () => {
    assert.equal(itemKey('Telur 1kg'), 'telur')
    assert.equal(itemKey('Aqua 600ml x2'), 'aqua')
    assert.equal(itemKey('Pulsa Telkomsel 50rb'), 'pulsa telkomsel')
    assert.equal(itemKey('Minyak goreng 1,5 l'), 'minyak goreng')
    assert.equal(itemKey('Susu UHT 1.5L'), 'susu uht')
  })

  test('keeps numbers that are part of the name', () => {
    assert.equal(itemKey('Indomaret 24 jam'), 'indomaret 24 jam')
    assert.equal(itemKey('7 Eleven'), '7 eleven')
  })

  test('is empty when nothing names a thing', () => {
    assert.equal(itemKey(''), '')
    assert.equal(itemKey('2x'), '')
  })
})

describe('similar items', () => {
  test('groups spellings and sizes, named by the most used one', () => {
    const [item] = similarItems(
      [
        entry('telur', 27_000),
        entry('Telur 1kg', 28_000, { date: '2026-10-05' }),
        entry('telur', 30_000, { date: '2026-10-09' }),
      ],
      'expense',
    )
    assert.equal(item.name, 'telur')
    assert.equal(item.count, 3)
    assert.equal(item.total, 85_000)
  })

  test('leaves out things bought once, and the other type', () => {
    const items = similarItems(
      [
        entry('kopi', 20_000),
        entry('kopi', 22_000),
        entry('kamera cctv', 762_263),
        entry('kopi', 1_000_000, { type: 'income' }),
        entry('kopi', 1_000_000, { type: 'income' }),
      ],
      'expense',
    )
    assert.deepEqual(
      items.map((item) => [item.name, item.count, item.total]),
      [['kopi', 2, 42_000]],
    )
  })

  test('prices per unit in the book currency, largest total first', () => {
    const items = similarItems(
      [
        entry('yogurt', 10_300),
        entry('yogurt', 10_300),
        entry('onigiri', 150, { quantity: 2, rate: 106, date: '2026-10-02' }),
        entry('onigiri', 180, { quantity: 1, rate: 106, date: '2026-10-08' }),
      ],
      'expense',
    )
    assert.deepEqual(
      items.map((item) => item.name),
      ['onigiri', 'yogurt'],
    )
    const [onigiri, yogurt] = items
    assert.equal(onigiri.quantity, 3)
    assert.equal(onigiri.total, 50_880)
    assert.equal(onigiri.averageUnit, 16_960)
    assert.equal(onigiri.latestUnit, 19_080)
    assert.equal(Math.round(onigiri.change * 1000) / 1000, 0.125)
    assert.equal(yogurt.change, undefined, 'the same price every time')
  })

  test('the latest is by date, not by when it was typed in', () => {
    const [item] = similarItems(
      [
        entry('bensin', 12_000, { date: '2026-10-09' }),
        entry('bensin', 10_000, { date: '2026-10-01' }),
      ],
      'expense',
    )
    assert.equal(item.latestUnit, 12_000)
  })

  test('skips entries without a description', () => {
    assert.deepEqual(
      similarItems([entry('', 5000), entry('', 5000)], 'expense'),
      [],
    )
  })
})
