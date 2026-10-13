// Tests for firestore.rules, run against the local emulator:
//   pnpm test:rules
// Each shared collection (notes, tasks, finances, health logs) must allow
// exactly the updates in `canUpdateShared` and refuse the rest.

import { readFileSync } from 'node:fs'
import { after, before, beforeEach, describe, test } from 'node:test'

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'

const OWNER = 'owner'
const WRITER = 'writer'
const READER = 'reader'
const STRANGER = 'stranger'
const UNREGISTERED = 'unregistered'

let environment

before(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'demo-catatsaja',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

after(async () => {
  await environment?.cleanup()
})

// Everyone but UNREGISTERED has a profile (creating needs one).
beforeEach(async () => {
  await environment.clearFirestore()
  await environment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore()
    for (const uid of [OWNER, WRITER, READER, STRANGER])
      await database
        .collection('users')
        .doc(uid)
        .set({ uid, email: `${uid}@example.com` })
  })
})

// Signed in as `uid` (with `uid@example.com` as the sign-in email), or
// signed out.
const as = (uid) =>
  uid
    ? environment
        .authenticatedContext(uid, { email: `${uid}@example.com` })
        .firestore()
    : environment.unauthenticatedContext().firestore()

const seed = async (path, data) =>
  environment.withSecurityRulesDisabled(async (context) => {
    await context.firestore().doc(path).set(data)
  })

describe('users', () => {
  test('signed-in people can read profiles, signed-out people cannot', async () => {
    await assertSucceeds(as(STRANGER).doc(`users/${OWNER}`).get())
    await assertFails(as().doc(`users/${OWNER}`).get())
  })

  test('profiles cannot be listed, so nobody can download every email', async () => {
    await assertFails(as(STRANGER).collection('users').get())
    await assertFails(
      as(STRANGER)
        .collection('users')
        .where('email', '==', `${OWNER}@example.com`)
        .get(),
    )
  })

  test('only the person writes their own profile', async () => {
    await assertSucceeds(
      as(OWNER).doc(`users/${OWNER}`).update({ displayName: 'Me' }),
    )
    await assertFails(
      as(STRANGER).doc(`users/${OWNER}`).update({ displayName: 'Hacked' }),
    )
  })

  test('the sealed private key is private to its owner', async () => {
    const path = `users/${OWNER}/keys/main`
    await assertSucceeds(as(OWNER).doc(path).set({ v: 1, publicKey: 'pk' }))
    await assertSucceeds(as(OWNER).doc(path).get())
    await assertFails(as(STRANGER).doc(path).get())
    await assertFails(as(STRANGER).doc(path).set({ v: 1 }))
  })

  test('who someone blocked is private to them', async () => {
    await seed(`users/${OWNER}/blocked/${STRANGER}`, { blockedAt: new Date() })
    await assertSucceeds(
      as(OWNER).doc(`users/${OWNER}/blocked/${STRANGER}`).get(),
    )
    await assertSucceeds(
      as(OWNER)
        .doc(`users/${OWNER}/blocked/${READER}`)
        .set({ blockedAt: new Date() }),
    )
    await assertFails(
      as(STRANGER).doc(`users/${OWNER}/blocked/${STRANGER}`).get(),
    )
    await assertFails(as(STRANGER).collection(`users/${OWNER}/blocked`).get())
    await assertFails(
      as(STRANGER).doc(`users/${OWNER}/blocked/${STRANGER}`).delete(),
    )
  })

  test('currencies are private to their owner', async () => {
    const path = `users/${OWNER}/currencies/usd`
    await assertSucceeds(as(OWNER).doc(path).set({ code: 'USD' }))
    await assertSucceeds(as(OWNER).doc(path).get())
    await assertFails(as(STRANGER).doc(path).get())
    await assertFails(as(STRANGER).doc(path).set({ code: 'EUR' }))
  })
})

