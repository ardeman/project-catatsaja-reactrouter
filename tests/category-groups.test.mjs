// Tests for a book's own groups of categories:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  assignCategory,
  groupTotals,
  normalizeGroups,
} from '../app/lib/utils/category-groups.ts'

const entry = (category, amount, overrides = {}) => ({
  type: 'expense',
  category,
  quantity: 1,
  amount,
  rate: 1,
  ...overrides,
})

const needs = { id: 'needs', name: 'Needs', categories: ['fnb', 'bills'] }
const wants = { id: 'wants', name: 'Wants', categories: ['shopping'] }

const entries = [
  entry('fnb', 3000),
  entry('bills', 1500),
  entry('transport', 1000),
  entry('shopping', 250, { quantity: 2 }),
  entry('income', 9000, { type: 'income' }),
]

describe('group totals', () => {
  test('add up each group, largest first, with the rest at the end', () => {
    assert.deepEqual(groupTotals(entries, 'expense', [wants, needs]), [
      { id: 'needs', name: 'Needs', total: 4500, share: 0.75 },
      { id: 'wants', name: 'Wants', total: 500, share: 500 / 6000 },
      { id: 'ungrouped', name: '', total: 1000, share: 1000 / 6000 },
    ])
  })

  test('shares add up to the whole', () => {
    const rows = groupTotals(entries, 'expense', [needs, wants])
    const total = rows.reduce((sum, row) => sum + row.share, 0)
    assert.ok(Math.abs(total - 1) < 1e-9)
  })

  test('count the rate into the book currency', () => {
    const rows = groupTotals([entry('fnb', 10, { rate: 15_000 })], 'expense', [
      needs,
    ])
    assert.deepEqual(rows, [
      { id: 'needs', name: 'Needs', total: 150_000, share: 1 },
    ])
  })

  test('leave out groups with nothing, and show none when no group has any', () => {
    assert.deepEqual(
      groupTotals([entry('fnb', 100), entry('transport', 100)], 'expense', [
        needs,
        wants,
      ]).map((row) => row.id),
      ['needs', 'ungrouped'],
    )
    assert.deepEqual(groupTotals(entries, 'income', [needs, wants]), [])
    assert.deepEqual(groupTotals(entries, 'expense', []), [])
  })

  test('count a category in two groups only once, in the first', () => {
    const twice = { id: 'twice', name: 'Twice', categories: ['fnb'] }
    const rows = groupTotals([entry('fnb', 100)], 'expense', [needs, twice])
    assert.deepEqual(rows, [
      { id: 'needs', name: 'Needs', total: 100, share: 1 },
    ])
  })
})

describe('editing groups', () => {
  test('a category moves to the group it is put in', () => {
    const groups = assignCategory([needs, wants], 'wants', 'fnb')
    assert.deepEqual(groups[0].categories, ['bills'])
    assert.deepEqual(groups[1].categories, ['shopping', 'fnb'])
  })

  test('a category put in no group leaves the one it was in', () => {
    const groups = assignCategory([needs, wants], undefined, 'fnb')
    assert.deepEqual(groups[0].categories, ['bills'])
    assert.deepEqual(groups[1].categories, ['shopping'])
  })

  test('normalizing trims names and keeps each category in one group', () => {
    assert.deepEqual(
      normalizeGroups([
        { id: 'a', name: ' Needs ', categories: ['fnb', 'bills'] },
        { id: 'b', name: 'Wants', categories: ['fnb', 'shopping'] },
      ]),
      [
        { id: 'a', name: 'Needs', categories: ['fnb', 'bills'] },
        { id: 'b', name: 'Wants', categories: ['shopping'] },
      ],
    )
  })
})
