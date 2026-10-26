// Tests for bringing changes saved elsewhere into an open detail form:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  isSameJson,
  mergeById,
  mergeValue,
} from '../app/lib/utils/merge-stored.ts'

const entry = (id, amount = 1) => ({ id, amount })

describe('comparing', () => {
  test('ignores the order of keys, as Firestore returns them', () => {
    assert.ok(
      isSameJson(
        { code: 'IDR', symbol: 'Rp', maximumFractionDigits: 0 },
        { maximumFractionDigits: 0, symbol: 'Rp', code: 'IDR' },
      ),
    )
    assert.ok(
      isSameJson(
        [{ id: 'a', n: { x: 1, y: 2 } }],
        [{ n: { y: 2, x: 1 }, id: 'a' }],
      ),
    )
  })

  test('still sees a changed value or order of items', () => {
    assert.ok(!isSameJson({ code: 'IDR' }, { code: 'USD' }))
    assert.ok(!isSameJson([entry('a'), entry('b')], [entry('b'), entry('a')]))
  })
})

describe('one value', () => {
  test('takes the stored value when nothing changed here', () => {
    assert.equal(mergeValue('a', 'a', 'b'), 'b')
  })

  test('keeps a change made here', () => {
    assert.equal(mergeValue('a', 'mine', 'b'), 'mine')
  })

  test('takes the stored value once a change made here was saved', () => {
    // Saved "mine", then another device saved "theirs".
    assert.equal(mergeValue('mine', 'mine', 'theirs'), 'theirs')
  })
})

describe('a list merged by id', () => {
  test('an entry deleted on another device stays deleted', () => {
    // This device added X and saved it; another device then deleted it.
    const base = [entry('a'), entry('x')]
    const local = [entry('a'), entry('x')]
    const remote = [entry('a')]
    assert.deepEqual(mergeById(base, local, remote), [entry('a')])
  })

  test('an entry deleted here stays deleted', () => {
    const base = [entry('a'), entry('b')]
    const local = [entry('a')]
    assert.deepEqual(mergeById(base, local, base), [entry('a')])
  })

  test('entries added here and elsewhere are both kept', () => {
    const base = [entry('a')]
    const local = [entry('a'), entry('mine')]
    const remote = [entry('a'), entry('theirs')]
    assert.deepEqual(mergeById(base, local, remote), [
      entry('a'),
      entry('theirs'),
      entry('mine'),
    ])
  })

  test('a change made here wins over the stored entry', () => {
    const base = [entry('a', 1), entry('b', 1)]
    const local = [entry('a', 2), entry('b', 1)]
    const remote = [entry('a', 3), entry('b', 5)]
    assert.deepEqual(mergeById(base, local, remote), [
      entry('a', 2),
      entry('b', 5),
    ])
  })

  test('keeps an entry changed here that was deleted elsewhere', () => {
    const base = [entry('a', 1), entry('b', 1)]
    const local = [entry('a', 2), entry('b', 1)]
    const remote = [entry('b', 1)]
    assert.deepEqual(mergeById(base, local, remote), [
      entry('b', 1),
      entry('a', 2),
    ])
  })

  test('treats a missing list as empty', () => {
    assert.deepEqual(mergeById(undefined, [entry('a')], undefined), [
      entry('a'),
    ])
  })
})
