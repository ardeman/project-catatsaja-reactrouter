// Tests for copying a book's analysis setup into another book:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { copySetup, setupSize } from '../app/lib/utils/copy-analysis.ts'

const options = (overrides = {}) => {
  let next = 0
  return {
    rate: 1,
    fractionDigits: 0,
    newId: () => `new-${++next}`,
    ...overrides,
  }
}

const goal = (name, amount, overrides = {}) => ({
  id: name,
  name,
  amount,
  due: '2026-12',
  done: false,
  spent: null,
  ...overrides,
})

describe('copying an analysis setup', () => {
  test('copies everything into an empty book, with new ids', () => {
    const result = copySetup(
      {},
      {
        categoryGroups: [{ id: 'g', name: 'Needs', categories: ['food'] }],
        budgets: [{ id: 'b', category: 'food', limit: 100 }],
        keywords: [{ id: 'k', text: ' bensin ' }],
        goals: [goal('Laptop', 500)],
        payday: 25,
      },
      options(),
    )
    assert.deepEqual(result, {
      categoryGroups: [{ id: 'new-1', name: 'Needs', categories: ['food'] }],
      budgets: [{ id: 'new-2', category: 'food', limit: 100 }],
      keywords: [{ id: 'new-3', text: 'bensin' }],
      goals: [goal('Laptop', 500, { id: 'new-4' })],
      payday: 25,
      added: 5,
    })
  })

  test('keeps what the book has and adds only what it lacks', () => {
    const result = copySetup(
      {
        categoryGroups: [{ id: 'mine', name: 'needs', categories: ['food'] }],
        budgets: [{ id: 'b1', category: 'food', limit: 50 }],
        keywords: [{ id: 'k1', text: 'Grab' }],
        goals: [goal('laptop', 300)],
        payday: 1,
      },
      {
        categoryGroups: [
          { id: 'g1', name: 'Needs', categories: ['food', 'bills'] },
          { id: 'g2', name: 'Wants', categories: ['food'] },
          { id: 'g3', name: 'Fun', categories: ['games'] },
        ],
        budgets: [
          { id: 'b2', category: 'food', limit: 100 },
          { id: 'b3', category: 'bills', limit: 200 },
        ],
        keywords: [
          { id: 'k2', text: 'grab ' },
          { id: 'k3', text: '' },
          { id: 'k4', text: 'gojek' },
        ],
        goals: [
          goal('Laptop', 500),
          goal('Phone', 200),
          goal('Bike', 100, { done: true, spent: 90 }),
        ],
        payday: 25,
      },
      options(),
    )
    assert.deepEqual(result.categoryGroups, [
      { id: 'mine', name: 'needs', categories: ['food', 'bills'] },
      { id: 'new-1', name: 'Fun', categories: ['games'] },
    ])
    assert.deepEqual(result.budgets, [
      { id: 'b1', category: 'food', limit: 50 },
      { id: 'new-2', category: 'bills', limit: 200 },
    ])
    assert.deepEqual(
      result.keywords.map((keyword) => keyword.text),
      ['Grab', 'gojek'],
    )
    assert.deepEqual(
      result.goals.map((item) => item.name),
      ['laptop', 'Phone'],
    )
    assert.equal(result.payday, 1)
    assert.equal(result.added, 5)
  })

  test('does not change the book it copies into', () => {
    const to = { categoryGroups: [{ id: 'g', name: 'A', categories: ['x'] }] }
    copySetup(
      to,
      { categoryGroups: [{ id: 'h', name: 'A', categories: ['y'] }] },
      options(),
    )
    assert.deepEqual(to.categoryGroups[0].categories, ['x'])
  })

  test('converts amounts, rounded to the book currency', () => {
    const result = copySetup(
      {},
      {
        budgets: [{ id: 'b', category: 'food', limit: 12.5 }],
        goals: [goal('Trip', 1000)],
      },
      options({ rate: 16_123.456, fractionDigits: 0 }),
    )
    assert.equal(result.budgets[0].limit, 201_543)
    assert.equal(result.goals[0].amount, 16_123_456)
  })

  test('leaves amounts empty when no rate is known', () => {
    const result = copySetup(
      {},
      {
        budgets: [{ id: 'b', category: 'food', limit: 100 }],
        goals: [goal('Trip', 1000)],
      },
      options({ rate: undefined }),
    )
    assert.equal(result.budgets[0].limit, null)
    assert.equal(result.goals[0].amount, null)
  })

  test('counts what a book has to copy', () => {
    assert.equal(setupSize({}), 0)
    assert.equal(
      setupSize({
        categoryGroups: [
          { id: 'a', name: 'Empty', categories: [] },
          { id: 'b', name: 'Needs', categories: ['food'] },
        ],
        keywords: [{ id: 'k', text: ' ' }],
        goals: [goal('Done', 1, { done: true })],
        payday: 25,
      }),
      2,
    )
  })
})
