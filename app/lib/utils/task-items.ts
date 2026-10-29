import type { TTaskItem } from '~/lib/types/task'

// A task list is stored flat: a subtask is an item with `level` 1 under the
// item before it (one level only). An item with its subtasks is a block; a
// block is done when its item is checked, and an item with subtasks is
// checked exactly when all of them are.

export const isSubtask = (content: TTaskItem[], index: number) =>
  index > 0 && content[index].level === 1

// Indexes of each block: the item, then its subtasks.
export const getBlocks = (content: TTaskItem[]) => {
  const blocks: number[][] = []
  for (const index of content.keys()) {
    const last = blocks.at(-1)
    if (last && isSubtask(content, index)) last.push(index)
    else blocks.push([index])
  }
  return blocks
}

// Open blocks first, then the done ones, each in their stored order.
export const getSections = (content: TTaskItem[]) => {
  const blocks = getBlocks(content)
  return {
    open: blocks.filter((block) => !content[block[0]].checked).flat(),
    done: blocks.filter((block) => content[block[0]].checked).flat(),
  }
}

// What a change makes of the list: `order` holds the current indexes in
// their new order, and `content` the items at those places.
export type TArrangement = { order: number[]; content: TTaskItem[] }

type TEntry = { from: number; checked: boolean; item: string }

const toEntryBlocks = (content: TTaskItem[]) =>
  getBlocks(content).map((block) =>
    block.map((from) => ({
      from,
      checked: content[from].checked,
      item: content[from].item,
    })),
  )

const syncParent = (block: TEntry[]) => {
  if (block.length > 1)
    block[0].checked = block.slice(1).every((entry) => entry.checked)
}

// Blocks stay whole; their order otherwise doesn't matter, as open ones
// show before done ones.
const flatten = (blocks: TEntry[][]): TArrangement => {
  const entries = blocks.flatMap((block) =>
    block.map((entry, position) => ({ ...entry, isSubtask: position > 0 })),
  )
  return {
    order: entries.map(({ from }) => from),
    content: entries.map(({ checked, item, isSubtask }) =>
      isSubtask ? { checked, item, level: 1 } : { checked, item },
    ),
  }
}

const findBlock = (blocks: TEntry[][], index: number) =>
  blocks.find((block) => block.some(({ from }) => from === index))

// Checking an item checks its subtasks; checking or unchecking a subtask
// checks its item when all of them are done, or unchecks it. A block that
// becomes done goes to the top of the done ones, a reopened one to the
// bottom of the open ones.
export const toggleItem = (
  content: TTaskItem[],
  index: number,
  isChecked: boolean,
) => {
  const blocks = toEntryBlocks(content)
  const block = findBlock(blocks, index)
  if (!block) return
  const wasDone = block[0].checked
  for (const entry of block)
    if (block[0].from === index || entry.from === index)
      entry.checked = isChecked
  syncParent(block)
  const isDone = block[0].checked
  if (isDone === wasDone) return flatten(blocks)
  const others = blocks.filter((other) => other !== block)
  const target = isDone
    ? others.findIndex((other) => other[0].checked)
    : others.findLastIndex((other) => !other[0].checked) + 1
  if (target < (isDone ? 0 : 1)) return flatten(blocks)
  others.splice(target, 0, block)
  return flatten(others)
}

// The block an item would join as a subtask: the one before it in the same
// section. Only an item without subtasks can become one.
const findIndentTarget = (blocks: TEntry[][], index: number) => {
  const position = blocks.findIndex(
    (block) => block.length === 1 && block[0].from === index,
  )
  if (position === -1) return
  const isDone = blocks[position][0].checked
  const parent = blocks
    .slice(0, position)
    .findLast((block) => block[0].checked === isDone)
  return parent ? { position, parent } : undefined
}

export const canIndentItem = (content: TTaskItem[], index: number) =>
  !!findIndentTarget(toEntryBlocks(content), index)

export const indentItem = (content: TTaskItem[], index: number) => {
  const blocks = toEntryBlocks(content)
  const target = findIndentTarget(blocks, index)
  if (!target) return
  target.parent.push(blocks[target.position][0])
  syncParent(target.parent)
  return flatten(blocks.filter((_, position) => position !== target.position))
}

// A subtask becomes an item of its own, right after its block.
export const outdentItem = (content: TTaskItem[], index: number) => {
  const blocks = toEntryBlocks(content)
  const position = blocks.findIndex((block) =>
    block.slice(1).some(({ from }) => from === index),
  )
  if (position === -1) return
  const block = blocks[position]
  const [entry] = block.splice(
    block.findIndex(({ from }) => from === index),
    1,
  )
  syncParent(block)
  blocks.splice(position + 1, 0, [entry])
  return flatten(blocks)
}

// What an item moves among: the items of its section, or a subtask's
// siblings.
export const getSiblings = (content: TTaskItem[], index: number) => {
  const blocks = getBlocks(content)
  return isSubtask(content, index)
    ? (blocks.find((block) => block.includes(index))?.slice(1) ?? [])
    : blocks
        .filter((block) => content[block[0]].checked === content[index].checked)
        .map((block) => block[0])
}

// Moves an item, with its subtasks, to the place of `target`, a sibling.
export const moveItem = (
  content: TTaskItem[],
  index: number,
  target: number,
) => {
  const blocks = toEntryBlocks(content)
  if (isSubtask(content, index)) {
    const block = findBlock(blocks, index)
    const from = block?.findIndex(({ from }) => from === index) ?? -1
    const to = block?.findIndex(({ from }) => from === target) ?? -1
    if (!block || to < 1) return
    block.splice(to, 0, ...block.splice(from, 1))
  } else {
    const from = blocks.findIndex((block) => block[0].from === index)
    const to = blocks.findIndex((block) => block[0].from === target)
    if (from === -1 || to === -1) return
    blocks.splice(to, 0, ...blocks.splice(from, 1))
  }
  return flatten(blocks)
}

// Brings the list back to its rules after items were removed or put back.
export const settleItems = (content: TTaskItem[]) => {
  const blocks = toEntryBlocks(content)
  for (const block of blocks) syncParent(block)
  return flatten(blocks)
}
