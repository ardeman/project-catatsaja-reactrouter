// Tests for measuring a document against Firestore's 1 MiB limit:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  documentSize,
  storedSize,
  valueSize,
} from '../app/lib/utils/document-size.ts'

describe('document size', () => {
  test("matches Firestore's own example (147 bytes)", () => {
    // https://firebase.google.com/docs/firestore/storage-size
    assert.equal(
      documentSize('users/jeff/tasks/my_task_id', {
        type: 'Personal',
        done: false,
        priority: 1,
        description: 'Learn Cloud Firestore',
      }),
      147,
    )
  })

  test('counts strings in UTF-8 and timestamps as 8 bytes', () => {
    assert.equal(valueSize('é'), 3)
    assert.equal(valueSize({ seconds: 1, nanoseconds: 0 }), 8)
    assert.equal(valueSize(new Date()), 8)
    assert.equal(valueSize([1, 'a']), 8 + 2)
  })

  test('leaves out fields that are undefined', () => {
    assert.equal(valueSize({ a: 1, b: undefined }), 2 + 8)
  })
})

describe('stored size', () => {
  const entries = Array.from({ length: 100 }, (_, index) => ({
    id: `entry-${index}`,
    description: 'Makan siang',
    amount: 35_000,
  }))
  const fields = { owner: 'u1', title: 'Book', content: entries }
  const options = {
    path: 'finances/abcdefghijklmnopqrst',
    fields,
    contentFields: ['title', 'content'],
    readers: ['u1', 'u2'],
  }

  test('a plain item is the document itself', () => {
    assert.equal(
      storedSize({ ...options, isEncrypted: false }),
      documentSize(options.path, fields),
    )
  })

  test('an encrypted item is its blob plus a sealed key per reader', () => {
    const content = JSON.stringify({ title: 'Book', content: entries })
    const blob = Math.ceil((content.length + 16) / 3) * 4
    const sealedKeys = 2 * (3 + 513)
    const size = storedSize({ ...options, isEncrypted: true })
    // Blob and keys, with the readable fields and the map overhead.
    assert.ok(size > blob + sealedKeys)
    assert.ok(size < blob + sealedKeys + 200)
  })

  test('grows with each reader of an encrypted item', () => {
    const one = storedSize({ ...options, isEncrypted: true, readers: ['u1'] })
    const two = storedSize({ ...options, isEncrypted: true })
    assert.equal(two - one, 3 + 513)
  })
})