describe('userLookup', () => {
  const mine = `userLookup/${OWNER}@example.com`

  test('people file their own sign-in email, pointing at themselves', async () => {
    await assertSucceeds(as(OWNER).doc(mine).set({ uid: OWNER }))
    await assertFails(as(OWNER).doc(mine).set({ uid: STRANGER }))
    await assertFails(
      as(OWNER).doc(`userLookup/${STRANGER}@example.com`).set({ uid: OWNER }),
    )
    await assertFails(
      as(OWNER).doc(mine).set({ uid: OWNER, displayName: 'extra field' }),
    )
  })

  test('anyone signed in reads one entry; nobody lists them', async () => {
    await seed(mine, { uid: OWNER })
    await assertSucceeds(as(STRANGER).doc(mine).get())
    await assertFails(as().doc(mine).get())
    await assertFails(as(STRANGER).collection('userLookup').get())
  })

  test('only the person removes their entry', async () => {
    await seed(mine, { uid: OWNER })
    await assertFails(as(STRANGER).doc(mine).delete())
    await assertSucceeds(as(OWNER).doc(mine).delete())
  })
})

describe('config', () => {
  test('everyone reads it, signed in or not', async () => {
    await seed('config/app', { maintenance: false })
    await assertSucceeds(as(STRANGER).doc('config/app').get())
    await assertSucceeds(as().doc('config/app').get())
  })

  test('nobody writes it from the app', async () => {
    await seed('config/app', { maintenance: false })
    await assertFails(as(OWNER).doc('config/app').update({ maintenance: true }))
    await assertFails(as().doc('config/app').set({ maintenance: true }))
    await assertFails(as(OWNER).doc('config/other').set({ maintenance: true }))
  })
})

describe('collections that are not part of the app', () => {
  test('groups are refused', async () => {
    await seed('groups/g1', {
      owner: OWNER,
      permissions: { read: [OWNER], write: [OWNER] },
    })
    await assertFails(as(OWNER).doc('groups/g1').get())
    await assertFails(as(OWNER).collection('groups').add({ owner: OWNER }))
  })
})

// The fields a writer may change in each shared collection.
const collections = {
  notes: { title: 'A note', content: 'Text' },
  tasks: { title: 'A list', content: [] },
  finances: {
    title: 'A book',
    content: [],
    currency: {},
    accounts: [],
    summary: {},
  },
  healthLogs: {
    name: 'Me',
    birthDate: '1990-01-01',
    sex: 'female',
    calorieTarget: null,
    content: [],
    reminders: [],
  },
}

