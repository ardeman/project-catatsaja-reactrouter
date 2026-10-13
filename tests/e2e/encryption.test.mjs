// End-to-end tests of encryption and sharing, on the local emulators:
//   pnpm test:e2e
// Ana, Budi and Cici are three accounts; each scenario builds on the one
// before, so they run in order.

import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'

import {
  acceptInvitation,
  APP,
  createNote,
  dbGet,
  dbGetWhen,
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
  skipEncryptionSetup,
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
    '/settings/account',
    '/settings/health',
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
    await acceptInvitation(budi.page, 'Ana secret note')
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
    await acceptInvitation(ana.page, 'Cici plain note')
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
    await acceptInvitation(cici.page, 'Edited by Budi')
    assert.ok(await sees(cici.page, 'Edited by Budi'), 'Cici reads it')

    await cici.page.goto(`${APP}/settings/account`)
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

    await page.goto(`${APP}/settings/account`)
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
    await page.goto(`${APP}/settings/account`)
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
    // The toast's Undo: the note's own Undo can still be on screen until
    // the page leaves the deleted note.
    await page
      .getByRole('region', { name: /Notifications/ })
      .getByRole('button', { name: 'Undo' })
      .click({ timeout: 15_000 })
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
    await acceptInvitation(ana.page, 'Budi note')
    const anaNote = await createNote(ana.page, 'Ana note for Budi')
    await shareWith(ana.page, BUDI, 'Read only')
    await ana.page.keyboard.press('Escape')
    await acceptInvitation(budi.page, 'Ana note for Budi')
    assert.equal(keysOf(await dbGet(`notes/${budiNote}`)).length, 2)
    assert.equal(keysOf(await dbGet(`notes/${anaNote}`)).length, 2)

    await budi.page.goto(`${APP}/settings/account`)
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

    await ana.page.goto(`${APP}/settings/account`)
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
    await acceptInvitation(ana.page, 'Budi plain after opt-out')
    assert.ok(await sees(ana.page, 'Budi plain after opt-out'))
    await createNote(ana.page, 'Ana second secret')
    const ask = await shareWith(ana.page, BUDI, 'Read only')
    assert.ok(await ask.getByText(/hasn't turned on encryption/).isVisible())
    await ask.getByRole('button', { name: 'Share without encryption' }).click()
    await ana.page.waitForTimeout(2500)
    await ana.page.keyboard.press('Escape')
    await acceptInvitation(budi.page, 'Ana second secret')
    assert.ok(await sees(budi.page, 'Ana second secret'))

    await budi.page.goto(`${APP}/settings/account`)
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

  test('a new account can go without encryption', async () => {
    const { page } = await newDevice(browser)
    await signUp(page, 'Gita', 'gita@example.com')
    await skipEncryptionSetup(page)
    const gitaUid = await uidOf('gita@example.com')
    const profile = await dbGet(`users/${gitaUid}`)
    assert.equal(profile.encryptionRequired?.booleanValue, false)
    assert.ok(!profile.publicKey, 'no keys')

    // Stored plain, and not asked again on the next visit.
    await createNote(page, 'Gita plain note')
    const note = (await dbList('notes')).find(
      (item) => item.fields.owner?.stringValue === gitaUid,
    )
    assert.equal(note.fields.title?.stringValue, 'Gita plain note')
    await page.goto(`${APP}/notes`)
    await page.waitForTimeout(3000)
    assert.equal(await page.getByText('Protect your data').count(), 0)

    // A book's summary (what its card shows) is saved with its entries.
    await page.goto(`${APP}/finances/create`)
    await page.locator('textarea[name=title]').fill('Gita book')
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForURL(/\/finances\/(?!create)/, { timeout: 30_000 })
    const bookId = new URL(page.url()).pathname.split('/').pop()
    await page.getByRole('button', { name: 'Add entry' }).click()
    await page.locator('input[name=description]').fill('Gita lunch')
    await page.locator('#finance-entry-amount').fill('50000')
    await page.getByRole('combobox', { name: 'Category' }).click()
    await page.getByRole('option', { name: 'Food & drinks' }).click()
    await page
      .locator('form')
      .getByRole('button', { name: 'Save' })
      .last()
      .click()
    const book = await dbGetWhen(
      `finances/${bookId}`,
      (fields) => fields?.summary?.mapValue?.fields?.count?.integerValue === '1',
    )
    const summary = book.summary.mapValue.fields
    assert.equal(Number(summary.expense.integerValue), 50_000)
    assert.equal(
      summary.recent.arrayValue.values[0].mapValue.fields.description
        .stringValue,
      'Gita lunch',
    )
    await page.goto(`${APP}/finances`)
    await page.getByText('Gita lunch').waitFor({ timeout: 15_000 })
    await page.context().close()
  })

  test('the share dialog suggests people already shared with', async () => {
    const eko = await newDevice(browser)
    await signUp(eko.page, 'Eko', 'eko@example.com')
    await skipEncryptionSetup(eko.page)
    const dewi = await newDevice(browser)
    await signUp(dewi.page, 'Dewi', 'dewi@example.com')
    await skipEncryptionSetup(dewi.page)

    await createNote(dewi.page, 'Dewi first note')
    await shareWith(dewi.page, 'eko@example.com', 'Read only')
    await dewi.page.keyboard.press('Escape')

    // Another note: Eko is suggested, and choosing him finds him.
    await createNote(dewi.page, 'Dewi second note')
    await dewi.page
      .getByRole('button', { name: 'Share', exact: true })
      .first()
      .click()
    const dialog = dewi.page.getByRole('dialog')
    await dialog.getByText('Recent').waitFor({ timeout: 15_000 })
    await dialog.getByRole('button', { name: /eko@example\.com/ }).click()
    await dialog.getByText('eko@example.com').waitFor()
    assert.equal(
      await dialog.locator('input[name=user]').inputValue(),
      'eko@example.com',
    )
    await dialog.getByRole('combobox').last().waitFor()
    await eko.context.close()
    await dewi.context.close()
  })

  test('sharing is an invitation: nothing is shared until it is accepted', async () => {
    const gani = await newDevice(browser)
    await signUp(gani.page, 'Gani', 'gani@example.com')
    await skipEncryptionSetup(gani.page)
    const fina = await newDevice(browser)
    await signUp(fina.page, 'Fina', 'fina@example.com')
    await skipEncryptionSetup(fina.page)
    const ganiUid = await uidOf('gani@example.com')

    const plan = await createNote(fina.page, 'Fina plan')
    await shareWith(fina.page, 'gani@example.com', 'Read only')
    await fina.page
      .getByText(/Invited/)
      .first()
      .waitFor()
    await fina.page.keyboard.press('Escape')
    const diary = await createNote(fina.page, 'Fina diary')
    await shareWith(fina.page, 'gani@example.com', 'Read only')
    await fina.page.keyboard.press('Escape')
    for (const id of [plan, diary]) {
      const stored = await dbGet(`notes/${id}`)
      assert.ok(!readersOf(stored).includes(ganiUid), 'no access yet')
    }

    // Both wait for Gani; declining one removes it for good.
    const invitation = (title) =>
      gani.page.getByRole('listitem').filter({ hasText: title })
    await gani.page.goto(`${APP}/notes`)
    await invitation('Fina diary').waitFor({ timeout: 30_000 })
    await invitation('Fina diary')
      .getByRole('button', { name: 'Decline' })
      .click()
    await invitation('Fina diary').waitFor({ state: 'hidden' })
    const declined = await dbGetWhen(
      `notes/${diary}`,
      (fields) => !JSON.stringify(fields?.invites ?? {}).includes(ganiUid),
    )
    assert.ok(!readersOf(declined).includes(ganiUid))
    assert.ok(
      !JSON.stringify(declined.invites ?? {}).includes(ganiUid),
      'the invitation is gone',
    )

    // Accepting opens it, with exactly the access offered.
    await invitation('Fina plan')
      .getByRole('button', { name: 'Accept' })
      .click()
    await gani.page.waitForURL(new RegExp(`/notes/${plan}`), {
      timeout: 30_000,
    })
    const accepted = await dbGetWhen(`notes/${plan}`, (fields) =>
      readersOf(fields).includes(ganiUid),
    )
    assert.ok(readersOf(accepted).includes(ganiUid))
    const writers = (
      accepted.permissions.mapValue.fields.write.arrayValue.values ?? []
    ).map((value) => value.stringValue)
    assert.ok(!writers.includes(ganiUid), 'read only, as offered')
    assert.ok(await sees(gani.page, 'Fina plan'))
    assert.ok(!(await sees(gani.page, 'Fina diary')))
    await gani.context.close()
    await fina.context.close()
  })

  test('archiving tidies only your own list', async () => {
    const indra = await newDevice(browser)
    await signUp(indra.page, 'Indra', 'indra@example.com')
    await skipEncryptionSetup(indra.page)
    const hana = await newDevice(browser)
    await signUp(hana.page, 'Hana', 'hana@example.com')
    await skipEncryptionSetup(hana.page)
    const hanaUid = await uidOf('hana@example.com')

    const id = await createNote(hana.page, 'Hana old idea')
    await shareWith(hana.page, 'indra@example.com', 'Read only')
    await hana.page.keyboard.press('Escape')
    await acceptInvitation(indra.page, 'Hana old idea')
    const before = await dbGet(`notes/${id}`)

    await hana.page.goto(`${APP}/notes`)
    await hana.page
      .getByText('Hana old idea')
      .first()
      .waitFor({ timeout: 30_000 })
    await hana.page
      .locator('div')
      .filter({ has: hana.page.getByText('Hana old idea') })
      .getByRole('button', { name: 'Archive' })
      .last()
      .click()
    await hana.page.getByText('Archived (1)').waitFor({ timeout: 15_000 })
    assert.equal(
      await hana.page.getByText('Hana old idea').count(),
      0,
      'out of the main list',
    )
    const stored = await dbGetWhen(
      `notes/${id}`,
      (fields) => !!fields?.archivedBy?.arrayValue?.values,
    )
    assert.deepEqual(
      stored.archivedBy.arrayValue.values.map((value) => value.stringValue),
      [hanaUid],
    )
    assert.deepEqual(
      stored.updatedAt,
      before.updatedAt,
      "archiving isn't an edit",
    )
    assert.ok(await sees(indra.page, 'Hana old idea'), 'still in his list')

    // Folded away, and back with Undo.
    await hana.page.getByText('Archived (1)').click()
    await hana.page.getByText('Hana old idea').first().waitFor()
    await hana.page
      .getByRole('region', { name: /Notifications/ })
      .getByRole('button', { name: 'Undo' })
      .click()
    await hana.page.getByText('Archived (1)').waitFor({ state: 'hidden' })
    await indra.context.close()
    await hana.context.close()
  })

  test('blocking stops invitations until unblocked', async () => {
    const jaya = await newDevice(browser)
    await signUp(jaya.page, 'Jaya', 'jaya@example.com')
    await skipEncryptionSetup(jaya.page)
    const kiki = await newDevice(browser)
    await signUp(kiki.page, 'Kiki', 'kiki@example.com')
    await skipEncryptionSetup(kiki.page)
    const jayaUid = await uidOf('jaya@example.com')
    const kikiUid = await uidOf('kiki@example.com')

    await createNote(kiki.page, 'Kiki spam one')
    await shareWith(kiki.page, 'jaya@example.com', 'Read only')
    await kiki.page.keyboard.press('Escape')
    const invitation = (title) =>
      jaya.page.getByRole('listitem').filter({ hasText: title })
    await jaya.page.goto(`${APP}/notes`)
    await invitation('Kiki spam one')
      .getByRole('button', { name: 'Block' })
      .click({ timeout: 30_000 })
    await invitation('Kiki spam one').waitFor({ state: 'hidden' })
    assert.ok(
      await dbGetWhen(
        `users/${jayaUid}/blocked/${kikiUid}`,
        (fields) => !!fields,
      ),
      'blocked',
    )

    // Kiki can't invite Jaya again, and isn't told why.
    const second = await createNote(kiki.page, 'Kiki spam two')
    const dialog = await shareWith(kiki.page, 'jaya@example.com', 'Read only')
    await dialog
      .getByText(/jaya@example\.com can.t be invited right now/)
      .waitFor({ timeout: 15_000 })
    // A new search clears it.
    await dialog.locator('input[name=user]').fill('nobody@example.com')
    await dialog.locator('input[name=user]').press('Enter')
    await dialog.getByText(/No one uses Catat Saja with nobody/).waitFor()
    assert.equal(await dialog.getByText(/can.t be invited/).count(), 0)
    await kiki.page.keyboard.press('Escape')
    assert.ok(
      !JSON.stringify((await dbGet(`notes/${second}`)).invites ?? {}).includes(
        jayaUid,
      ),
    )

    // Unblocked in the settings: invitations come again.
    await jaya.page.goto(`${APP}/settings/account`)
    await jaya.page.getByRole('button', { name: 'Unblock' }).click()
    await jaya.page.getByText(/You haven.t blocked anyone/).waitFor()
    await kiki.page.goto(`${APP}/notes/${second}`)
    await kiki.page.locator('textarea[name=title]').waitFor()
    await shareWith(kiki.page, 'jaya@example.com', 'Read only')
    await kiki.page.keyboard.press('Escape')
    await jaya.page.goto(`${APP}/notes`)
    await invitation('Kiki spam two').waitFor({ timeout: 30_000 })
    await jaya.context.close()
    await kiki.context.close()
  })

  test("a book's entries are kept in month documents", async () => {
    const monthsOf = (id) => dbList(`finances/${id}/months`)
    const addEntry = async (page, description) => {
      await page.getByRole('button', { name: 'Add entry' }).click()
      await page.locator('input[name=description]').fill(description)
      await page.locator('#finance-entry-amount').fill('50000')
      await page.getByRole('combobox', { name: 'Category' }).click()
      await page.getByRole('option', { name: 'Food & drinks' }).click()
      await page
        .locator('form')
        .getByRole('button', { name: 'Save' })
        .last()
        .click()
    }
    const opensWith = async (page, id, text) => {
      await page.goto(`${APP}/finances/${id}`)
      await page.getByText(text).first().waitFor({ timeout: 30_000 })
    }

    // An encrypted book: its months are blobs, with ids that don't show the
    // month, and the book keeps no entries.
    const lina = await newDevice(browser)
    await signUp(lina.page, 'Lina', 'lina@example.com')
    await lina.page.getByText('Protect your data').waitFor({ timeout: 30_000 })
    await setUpEncryption(lina.page, 'lina passphrase 1')
    await lina.page.goto(`${APP}/finances/create`)
    await lina.page.locator('textarea[name=title]').fill('Lina book')
    await lina.page.getByRole('button', { name: 'Save' }).click()
    await lina.page.waitForURL(/\/finances\/(?!create)/, { timeout: 30_000 })
    const bookId = new URL(lina.page.url()).pathname.split('/').pop()
    await addEntry(lina.page, 'Lina lunch')
    await lina.page.waitForTimeout(4000)
    const book = await dbGet(`finances/${bookId}`)
    assert.equal(book.entryStore?.integerValue, '2')
    assert.ok(book.encrypted && !book.content, 'no entries in the book')
    let months = await monthsOf(bookId)
    assert.equal(months.length, 1)
    assert.deepEqual(Object.keys(months[0].fields), ['encrypted'])
    assert.doesNotMatch(months[0].id, /^\d{4}-\d{2}$/, 'month not readable')
    assert.ok(!JSON.stringify(months).includes('Lina lunch'), 'encrypted')

    // Shared, then the person removed: the months get the new key (and new
    // ids) in the same write, and still open for the owner.
    const mira = await newDevice(browser)
    await signUp(mira.page, 'Mira', 'mira@example.com')
    await mira.page.getByText('Protect your data').waitFor({ timeout: 30_000 })
    await setUpEncryption(mira.page, 'mira passphrase 1')
    await lina.page.goto(`${APP}/finances/${bookId}`)
    await lina.page.getByText('Lina lunch').waitFor({ timeout: 30_000 })
    await shareWith(lina.page, 'mira@example.com', 'Read and write')
    await lina.page.keyboard.press('Escape')
    await acceptInvitation(mira.page, 'Lina book')
    await opensWith(mira.page, bookId, 'Lina lunch')
    await addEntry(mira.page, 'Mira dinner')
    await opensWith(lina.page, bookId, 'Mira dinner')

    const before = months[0].id
    await lina.page
      .getByRole('button', { name: /^Shared with/ })
      .first()
      .click()
    await lina.page
      .getByRole('dialog')
      .getByRole('button', { name: 'Remove mira@example.com' })
      .click()
    await lina.page.waitForTimeout(3000)
    await lina.page.keyboard.press('Escape')
    months = await monthsOf(bookId)
    assert.equal(months.length, 1)
    assert.notEqual(months[0].id, before, 'renamed under the new key')
    await opensWith(lina.page, bookId, 'Mira dinner')

    // Turning encryption off stores the months plain with the book, and on
    // again encrypts them again.
    await lina.page.goto(`${APP}/settings/account`)
    await lina.page.getByRole('button', { name: 'Turn off encryption' }).click()
    const off = lina.page.getByRole('dialog')
    await off.locator('input[name=passphrase]').fill('lina passphrase 1')
    await off.getByRole('button', { name: 'Turn off encryption' }).click()
    await lina.page
      .getByText('Encryption turned off', { exact: true })
      .waitFor({ timeout: 30_000 })
    assert.equal(
      (await dbGet(`finances/${bookId}`)).title?.stringValue,
      'Lina book',
    )
    months = await monthsOf(bookId)
    assert.equal(months.length, 1)
    assert.match(months[0].id, /^\d{4}-\d{2}$/)
    assert.ok(JSON.stringify(months).includes('Mira dinner'), 'plain again')

    await lina.page
      .getByRole('button', { name: 'Turn on encryption' })
      .first()
      .click()
    await setUpEncryption(
      lina.page,
      'lina passphrase 2',
      lina.page.getByRole('dialog'),
    )
    await lina.page.waitForTimeout(6000)
    months = await monthsOf(bookId)
    assert.equal(months.length, 1)
    assert.deepEqual(Object.keys(months[0].fields), ['encrypted'])
    assert.ok(!JSON.stringify(months).includes('Mira dinner'), 'encrypted')
    await opensWith(lina.page, bookId, 'Mira dinner')
    await lina.context.close()
    await mira.context.close()

    // A book from before month documents moves into them when it is opened
    // by someone who can change it.
    const nanda = await newDevice(browser)
    await signUp(nanda.page, 'Nanda', 'nanda@example.com')
    await skipEncryptionSetup(nanda.page)
    const nandaUid = await uidOf('nanda@example.com')
    const entry = (id, date, description) => ({
      mapValue: {
        fields: {
          id: { stringValue: id },
          date: { stringValue: date },
          type: { stringValue: 'expense' },
          category: { stringValue: 'fnb' },
          description: { stringValue: description },
          quantity: { integerValue: '1' },
          amount: { integerValue: '35000' },
          rate: { integerValue: '1' },
          currency: {
            mapValue: {
              fields: {
                code: { stringValue: 'IDR' },
                symbol: { stringValue: 'Rp' },
                maximumFractionDigits: { integerValue: '0' },
              },
            },
          },
        },
      },
    })
    const people = { arrayValue: { values: [{ stringValue: nandaUid }] } }
    await dbPatch('finances/oldbook', {
      owner: { stringValue: nandaUid },
      permissions: { mapValue: { fields: { read: people, write: people } } },
      title: { stringValue: 'Old book' },
      createdAt: { timestampValue: new Date().toISOString() },
      content: {
        arrayValue: {
          values: [
            entry('e1', '2026-08-30', 'August lunch'),
            entry('e2', '2026-09-02', 'September lunch'),
          ],
        },
      },
    })
    await opensWith(nanda.page, 'oldbook', 'September lunch')
    const moved = await dbGetWhen(
      'finances/oldbook',
      (fields) => fields?.entryStore?.integerValue === '2',
    )
    assert.ok(!moved.content, 'entries moved out of the book')
    months = await monthsOf('oldbook')
    assert.deepEqual(
      months.map((month) => month.id).toSorted(),
      ['2026-08', '2026-09'],
    )
    assert.equal(
      moved.summary.mapValue.fields.count.integerValue,
      '2',
      'summary written',
    )
    await nanda.page.goto(`${APP}/finances`)
    await nanda.page.getByText('September lunch').waitFor({ timeout: 15_000 })

    // From the list, which has only summaries, copying and deleting read the
    // months first: the copy and the book brought back by Undo keep them.
    const card = (title) =>
      nanda.page
        .locator('.group\\/card')
        .filter({ has: nanda.page.getByRole('link', { name: title, exact: true }) })
    // What the page says (toasts, alerts), for a failure message.
    const said = () =>
      nanda.page.locator('[role=status], [role=alert], li[role=status]').allTextContents()
    const booksWith = async (count) => {
      for (let attempt = 0; attempt < 60; attempt++) {
        const books = (await dbList('finances')).filter(
          (item) => item.fields.owner?.stringValue === nandaUid,
        )
        if (books.length === count) return books
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
      assert.fail(`expected ${count} books; the page said: ${await said()}`)
    }
    const toast = (text) =>
      nanda.page
        .getByText(text, { exact: true })
        .first()
        .waitFor({ timeout: 30_000 })
        .catch(async () => assert.fail(`no "${text}"; the page said: ${await said()}`))
    const monthIdsOf = async (id) =>
      (await monthsOf(id)).map((month) => month.id).toSorted()

    await card('Old book').getByRole('button', { name: 'Duplicate' }).click()
    await toast('Book duplicated')
    const [copy] = (await booksWith(2)).filter((item) => item.id !== 'oldbook')
    assert.equal(copy.fields.title.stringValue, 'Old book (copy)')
    assert.deepEqual(await monthIdsOf(copy.id), ['2026-08', '2026-09'])

    await card('Old book').getByRole('button', { name: 'Delete' }).click()
    await nanda.page
      .getByRole('dialog')
      .getByRole('button', { name: 'Confirm' })
      .click()
    await toast('Book deleted')
    await nanda.page.getByRole('button', { name: 'Undo' }).click()
    const books = await booksWith(2)
    const restored = books.find(
      (item) => item.fields.title?.stringValue === 'Old book',
    )
    assert.ok(restored && restored.id !== 'oldbook', 'brought back')
    assert.deepEqual(await monthsOf('oldbook'), [], 'old months deleted')
    assert.deepEqual(await monthIdsOf(restored.id), ['2026-08', '2026-09'])
    await nanda.context.close()
  })
})
