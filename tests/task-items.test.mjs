// Tests for subtasks in a task list:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  canIndentItem,
  getSections,
  getSiblings,
  indentItem,
  moveItem,
  outdentItem,
  settleItems,
  toggleItem,
} from '../app/lib/utils/task-items.ts'

// "o A" is open, "x A" done; a leading "- " makes it a subtask.
const list = (...lines) =>
  lines.map((line) => {
    const [, dash, mark, item] = line.match(/^(- )?([ox]) (.+)$/)
    return dash
      ? { checked: mark === 'x', item, level: 1 }
      : { checked: mark === 'x', item }
  })
const show = (arrangement) =>
  arrangement.content.map(
    ({ checked, item, level }) =>
      `${level ? '- ' : ''}${checked ? 'x' : 'o'} ${item}`,
  )

describe('task items', () => {
  test('a subtask follows its item into its section', () => {
    const content = list('x Done', 'o Pack', '- x Tent', '- o Stove')
    assert.deepEqual(getSections(content), { open: [1, 2, 3], done: [0] })
  })

  test('a first item marked as a subtask is an item', () => {
    const content = list('- o Pack', '- o Tent')
    assert.deepEqual(getSiblings(content, 0), [0])
    assert.deepEqual(getSiblings(content, 1), [1])
  })

  test('indenting joins the item above in the same section', () => {
    const content = list('o Pack', 'x Done', 'o Tent')
    assert.equal(canIndentItem(content, 0), false)
    assert.equal(canIndentItem(content, 1), false)
    const arrangement = indentItem(content, 2)
    assert.deepEqual(show(arrangement), ['o Pack', '- o Tent', 'x Done'])
    assert.deepEqual(arrangement.order, [0, 2, 1])
  })

  test('an item with subtasks is not indented', () => {
    const content = list('o Trip', 'o Pack', '- o Tent')
    assert.equal(canIndentItem(content, 1), false)
    assert.equal(indentItem(content, 1), undefined)
  })

  test('checking an item checks its subtasks and moves them along', () => {
    const content = list('o Pack', '- o Tent', 'o Cook', 'x Done')
    assert.deepEqual(show(toggleItem(content, 0, true)), [
      'o Cook',
      'x Pack',
      '- x Tent',
      'x Done',
    ])
  })

  test('the item is checked when its last subtask is', () => {
    const content = list('o Pack', '- x Tent', '- o Stove', 'o Cook', 'x Done')
    assert.deepEqual(show(toggleItem(content, 2, true)), [
      'o Cook',
      'x Pack',
      '- x Tent',
      '- x Stove',
      'x Done',
    ])
  })

  test('unchecking a subtask reopens its item only', () => {
    const content = list('o Cook', 'x Pack', '- x Tent', '- x Stove')
    assert.deepEqual(show(toggleItem(content, 3, false)), [
      'o Cook',
      'o Pack',
      '- x Tent',
      '- o Stove',
    ])
  })

  test('with no other section to join, the block stays in place', () => {
    const content = list('o Rice', 'o Fruit')
    assert.deepEqual(toggleItem(content, 0, true).order, [0, 1])
  })

  test('outdenting puts a subtask after its block', () => {
    const content = list('o Pack', '- o Tent', '- o Stove', 'o Cook')
    assert.deepEqual(show(outdentItem(content, 1)), [
      'o Pack',
      '- o Stove',
      'o Tent',
      'o Cook',
    ])
    assert.equal(outdentItem(content, 0), undefined)
  })

  test('outdenting the last open subtask checks its item', () => {
    const content = list('o Pack', '- x Tent', '- o Stove')
    assert.deepEqual(show(outdentItem(content, 2)), [
      'x Pack',
      '- x Tent',
      'o Stove',
    ])
  })

  test('items move with their subtasks, subtasks among siblings', () => {
    const content = list('o Pack', '- o Tent', 'o Cook', '- o Rice')
    assert.deepEqual(getSiblings(content, 0), [0, 2])
    assert.deepEqual(show(moveItem(content, 0, 2)), [
      'o Cook',
      '- o Rice',
      'o Pack',
      '- o Tent',
    ])
    const subtasks = list('o Pack', '- o Tent', '- o Stove')
    assert.deepEqual(getSiblings(subtasks, 2), [1, 2])
    assert.deepEqual(show(moveItem(subtasks, 2, 1)), [
      'o Pack',
      '- o Stove',
      '- o Tent',
    ])
    assert.equal(moveItem(subtasks, 2, 0), undefined)
  })

  test('settling after a removal brings items in line with subtasks', () => {
    const content = list('o Pack', '- x Tent')
    assert.deepEqual(show(settleItems(content)), ['x Pack', '- x Tent'])
  })
})