for (const [collection, content] of Object.entries(collections)) {
  const path = `${collection}/doc`
  const shared = {
    ...content,
    owner: OWNER,
    permissions: { read: [OWNER, WRITER, READER], write: [OWNER, WRITER] },
    pinnedBy: [],
  }
  // A text field every collection has (a title or a name). Writes use a new
  // value: writing the current one changes nothing, which Firestore allows.
  const firstField = Object.keys(content)[0]

  describe(collection, () => {
    test('a registered person creates their own', async () => {
      await assertSucceeds(
        as(OWNER)
          .collection(collection)
          .add({
            ...content,
            owner: OWNER,
            permissions: { read: [OWNER], write: [OWNER] },
          }),
      )
    })

    test('creating is refused without a profile, for someone else, or without access', async () => {
      await assertFails(
        as(UNREGISTERED)
          .collection(collection)
          .add({
            ...content,
            owner: UNREGISTERED,
            permissions: { read: [UNREGISTERED], write: [UNREGISTERED] },
          }),
      )
      await assertFails(
        as(OWNER)
          .collection(collection)
          .add({
            ...content,
            owner: STRANGER,
            permissions: { read: [OWNER], write: [OWNER] },
          }),
      )
      await assertFails(
        as(OWNER)
          .collection(collection)
          .add({
            ...content,
            owner: OWNER,
            permissions: { read: [], write: [] },
          }),
      )
      // Others join by accepting an invitation, never from the start.
      await assertFails(
        as(OWNER)
          .collection(collection)
          .add({
            ...content,
            owner: OWNER,
            permissions: { read: [OWNER, READER], write: [OWNER] },
          }),
      )
      await assertFails(
        as(OWNER)
          .collection(collection)
          .add({
            ...content,
            owner: OWNER,
            permissions: { read: [OWNER], write: [OWNER] },
            invites: { read: [READER], write: [] },
          }),
      )
    })

    test('people it is shared with read it; nobody else does', async () => {
      await seed(path, shared)
      for (const uid of [OWNER, WRITER, READER])
        await assertSucceeds(as(uid).doc(path).get())
      await assertFails(as(STRANGER).doc(path).get())
      await assertFails(as().doc(path).get())
    })

    test('lists only return what is shared with the person', async () => {
      await seed(path, shared)
      await assertSucceeds(
        as(READER)
          .collection(collection)
          .where('permissions.read', 'array-contains', READER)
          .get(),
      )
      await assertFails(as(STRANGER).collection(collection).get())
    })

    test('the owner changes anything but the owner', async () => {
      await seed(path, shared)
      await assertSucceeds(
        as(OWNER)
          .doc(path)
          .update({
            [firstField]: 'Changed',
            'permissions.read': [OWNER, READER],
            'permissions.write': [OWNER],
          }),
      )
      await assertFails(as(OWNER).doc(path).update({ owner: STRANGER }))
    })

    test('a writer changes the content, not the sharing', async () => {
      await seed(path, shared)
      await assertSucceeds(
        as(WRITER)
          .doc(path)
          .update({ [firstField]: 'Changed', updatedAt: new Date() }),
      )
      await assertFails(
        as(WRITER)
          .doc(path)
          .update({ 'permissions.write': [OWNER, WRITER, READER] }),
      )
      await assertFails(as(WRITER).doc(path).update({ owner: WRITER }))
    })

    test('a writer changes every content field; a reader none', async () => {
      await seed(path, shared)
      for (const field of Object.keys(content)) {
        const changed = Array.isArray(content[field])
          ? [{ id: 'changed' }]
          : `Changed ${field}`
        await assertSucceeds(
          as(WRITER)
            .doc(path)
            .update({ [field]: changed }),
        )
        await assertFails(
          as(READER)
            .doc(path)
            .update({ [field]: [{ id: 'reader' }] }),
        )
      }
    })

    test('a reader cannot change the content', async () => {
      await seed(path, shared)
      await assertFails(
        as(READER)
          .doc(path)
          .update({ [firstField]: 'Changed' }),
      )
      await assertFails(
        as(STRANGER)
          .doc(path)
          .update({ pinnedBy: [STRANGER] }),
      )
    })

    test('anyone with access pins for themselves only', async () => {
      await seed(path, shared)
      await assertSucceeds(
        as(READER)
          .doc(path)
          .update({ pinnedBy: [READER] }),
      )
      await assertFails(
        as(READER)
          .doc(path)
          .update({ pinnedBy: [READER, OWNER] }),
      )
      await assertFails(
        as(READER)
          .doc(path)
          .update({ pinnedBy: [READER], [firstField]: 'Changed' }),
      )
    })

    test('anyone with access archives for themselves only', async () => {
      await seed(path, shared)
      await assertSucceeds(
        as(READER)
          .doc(path)
          .update({ archivedBy: [READER] }),
      )
      await assertSucceeds(
        as(OWNER)
          .doc(path)
          .update({ archivedBy: [READER, OWNER] }),
      )
      // Only their own id: the others' archive stays as it is.
      await assertFails(
        as(WRITER)
          .doc(path)
          .update({ archivedBy: [WRITER] }),
      )
      await assertFails(
        as(READER)
          .doc(path)
          .update({ archivedBy: [READER, OWNER, WRITER] }),
      )
      // Taking it back out of their own archive.
      await assertSucceeds(
        as(READER)
          .doc(path)
          .update({ archivedBy: [OWNER] }),
      )
      await assertFails(
        as(READER)
          .doc(path)
          .update({ archivedBy: [READER, OWNER], pinnedBy: [READER] }),
      )
      await assertFails(
        as(STRANGER)
          .doc(path)
          .update({ archivedBy: [READER, OWNER, STRANGER] }),
      )
    })

    test('someone it is shared with leaves, and removes nobody else', async () => {
      await seed(path, shared)
      await assertSucceeds(
        as(READER)
          .doc(path)
          .update({
            permissions: { read: [OWNER, WRITER], write: [OWNER, WRITER] },
          }),
      )
      await seed(path, shared)
      await assertFails(
        as(READER)
          .doc(path)
          .update({
            permissions: { read: [OWNER, READER], write: [OWNER] },
          }),
      )
    })

    describe('encrypted', () => {
      const encrypted = {
        owner: OWNER,
        permissions: { read: [OWNER, WRITER, READER], write: [OWNER, WRITER] },
        pinnedBy: [],
        encrypted: { v: 1, iv: 'iv', ct: 'ct' },
        keys: { [OWNER]: 'k1', [WRITER]: 'k2', [READER]: 'k3' },
      }

      test('a writer changes the encrypted content, never plain text into it', async () => {
        await seed(path, encrypted)
        await assertSucceeds(
          as(WRITER)
            .doc(path)
            .update({
              encrypted: { v: 1, iv: 'iv2', ct: 'ct2' },
              updatedAt: new Date(),
            }),
        )
        await assertFails(
          as(WRITER)
            .doc(path)
            .update({ [firstField]: 'Readable' }),
        )
        await assertFails(as(WRITER).doc(path).update({ 'keys.stranger': 'k' }))
      })

      test("leaving removes your own key, and nobody else's", async () => {
        await seed(path, encrypted)
        await assertSucceeds(
          as(READER)
            .doc(path)
            .update({
              permissions: { read: [OWNER, WRITER], write: [OWNER, WRITER] },
              keys: { [OWNER]: 'k1', [WRITER]: 'k2' },
            }),
        )
        await seed(path, encrypted)
        await assertFails(
          as(READER)
            .doc(path)
            .update({
              permissions: { read: [OWNER, WRITER], write: [OWNER, WRITER] },
              keys: { [OWNER]: 'k1' },
            }),
        )
      })
    })

    describe('invitations', () => {
      const invitedAs = (access) => ({
        ...shared,
        invites: {
          read: [STRANGER],
          write: access === 'write' ? [STRANGER] : [],
        },
      })
      const members = [OWNER, WRITER, READER]

      test('the owner invites, and cannot give access directly', async () => {
        await seed(path, shared)
        await assertSucceeds(
          as(OWNER)
            .doc(path)
            .update({ invites: { read: [STRANGER], write: [] } }),
        )
        await assertFails(
          as(OWNER)
            .doc(path)
            .update({ 'permissions.read': [...members, STRANGER] }),
        )
        await assertFails(
          as(OWNER)
            .doc(path)
            .update({ 'permissions.write': [OWNER, WRITER, STRANGER] }),
        )
        // Making a reader a writer is still the owner's to do.
        await assertSucceeds(
          as(OWNER)
            .doc(path)
            .update({ 'permissions.write': [OWNER, WRITER, READER] }),
        )
      })

      test('someone invited reads it and finds it, but cannot change it', async () => {
        await seed(path, invitedAs('write'))
        await assertSucceeds(as(STRANGER).doc(path).get())
        await assertSucceeds(
          as(STRANGER)
            .collection(collection)
            .where('invites.read', 'array-contains', STRANGER)
            .get(),
        )
        await assertFails(
          as(STRANGER)
            .doc(path)
            .update({ [firstField]: 'Changed', updatedAt: new Date() }),
        )
        await assertFails(
          as(STRANGER)
            .doc(path)
            .update({ pinnedBy: [STRANGER] }),
        )
      })

      test('accepting gives exactly the access offered', async () => {
        await seed(path, invitedAs('read'))
        await assertFails(
          as(STRANGER)
            .doc(path)
            .update({
              'permissions.read': [...members, STRANGER],
              'permissions.write': [OWNER, WRITER, STRANGER],
              invites: { read: [], write: [] },
            }),
        )
        await assertFails(
          as(STRANGER)
            .doc(path)
            .update({
              'permissions.read': [...members, STRANGER],
              invites: { read: [], write: [] },
              [firstField]: 'Changed',
            }),
        )
        await assertSucceeds(
          as(STRANGER)
            .doc(path)
            .update({
              'permissions.read': [...members, STRANGER],
              invites: { read: [], write: [] },
            }),
        )

        await seed(path, invitedAs('write'))
        await assertSucceeds(
          as(STRANGER)
            .doc(path)
            .update({
              'permissions.read': [...members, STRANGER],
              'permissions.write': [OWNER, WRITER, STRANGER],
              invites: { read: [], write: [] },
            }),
        )
      })

      test('nobody accepts for someone else, or without an invitation', async () => {
        await seed(path, invitedAs('write'))
        await assertFails(
          as(UNREGISTERED)
            .doc(path)
            .update({ 'permissions.read': [...members, UNREGISTERED] }),
        )
        await assertFails(
          as(READER)
            .doc(path)
            .update({
              'permissions.read': [...members, STRANGER],
              invites: { read: [], write: [] },
            }),
        )
      })

      test('nobody can invite someone who blocked them', async () => {
        await seed(path, shared)
        await seed(`users/${STRANGER}/blocked/${OWNER}`, {
          blockedAt: new Date(),
        })
        await assertFails(
          as(OWNER)
            .doc(path)
            .update({ invites: { read: [STRANGER], write: [] } }),
        )
        // Only one new person at a time, so each can be checked.
        await assertFails(
          as(OWNER)
            .doc(path)
            .update({
              invites: { read: [UNREGISTERED, 'someone'], write: [] },
            }),
        )
        await assertSucceeds(
          as(OWNER)
            .doc(path)
            .update({ invites: { read: [UNREGISTERED], write: [] } }),
        )
      })

      test('declining removes the invitation and its key, nothing else', async () => {
        const encryptedInvite = {
          ...invitedAs('read'),
          encrypted: { v: 1, iv: 'iv', ct: 'ct' },
          keys: {
            [OWNER]: 'k1',
            [WRITER]: 'k2',
            [READER]: 'k3',
            [STRANGER]: 'k4',
          },
        }
        await seed(path, encryptedInvite)
        await assertFails(
          as(STRANGER)
            .doc(path)
            .update({
              invites: { read: [], write: [] },
              keys: { [OWNER]: 'k1' },
            }),
        )
        await assertSucceeds(
          as(STRANGER)
            .doc(path)
            .update({
              invites: { read: [], write: [] },
              keys: { [OWNER]: 'k1', [WRITER]: 'k2', [READER]: 'k3' },
            }),
        )
      })
    })

    test('only the owner deletes it', async () => {
      await seed(path, shared)
      await assertFails(as(WRITER).doc(path).delete())
      await assertSucceeds(as(OWNER).doc(path).delete())
    })
  })
}

