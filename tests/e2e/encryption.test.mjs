// End-to-end tests of encryption and sharing, on the local emulators:
//   pnpm test:e2e
// Ana, Budi and Cici are three accounts; each scenario builds on the one
// before, so they run in order.

import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'

import {
  APP,
  createNote,
  dbGet,
  dbList,
  dbPatch,
  keysOf,
  launch,
  newDevice,
  readersOf,
  resetEmulators,
  sees,
  setUpEncryption,
  shareWith,
  signIn,
  signInAndUnlock,
  signUp,
  startApp,
  stopApp,
  uidOf,
  unlock,
} from './helpers.mjs'

const ANA = 'ana@example.com'
const BUDI = 'budi@example.com'
const CICI = 'cici@example.com'

let server
let browser

before(async () => {
  server = await startApp()
  browser = await launch()
  // A first visit to each kind of page: the dev server prepares its
  // dependencies on first use and reloads, which mustn't happen mid-test.
  await resetEmulators()
  const { page } = await newDevice(browser)
  await signUp(page, 'Warm-up', 'warm-up@example.com')
  await page.getByText('Protect your data').waitFor({ timeout: 60_000 })
  for (const path of [
    '/notes/create',
    '/tasks/create',
    '/finances/create',
    '/health/create',
    '/settings',
  ]) {
    await page.goto(`${APP}${path}`)
    await page.waitForTimeout(2000)
  }
  await page.context().close()
  await resetEmulators()
})

after(async () => {
  await browser?.close()
  stopApp(server)
})

