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
  finances: { title: 'A book', content: [], currency: {}, accounts: [] },
  healthLogs: {
    name: 'Me',
    birthDate: '1990-01-01',
    sex: 'female',
    calorieTarget: null,
    content: [],
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
            [firstField]: content[firstField],
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
          .update({ [firstField]: content[firstField], updatedAt: new Date() }),
      )
      await assertFails(
        as(WRITER)
          .doc(path)
          .update({ 'permissions.write': [OWNER, WRITER, READER] }),
      )
      await assertFails(as(WRITER).doc(path).update({ owner: WRITER }))
    })

    test('a reader cannot change the content', async () => {
      await seed(path, shared)
      await assertFails(
        as(READER)
          .doc(path)
          .update({ [firstField]: content[firstField] }),
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
          .update({ pinnedBy: [READER], [firstField]: content[firstField] }),
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

    test('only the owner deletes it', async () => {
      await seed(path, shared)
      await assertFails(as(WRITER).doc(path).delete())
      await assertSucceeds(as(OWNER).doc(path).delete())
    })
  })
}