// A book's entries moved into month documents (`finances/{id}/months`).
describe('finance months', () => {
  const book = 'finances/book'
  const people = {
    owner: OWNER,
    permissions: { read: [OWNER, WRITER, READER], write: [OWNER, WRITER] },
    invites: { read: [STRANGER], write: [] },
    pinnedBy: [],
  }
  const plainBook = {
    ...people,
    title: 'A book',
    currency: {},
    accounts: [],
    summary: {},
  }
  const movedPlain = { ...plainBook, entryStore: 2 }
  const encryptedBook = {
    ...people,
    encrypted: { v: 1, iv: 'iv', ct: 'ct' },
    keys: { [OWNER]: 'k1', [WRITER]: 'k2', [READER]: 'k3' },
  }
  const movedEncrypted = { ...encryptedBook, entryStore: 2 }
  const month = { month: '2026-10', content: [{ id: 'e1' }] }
  const sealedMonth = { encrypted: { v: 1, iv: 'iv', ct: 'ct' } }

  test('readers read the months; strangers and people only invited do not', async () => {
    await seed(book, movedPlain)
    await seed(`${book}/months/2026-10`, month)
    await assertSucceeds(as(READER).doc(`${book}/months/2026-10`).get())
    await assertSucceeds(as(READER).collection(`${book}/months`).get())
    await assertFails(as(STRANGER).doc(`${book}/months/2026-10`).get())
    await assertFails(as(STRANGER).collection(`${book}/months`).get())
  })

  test('writers write and delete months of a moved book; readers cannot', async () => {
    await seed(book, movedPlain)
    const path = `${book}/months/2026-10`
    await assertSucceeds(as(WRITER).doc(path).set(month))
    await assertSucceeds(
      as(OWNER)
        .doc(path)
        .set({ ...month, content: [] }),
    )
    await assertFails(as(READER).doc(path).set(month))
    await assertFails(as(READER).doc(path).delete())
    await assertSucceeds(as(WRITER).doc(path).delete())
  })

  test('a month matches its book: plain month ids, encrypted blobs only', async () => {
    await seed(book, movedPlain)
    await assertFails(as(WRITER).doc(`${book}/months/2026-11`).set(month))
    await assertFails(
      as(WRITER)
        .doc(`${book}/months/2026-13`)
        .set({ ...month, month: '2026-13' }),
    )
    await assertFails(
      as(WRITER)
        .doc(`${book}/months/2026-10`)
        .set({ ...month, extra: true }),
    )
    await assertFails(as(WRITER).doc(`${book}/months/x1`).set(sealedMonth))

    await seed(book, movedEncrypted)
    await assertSucceeds(as(WRITER).doc(`${book}/months/x1`).set(sealedMonth))
    await assertFails(as(WRITER).doc(`${book}/months/2026-10`).set(month))
    await assertFails(
      as(WRITER)
        .doc(`${book}/months/x1`)
        .set({ ...sealedMonth, month: '2026-10' }),
    )
  })

  test('no months for a book whose entries have not moved', async () => {
    await seed(book, { ...plainBook, content: [] })
    await assertFails(as(OWNER).doc(`${book}/months/2026-10`).set(month))
  })

  test('a writer moves a book into months in one write, once', async () => {
    await seed(book, { ...plainBook, content: [{ id: 'e1' }] })
    const database = as(WRITER)
    const batch = database.batch()
    batch.set(database.doc(book), movedPlain)
    batch.set(database.doc(`${book}/months/2026-10`), month)
    await assertSucceeds(batch.commit())

    // Moved: `content` never comes back, and the mark stays.
    await assertFails(
      as(WRITER)
        .doc(book)
        .update({ content: [] }),
    )
    await assertFails(
      as(OWNER)
        .doc(book)
        .update({ content: [] }),
    )
    await assertFails(as(OWNER).doc(book).set(plainBook))
  })

  test('moving keeps nothing behind and changes nothing else', async () => {
    await seed(book, { ...plainBook, content: [{ id: 'e1' }] })
    await assertFails(
      as(WRITER)
        .doc(book)
        .update({ entryStore: 2 }),
    )
    await assertFails(
      as(WRITER)
        .doc(book)
        .set({ ...movedPlain, title: 'Renamed', updatedAt: new Date() }),
    )
    await assertFails(
      as(READER)
        .doc(book)
        .set(movedPlain),
    )
  })

  test('an encrypted book moves with its blob rewritten', async () => {
    await seed(book, encryptedBook)
    const database = as(WRITER)
    const batch = database.batch()
    batch.set(database.doc(book), {
      ...movedEncrypted,
      encrypted: { v: 1, iv: 'iv2', ct: 'ct2' },
    })
    batch.set(database.doc(`${book}/months/x1`), sealedMonth)
    await assertSucceeds(batch.commit())
  })

  test('a new book may start moved, with its months, but not with content', async () => {
    const created = {
      ...movedPlain,
      permissions: { read: [OWNER], write: [OWNER] },
      invites: undefined,
    }
    delete created.invites
    const database = as(OWNER)
    const batch = database.batch()
    batch.set(database.doc('finances/new'), created)
    batch.set(database.doc('finances/new/months/2026-10'), month)
    await assertSucceeds(batch.commit())
    await assertFails(
      as(OWNER)
        .doc('finances/other')
        .set({ ...created, content: [] }),
    )
  })

  test('encrypting a moved book rewrites its months in the same write', async () => {
    await seed(book, movedPlain)
    await seed(`${book}/months/2026-10`, month)
    const database = as(OWNER)
    const batch = database.batch()
    batch.set(database.doc(book), movedEncrypted)
    batch.delete(database.doc(`${book}/months/2026-10`))
    batch.set(database.doc(`${book}/months/x1`), sealedMonth)
    await assertSucceeds(batch.commit())
    // A plain month can't stay behind in an encrypted book.
    await assertFails(as(OWNER).doc(`${book}/months/2026-10`).set(month))
  })

  test('months of a deleted book are deleted before it, by its writers', async () => {
    await seed(book, movedPlain)
    await seed(`${book}/months/2026-10`, month)
    const database = as(OWNER)
    const batch = database.batch()
    batch.delete(database.doc(`${book}/months/2026-10`))
    batch.delete(database.doc(book))
    await assertSucceeds(batch.commit())
  })
})