describe('end-to-end encryption', () => {
  test('a new account sets up encryption and its notes are stored encrypted', async () => {
    const { page } = await newDevice(browser)
    await signUp(page, 'Ana', ANA)
    await page.getByText('Protect your data').waitFor({ timeout: 30_000 })
    await setUpEncryption(page, 'ana passphrase 1')
    await page.waitForURL(/\/notes/, { timeout: 30_000 })
    const anaUid = await uidOf(ANA)
    assert.ok(anaUid, 'Ana can be found by email')
    const profile = await dbGet(`users/${anaUid}`)
    assert.equal(profile.encryptionRequired?.booleanValue, true)
    assert.ok(profile.publicKey?.stringValue, 'public key on the profile')
    const keyring = await dbGet(`users/${anaUid}/keys/main`)
    assert.ok(keyring?.passphrase && keyring.recovery, 'sealed keys stored')

    await createNote(page, 'Ana secret note')
    const [note] = await dbList('notes')
    assert.ok(note.fields.encrypted, 'stored as an encrypted blob')
    assert.ok(!note.fields.title, 'no readable title')
    assert.ok(!JSON.stringify(note.fields).includes('Ana secret note'))
    assert.deepEqual(keysOf(note.fields), [anaUid])
    assert.ok(await sees(page, 'Ana secret note'), 'Ana reads it')
    await page.context().close()
  })

  test('sharing between encrypted accounts, editing and removing', async () => {
    const ana = await signInAndUnlock(browser, ANA, 'ana passphrase 1')
    const budi = await newDevice(browser)
    await signUp(budi.page, 'Budi', BUDI)
    await budi.page.getByText('Protect your data').waitFor({ timeout: 30_000 })
    await setUpEncryption(budi.page, 'budi passphrase 1')
    await budi.page.waitForURL(/\/notes/, { timeout: 30_000 })
    const anaUid = await uidOf(ANA)
    const budiUid = await uidOf(BUDI)
    const [{ id }] = await dbList('notes')

    await ana.page.goto(`${APP}/notes/${id}`)
    await ana.page.locator('textarea[name=title]').waitFor()
    await shareWith(ana.page, BUDI, 'Read and write')
    await ana.page.keyboard.press('Escape')
    let stored = await dbGet(`notes/${id}`)
    assert.deepEqual(keysOf(stored).toSorted(), [anaUid, budiUid].toSorted())
    assert.ok(await sees(budi.page, 'Ana secret note'), 'Budi reads it')

    await budi.page.goto(`${APP}/notes/${id}`)
    const title = budi.page.locator('textarea[name=title]')
    await title.waitFor()
    await title.fill('Edited by Budi')
    await budi.page.waitForTimeout(4000)
    stored = await dbGet(`notes/${id}`)
    assert.ok(
      !JSON.stringify(stored).includes('Edited by Budi'),
      'edit encrypted',
    )
    assert.ok(await sees(ana.page, 'Edited by Budi'), 'Ana sees the edit')

    await ana.page.goto(`${APP}/notes/${id}`)
    await ana.page.locator('textarea[name=title]').waitFor()
    await ana.page
      .getByRole('button', { name: /^Shared with/ })
      .first()
      .click()
    await ana.page
      .getByRole('dialog')
      .getByRole('button', { name: `Remove ${BUDI}` })
      .click()
    await ana.page.waitForTimeout(2500)
    await ana.page.keyboard.press('Escape')
    const before = stored
    stored = await dbGet(`notes/${id}`)
    assert.deepEqual(keysOf(stored), [anaUid], 'only Ana keeps a key')
    assert.notEqual(
      stored.encrypted.mapValue.fields.ct.stringValue,
      before.encrypted.mapValue.fields.ct.stringValue,
      'encrypted again with a new key',
    )
    assert.ok(!(await sees(budi.page, 'Edited by Budi')), 'Budi lost it')
    assert.ok(await sees(ana.page, 'Edited by Budi'), 'Ana still reads it')
    await ana.context.close()
    await budi.context.close()
  })

  test('sharing with and from an account without encryption, then turning it on', async () => {
    const ana = await signInAndUnlock(browser, ANA, 'ana passphrase 1')
    const cici = await newDevice(browser)
    await signUp(cici.page, 'Cici', CICI)
    await cici.page.getByText('Protect your data').waitFor({ timeout: 30_000 })
    const anaUid = await uidOf(ANA)
    const ciciUid = await uidOf(CICI)
    // An account from before encryption: not asked to set it up.
    await dbPatch(`users/${ciciUid}`, {
      encryptionRequired: { booleanValue: false },
    })
    await cici.page.goto(`${APP}/notes`)
    await cici.page.waitForTimeout(2500)
    assert.ok(!(await cici.page.getByText('Protect your data').isVisible()))

    const ciciNote = await createNote(cici.page, 'Cici plain note')
    let stored = await dbGet(`notes/${ciciNote}`)
    assert.equal(stored.title?.stringValue, 'Cici plain note', 'stored plain')
    await shareWith(cici.page, ANA, 'Read only')
    await cici.page.keyboard.press('Escape')
    assert.ok(await sees(ana.page, 'Cici plain note'), 'Ana reads it')

    const anaNote = (await dbList('notes')).find(
      (note) => note.fields.owner?.stringValue === anaUid,
    ).id
    await ana.page.goto(`${APP}/notes/${anaNote}`)
    await ana.page.locator('textarea[name=title]').waitFor()
    const dialog = await shareWith(ana.page, CICI, 'Read only')
    assert.ok(await dialog.getByText(/hasn't turned on encryption/).isVisible())
    stored = await dbGet(`notes/${anaNote}`)
    assert.ok(!readersOf(stored).includes(ciciUid), 'not shared before asking')
    await dialog
      .getByRole('button', { name: 'Share without encryption' })
      .click()
    await ana.page.waitForTimeout(2500)
    await ana.page.keyboard.press('Escape')
    stored = await dbGet(`notes/${anaNote}`)
    assert.ok(!stored.encrypted && !stored.keys, 'stored plain after agreeing')
    assert.ok(await sees(cici.page, 'Edited by Budi'), 'Cici reads it')

    await cici.page.goto(`${APP}/settings`)
    await cici.page
      .getByRole('button', { name: 'Turn on encryption' })
      .first()
      .click()
    await setUpEncryption(
      cici.page,
      'cici passphrase 1',
      cici.page.getByRole('dialog'),
    )
    await cici.page.waitForTimeout(5000)
    stored = await dbGet(`notes/${ciciNote}`)
    assert.ok(stored.encrypted && !stored.title, "Cici's note encrypted")
    assert.ok(!stored.updatedAt, "encrypting isn't an edit")
    assert.deepEqual(keysOf(stored).toSorted(), [anaUid, ciciUid].toSorted())
    assert.ok(await sees(ana.page, 'Cici plain note'), 'Ana still reads it')
    await ana.page.waitForTimeout(2000)
    stored = await dbGet(`notes/${anaNote}`)
    assert.ok(stored.encrypted, "Ana's note encrypted again on her visit")
    assert.ok(
      await sees(cici.page, 'Edited by Budi'),
      'Cici reads it encrypted',
    )
    await ana.context.close()
    await cici.context.close()
  })

  test('unlocking, recovery, locking, passkeys and every kind of item', async () => {
    const ana = await newDevice(browser)
    const { page } = ana
    const anaUid = await uidOf(ANA)
    await signIn(page, ANA)
    await page.getByText('Unlock your data').waitFor({ timeout: 30_000 })
    await page.locator('input[name=passphrase]').fill('not my passphrase')
    await page.getByRole('button', { name: 'Unlock', exact: true }).click()
    await page.getByRole('alert').waitFor({ timeout: 15_000 })
    assert.match(await page.getByRole('alert').textContent(), /isn't right/)
    await unlock(page, 'ana passphrase 1')

    await page.goto(`${APP}/settings`)
    await page.getByRole('button', { name: 'New recovery code' }).click()
    const dialog = page.getByRole('dialog')
    const code = await dialog
      .getByLabel('Recovery code', { exact: true })
      .textContent()
    await dialog.getByLabel(/saved my recovery code/).click()
    await dialog.locator('input[name=passphrase]').fill('ana passphrase 1')
    await dialog.getByRole('button', { name: 'Use the new code' }).click()
    await page
      .getByText('Recovery code replaced', { exact: true })
      .waitFor({ timeout: 15_000 })

    await page.getByRole('button', { name: 'Account menu' }).click()
    await page.getByRole('menuitem', { name: 'Lock this device' }).click()
    await page.getByText('Unlock your data').waitFor({ timeout: 15_000 })
    await page.getByRole('button', { name: 'Forgot your passphrase?' }).click()
    // Typed loosely: lower case, spaces for dashes.
    await page
      .locator('input[name=code]')
      .fill(code.trim().toLowerCase().replaceAll('-', ' '))
    await page.locator('input[name=passphrase]').fill('ana passphrase 2')
    await page.locator('input[name=confirm]').fill('ana passphrase 2')
    await page
      .getByRole('button', { name: 'Unlock and save the new passphrase' })
      .click()
    await page
      .getByText('Unlock your data')
      .waitFor({ state: 'hidden', timeout: 30_000 })

    const other = await newDevice(browser)
    await signIn(other.page, ANA)
    await other.page.getByText('Unlock your data').waitFor({ timeout: 30_000 })
    await other.page.locator('input[name=passphrase]').fill('ana passphrase 1')
    await other.page
      .getByRole('button', { name: 'Unlock', exact: true })
      .click()
    await other.page.getByRole('alert').waitFor({ timeout: 15_000 })
    await unlock(other.page, 'ana passphrase 2')
    await other.context.close()

    // Passkey: Chrome's virtual authenticator, with PRF.
    const cdp = await ana.context.newCDPSession(page)
    await cdp.send('WebAuthn.enable')
    await cdp.send('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol: 'ctap2',
        transport: 'internal',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        hasPrf: true,
        automaticPresenceSimulation: true,
      },
    })
    await page.goto(`${APP}/settings`)
    await page.getByRole('button', { name: 'Add a passkey' }).click()
    const passkey = page.getByRole('dialog')
    await passkey.locator('input[name=passphrase]').fill('ana passphrase 2')
    await passkey.getByRole('button', { name: 'Add a passkey' }).click()
    await page
      .getByText('Passkey added', { exact: true })
      .waitFor({ timeout: 30_000 })
    const keyring = await dbGet(`users/${anaUid}/keys/main`)
    assert.equal(keyring.passkeys.arrayValue.values.length, 1)
    await page.getByRole('button', { name: 'Account menu' }).click()
    await page.getByRole('menuitem', { name: 'Lock this device' }).click()
    await page.getByRole('button', { name: 'Use a passkey' }).click()
    await page
      .getByText('Unlock your data')
      .waitFor({ state: 'hidden', timeout: 30_000 })

    await page.goto(`${APP}/finances/create`)
    await page.locator('textarea[name=title]').fill('Ana secret book')
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForURL(/\/finances\/(?!create)/, { timeout: 30_000 })
    const [book] = await dbList('finances')
    assert.ok(book.fields.encrypted && !book.fields.title, 'book encrypted')
    await page.getByRole('button', { name: 'Add entry' }).click()
    await page.locator('input[name=description]').fill('Rahasia lunch')
    await page.locator('#finance-entry-amount').fill('50000')
    await page.getByRole('combobox', { name: 'Category' }).click()
    await page.getByRole('option', { name: 'Food & drinks' }).click()
    await page
      .locator('form')
      .getByRole('button', { name: 'Save' })
      .last()
      .click()
    await page.waitForTimeout(4000)
    const stored = await dbGet(`finances/${book.id}`)
    assert.ok(
      !JSON.stringify(stored).includes('Rahasia lunch'),
      'entry encrypted',
    )

    await page.goto(`${APP}/health/create`)
    await page.locator('textarea[name=name]').fill('Ana health')
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForURL(/\/health\/(?!create)/, { timeout: 30_000 })
    const [log] = await dbList('healthLogs')
    assert.ok(log.fields.encrypted && !log.fields.name, 'health log encrypted')

    await page.goto(`${APP}/tasks/create`)
    await page.locator('textarea[name=title]').fill('Ana secret list')
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForURL(/\/tasks\/(?!create)/, { timeout: 30_000 })
    const [task] = await dbList('tasks')
    assert.ok(
      task.fields.encrypted && !task.fields.title,
      'task list encrypted',
    )

    await page.goto(`${APP}/notes`)
    await page.waitForTimeout(2500)
    assert.ok((await page.getByLabel('Encrypted').count()) > 0, 'lock icons')

    // Cici leaves Ana's shared note: her key goes with her.
    const cici = await signInAndUnlock(browser, CICI, 'cici passphrase 1')
    const ciciUid = await uidOf(CICI)
    const anaNote = (await dbList('notes')).find(
      (note) => note.fields.owner?.stringValue === anaUid,
    ).id
    await cici.page.goto(`${APP}/notes/${anaNote}`)
    await cici.page.locator('textarea[name=title]').waitFor()
    await cici.page
      .getByRole('button', { name: 'Remove from my list' })
      .first()
      .click()
    await cici.page
      .getByRole('dialog')
      .getByRole('button', { name: /Remove|Yes|Confirm/ })
      .last()
      .click()
    await cici.page.waitForTimeout(3000)
    const left = await dbGet(`notes/${anaNote}`)
    assert.ok(
      !keysOf(left).includes(ciciUid) && !readersOf(left).includes(ciciUid),
    )
    await cici.context.close()

    // Delete and undo: restored, and encrypted again.
    await page.goto(`${APP}/notes/${anaNote}`)
    await page.locator('textarea[name=title]').waitFor()
    await page.getByRole('button', { name: 'Delete' }).first().click()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /Delete|Yes|Confirm/ })
      .last()
      .click()
    await page.getByRole('button', { name: 'Undo' }).click({ timeout: 15_000 })
    await page.waitForTimeout(3000)
    const mine = (await dbList('notes')).filter(
      (note) => note.fields.owner?.stringValue === anaUid,
    )
    assert.equal(mine.length, 1)
    assert.ok(mine[0].fields.encrypted && !mine[0].fields.isEncrypted)
    await ana.context.close()
  })

  test('turning encryption off, sharing both ways, and turning it on again', async () => {
    const ana = await signInAndUnlock(browser, ANA, 'ana passphrase 2')
    const budi = await signInAndUnlock(browser, BUDI, 'budi passphrase 1')
    const anaUid = await uidOf(ANA)
    const budiUid = await uidOf(BUDI)
    const budiNote = await createNote(budi.page, 'Budi note')
    await shareWith(budi.page, ANA, 'Read and write')
    await budi.page.keyboard.press('Escape')
    const anaNote = await createNote(ana.page, 'Ana note for Budi')
    await shareWith(ana.page, BUDI, 'Read only')
    await ana.page.keyboard.press('Escape')
    assert.equal(keysOf(await dbGet(`notes/${budiNote}`)).length, 2)
    assert.equal(keysOf(await dbGet(`notes/${anaNote}`)).length, 2)

    await budi.page.goto(`${APP}/settings`)
    await budi.page.getByRole('button', { name: 'Turn off encryption' }).click()
    const off = budi.page.getByRole('dialog')
    await off
      .getByText(/encrypted and shared with you/)
      .waitFor({ timeout: 15_000 })
    await off.locator('input[name=passphrase]').fill('budi passphrase 1')
    await off.getByRole('button', { name: 'Turn off encryption' }).click()
    await budi.page
      .getByText('Encryption turned off', { exact: true })
      .waitFor({ timeout: 30_000 })
    const stored = await dbGet(`notes/${budiNote}`)
    assert.equal(stored.title?.stringValue, 'Budi note', 'his note plain again')
    assert.ok(!stored.encrypted && !stored.keys)
    const profile = await dbGet(`users/${budiUid}`)
    assert.ok(!profile.publicKey, 'public key removed')
    assert.equal(profile.encryptionRequired?.booleanValue, false)
    assert.equal(await dbGet(`users/${budiUid}/keys/main`), undefined)
    await budi.page.reload()
    await budi.page.waitForTimeout(3000)
    assert.ok(!(await budi.page.getByText('Unlock your data').isVisible()))
    assert.ok(await sees(budi.page, 'Budi note'))
    assert.ok(!(await sees(budi.page, 'Ana note for Budi')), 'hidden from him')
    assert.ok(await sees(ana.page, 'Budi note'), 'Ana reads his plain note')

    await ana.page.goto(`${APP}/settings`)
    await ana.page
      .getByText(/turned off encryption, so they can't read/)
      .waitFor({ timeout: 30_000 })
    await ana.page
      .getByRole('button', { name: 'Share them unencrypted' })
      .click()
    await ana.page
      .getByText(/Shared unencrypted/)
      .first()
      .waitFor({ timeout: 30_000 })
    const shared = await dbGet(`notes/${anaNote}`)
    assert.ok(!shared.encrypted, "Ana's note plain after she agreed")
    assert.ok(await sees(budi.page, 'Ana note for Budi'), 'Budi reads it again')

    const plainNote = await createNote(budi.page, 'Budi plain after opt-out')
    assert.equal(
      (await dbGet(`notes/${plainNote}`)).title?.stringValue,
      'Budi plain after opt-out',
    )
    await shareWith(budi.page, ANA, 'Read only')
    await budi.page.keyboard.press('Escape')
    assert.ok(await sees(ana.page, 'Budi plain after opt-out'))
    await createNote(ana.page, 'Ana second secret')
    const ask = await shareWith(ana.page, BUDI, 'Read only')
    assert.ok(await ask.getByText(/hasn't turned on encryption/).isVisible())
    await ask.getByRole('button', { name: 'Share without encryption' }).click()
    await ana.page.waitForTimeout(2500)
    await ana.page.keyboard.press('Escape')
    assert.ok(await sees(budi.page, 'Ana second secret'))

    await budi.page.goto(`${APP}/settings`)
    await budi.page
      .getByRole('button', { name: 'Turn on encryption' })
      .first()
      .click()
    await setUpEncryption(
      budi.page,
      'budi passphrase 2',
      budi.page.getByRole('dialog'),
    )
    await budi.page.waitForTimeout(6000)
    const again = await dbGet(`notes/${plainNote}`)
    assert.ok(again.encrypted && !again.title, 'encrypted again')
    assert.deepEqual(keysOf(again).toSorted(), [anaUid, budiUid].toSorted())
    assert.ok(await sees(ana.page, 'Budi plain after opt-out'))
    await ana.context.close()
    await budi.context.close()
  })
})
