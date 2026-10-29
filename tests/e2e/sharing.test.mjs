// Independent sharing and finance scenarios, run on their own CI runner.
// Each scenario creates its own accounts; keep the dependent Ana/Budi/Cici
// sequence in encryption.test.mjs. Locally, suites run sequentially.

import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'

import {
  APP,
  acceptInvitation,
  createNote,
  dbGet,
  dbGetWhen,
  dbList,
  dbListWhen,
  dbPatch,
  filePushKey,
  launch,
  newDevice,
  openSealed,
  readersOf,
  sees,
  setUpEncryption,
  shareWith,
  signUp,
  skipEncryptionSetup,
  startApp,
  stopApp,
  uidOf,
  warmUpApp,
} from './helpers.mjs'

let server
let browser

before(async () => {
  server = await startApp()
  browser = await launch()
  await warmUpApp(browser)
})

after(async () => {
  await browser?.close()
  stopApp(server)
})

describe('sharing and finance storage', () => {
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

    // A book's summary (what its card and search show) is saved with its
    // entries.
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
      (fields) =>
        fields?.summary?.mapValue?.fields?.count?.integerValue === '1',
    )
    const summary = book.summary.mapValue.fields
    assert.equal(Number(summary.expense.integerValue), 50_000)
    assert.equal(
      summary.recent.arrayValue.values[0].mapValue.fields.description
        .stringValue,
      'Gita lunch',
    )
    // Every description once, so search finds the book by older entries.
    assert.deepEqual(
      summary.descriptions.arrayValue.values.map((value) => value.stringValue),
      ['Gita lunch'],
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
    const readOnlyEditor = gani.page.getByRole('textbox', {
      name: 'Content',
      exact: true,
    })
    await readOnlyEditor.waitFor()
    assert.equal(await readOnlyEditor.getAttribute('contenteditable'), 'false')
    assert.equal(await readOnlyEditor.getAttribute('aria-readonly'), 'true')
    assert.equal(
      await gani.page
        .getByRole('button', { name: 'Format', exact: true })
        .count(),
      0,
    )
    await readOnlyEditor.click({ button: 'right' })
    assert.equal(
      await gani.page.getByRole('group', { name: 'Text formatting' }).count(),
      0,
    )
    const readOnlyTitle = gani.page.getByRole('textbox', {
      name: 'Title',
      exact: true,
    })
    assert.equal(await readOnlyTitle.getAttribute('readonly'), '')
    await readOnlyTitle.press('Control+s')
    assert.deepEqual(
      await dbGet(`notes/${plan}`),
      accepted,
      'reader shortcut changes nothing',
    )
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
      .getByRole('button', { name: 'Delete' })
      .last()
      .click()
    // Deleting offers archiving instead; there is no separate Archive button.
    await hana.page.getByRole('button', { name: 'Archive instead' }).click()
    // The closing dialog's title names the note until it is gone.
    await hana.page.getByRole('dialog').waitFor({ state: 'hidden' })
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

  test("an invitation's notification has the title sealed for the invited person's devices", async () => {
    const nina = await newDevice(browser)
    const oki = await newDevice(browser)
    await signUp(nina.page, 'Nina', 'nina@example.com')
    await skipEncryptionSetup(nina.page)
    await signUp(oki.page, 'Oki', 'oki@example.com')
    await skipEncryptionSetup(oki.page)
    const ninaUid = await uidOf('nina@example.com')
    const okiUid = await uidOf('oki@example.com')

    const okiKey = await filePushKey(oki.page, okiUid)

    await createNote(nina.page, 'Nina weekend plans')
    await shareWith(nina.page, 'oki@example.com', 'Read only')
    const messages = await dbListWhen('pushMessages', (documents) =>
      documents.some((message) => message.fields.to?.stringValue === okiUid),
    )
    const message = messages.find(
      (item) => item.fields.to?.stringValue === okiUid,
    ).fields
    assert.equal(message.kind.stringValue, 'invitation')
    assert.equal(message.from.stringValue, ninaUid)
    assert.equal(message.collection.stringValue, 'notes')
    assert.ok(!JSON.stringify(message).includes('Nina weekend plans'))

    const title = await openSealed(
      oki.page,
      message.sealed.mapValue.fields.phone.stringValue,
      okiKey,
    )
    assert.equal(title, 'Nina weekend plans')
    await nina.context.close()
    await oki.context.close()
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
    await acceptInvitation(mira.page, 'Lina book', 'finances')
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
  })

  test("a book's own groups of categories, budgets, savings goals and keywords are Plus, encrypted and shared", async () => {
    const openAnalysis = async (page, id) => {
      await page.goto(`${APP}/finances/${id}`)
      await page
        .getByRole('button', { name: 'Analysis', exact: true })
        .click({ timeout: 30_000 })
    }
    const groups = (page) =>
      page.locator('section').filter({ hasText: 'Your groups' })
    const budgets = (page) =>
      page.locator('section').filter({ hasText: 'Budgets' })
    const goals = (page) =>
      page.locator('section').filter({ hasText: 'Savings goals' })
    const keywords = (page) =>
      page.locator('section').filter({ hasText: 'By keyword' })

    const rani = await newDevice(browser)
    await signUp(rani.page, 'Rani', 'rani@example.com')
    await rani.page.getByText('Protect your data').waitFor({ timeout: 30_000 })
    await setUpEncryption(rani.page, 'rani passphrase 1')
    await rani.page.goto(`${APP}/finances/create`)
    await rani.page.locator('textarea[name=title]').fill('Rani book')
    await rani.page.getByRole('button', { name: 'Save' }).click()
    await rani.page.waitForURL(/\/finances\/(?!create)/, { timeout: 30_000 })
    const bookId = new URL(rani.page.url()).pathname.split('/').pop()
    await rani.page.getByRole('button', { name: 'Add entry' }).click()
    await rani.page.locator('input[name=description]').fill('Rani lunch')
    await rani.page.locator('#finance-entry-amount').fill('50000')
    await rani.page.getByRole('combobox', { name: 'Category' }).click()
    await rani.page.getByRole('option', { name: 'Food & drinks' }).click()
    await rani.page
      .locator('form')
      .getByRole('button', { name: 'Save' })
      .last()
      .click()
    await rani.page.waitForTimeout(3000)

    // Without Plus: told what it adds, and nothing to change.
    await openAnalysis(rani.page, bookId)
    await groups(rani.page)
      .getByText('Plus · coming soon')
      .waitFor({ timeout: 15_000 })
    assert.equal(
      await rani.page.getByRole('button', { name: 'Make groups' }).count(),
      0,
    )
    await budgets(rani.page).getByText('Plus · coming soon').waitFor()
    assert.equal(
      await rani.page.getByRole('button', { name: 'Set budgets' }).count(),
      0,
    )
    await goals(rani.page).getByText('Plus · coming soon').waitFor()
    await keywords(rani.page).getByText('Plus · coming soon').waitFor()

    // Plus, given by hand as the console would: groups can be made, and are
    // sealed with the book.
    const raniUid = await uidOf('rani@example.com')
    await dbPatch(`users/${raniUid}`, {
      plan: { stringValue: 'plus' },
      planEndsAt: { timestampValue: '2099-01-01T00:00:00Z' },
    })
    const sealed = (await dbGet(`finances/${bookId}`)).encrypted.mapValue.fields
      .ct.stringValue
    await openAnalysis(rani.page, bookId)
    await rani.page.getByRole('button', { name: 'Make groups' }).click()
    const editor = rani.page.getByRole('dialog')
    await editor.getByRole('button', { name: 'Add group' }).click()
    await editor.getByLabel('Group name').fill('Needs')
    await editor
      .getByRole('combobox', { name: 'Group for Food & drinks' })
      .click()
    await rani.page.getByRole('option', { name: 'Needs' }).click()
    await rani.page.keyboard.press('Escape')
    const book = await dbGetWhen(
      `finances/${bookId}`,
      (fields) => fields?.encrypted.mapValue.fields.ct.stringValue !== sealed,
    )
    assert.ok(!book.categoryGroups, 'no readable groups')
    assert.ok(!JSON.stringify(book).includes('Needs'), 'encrypted')
    await openAnalysis(rani.page, bookId)
    await groups(rani.page).getByText('Needs').waitFor({ timeout: 15_000 })

    // Budgets for the whole book, on all spending and on food: the period
    // chosen once applies to both, and what is left of each is sealed too.
    const sealedGroups = (await dbGet(`finances/${bookId}`)).encrypted.mapValue
      .fields.ct.stringValue
    await rani.page.getByRole('button', { name: 'Set budgets' }).click()
    const budgetEditor = rani.page.getByRole('dialog')
    await budgetEditor.getByRole('button', { name: 'Add budget' }).click()
    await budgetEditor.getByLabel('Limit for All spending').fill('900000')
    await budgetEditor.getByRole('combobox', { name: 'Budget period' }).click()
    await rani.page.getByRole('option', { name: 'Whole book' }).click()
    await budgetEditor.getByRole('button', { name: 'Add budget' }).click()
    await budgetEditor.getByLabel('Limit for Food & drinks').fill('80000')
    await rani.page.keyboard.press('Escape')
    const budgeted = await dbGetWhen(
      `finances/${bookId}`,
      (fields) =>
        fields?.encrypted.mapValue.fields.ct.stringValue !== sealedGroups,
    )
    assert.ok(!budgeted.budgets, 'no readable budgets')
    await openAnalysis(rani.page, bookId)
    await budgets(rani.page)
      .getByText(/30[.,]000 left/)
      .waitFor({ timeout: 15_000 })
    await budgets(rani.page).getByText('Whole book').waitFor()

    // A savings goal half a year away and a payday: what to put aside each
    // month, sealed too.
    const sealedBudgets = (await dbGet(`finances/${bookId}`)).encrypted.mapValue
      .fields.ct.stringValue
    await rani.page.getByRole('button', { name: 'Add goals' }).click()
    const goalEditor = rani.page.getByRole('dialog')
    await goalEditor.getByRole('combobox', { name: 'Payday' }).click()
    await rani.page.getByRole('option', { name: 'Day 25', exact: true }).click()
    await goalEditor.getByRole('button', { name: 'Add goal' }).click()
    await goalEditor.getByLabel('Goal', { exact: true }).fill('Rani laptop')
    await goalEditor.getByLabel('Amount', { exact: true }).fill('1200000')
    await rani.page.keyboard.press('Escape')
    const planned = await dbGetWhen(
      `finances/${bookId}`,
      (fields) =>
        fields?.encrypted.mapValue.fields.ct.stringValue !== sealedBudgets,
    )
    assert.ok(!planned.goals && !planned.payday, 'no readable goals')
    assert.ok(!JSON.stringify(planned).includes('Rani laptop'), 'encrypted')
    await openAnalysis(rani.page, bookId)
    await goals(rani.page)
      .getByText(/^Save .+ a month$/)
      .waitFor({ timeout: 15_000 })

    // A keyword found in the lunch entry's description, sealed too.
    const sealedGoals = (await dbGet(`finances/${bookId}`)).encrypted.mapValue
      .fields.ct.stringValue
    await rani.page.getByRole('button', { name: 'Add keywords' }).click()
    const keywordEditor = rani.page.getByRole('dialog')
    await keywordEditor.getByRole('button', { name: 'Add keyword' }).click()
    await keywordEditor
      .getByLabel('Keyword', { exact: true })
      .fill('LUNCH, dinner')
    await rani.page.keyboard.press('Escape')
    const tagged = await dbGetWhen(
      `finances/${bookId}`,
      (fields) =>
        fields?.encrypted.mapValue.fields.ct.stringValue !== sealedGoals,
    )
    assert.ok(!tagged.keywords, 'no readable keywords')
    assert.ok(!JSON.stringify(tagged).includes('dinner'), 'encrypted')
    await openAnalysis(rani.page, bookId)
    await keywords(rani.page).getByText('1 entry').waitFor({ timeout: 15_000 })

    // Someone it is shared with to read sees the groups, and can't change
    // them.
    const sari = await newDevice(browser)
    await signUp(sari.page, 'Sari', 'sari@example.com')
    await sari.page.getByText('Protect your data').waitFor({ timeout: 30_000 })
    await setUpEncryption(sari.page, 'sari passphrase 1')
    await shareWith(rani.page, 'sari@example.com', 'Read only')
    await rani.page.keyboard.press('Escape')
    await acceptInvitation(sari.page, 'Rani book', 'finances')
    await openAnalysis(sari.page, bookId)
    await groups(sari.page).getByText('Needs').waitFor({ timeout: 30_000 })
    assert.equal(
      await sari.page.getByRole('button', { name: 'Edit groups' }).count(),
      0,
    )
    await budgets(sari.page)
      .getByText(/30[.,]000 left/)
      .waitFor()
    assert.equal(
      await sari.page.getByRole('button', { name: 'Edit budgets' }).count(),
      0,
    )
    await goals(sari.page).getByText('Rani laptop').waitFor()
    await goals(sari.page)
      .getByText(/^Save .+ a month$/)
      .waitFor()
    assert.equal(
      await sari.page.getByRole('button', { name: 'Edit goals' }).count(),
      0,
    )
    await keywords(sari.page).getByText('LUNCH, dinner').waitFor()
    assert.equal(
      await sari.page.getByRole('button', { name: 'Edit keywords' }).count(),
      0,
    )
    await rani.context.close()
    await sari.context.close()
  })

  test("a Plus owner's book lets a free writer set goals and link expenses to them", async () => {
    const uli = await newDevice(browser)
    await signUp(uli.page, 'Uli', 'uli@example.com')
    await skipEncryptionSetup(uli.page)
    await dbPatch(`users/${await uidOf('uli@example.com')}`, {
      plan: { stringValue: 'plus' },
      planEndsAt: { timestampValue: '2099-01-01T00:00:00Z' },
    })
    await uli.page.goto(`${APP}/finances/create`)
    await uli.page.locator('textarea[name=title]').fill('Uli book')
    await uli.page.getByRole('button', { name: 'Save' }).click()
    await uli.page.waitForURL(/\/finances\/(?!create)/, { timeout: 30_000 })
    const bookId = new URL(uli.page.url()).pathname.split('/').pop()

    // Vino has no Plus; Uli's Plus covers the book.
    const vino = await newDevice(browser)
    await signUp(vino.page, 'Vino', 'vino@example.com')
    await skipEncryptionSetup(vino.page)
    await shareWith(uli.page, 'vino@example.com', 'Read and write')
    await uli.page.keyboard.press('Escape')
    await acceptInvitation(vino.page, 'Uli book', 'finances')

    // The analysis shows once the book has an entry.
    const addEntry = async (description, amount, goal) => {
      // After a save the form stays open for the next entry.
      const add = vino.page.getByRole('button', { name: 'Add entry' })
      if (await add.isVisible()) await add.click()
      await vino.page.locator('input[name=description]').fill(description)
      await vino.page.locator('#finance-entry-amount').fill(amount)
      await vino.page.getByRole('combobox', { name: 'Category' }).click()
      await vino.page.getByRole('option', { name: 'Food & drinks' }).click()
      if (goal) {
        await vino.page.getByRole('combobox', { name: 'Savings goal' }).click()
        await vino.page.getByRole('option', { name: goal }).click()
      }
      await vino.page
        .locator('form')
        .getByRole('button', { name: 'Save' })
        .last()
        .click()
    }
    await vino.page.goto(`${APP}/finances/${bookId}`)
    await vino.page
      .getByRole('button', { name: 'Add entry' })
      .waitFor({ timeout: 30_000 })
    await addEntry('Vino lunch', '50000')
    await vino.page.waitForTimeout(3000)
    await vino.page
      .getByRole('button', { name: 'Analysis', exact: true })
      .click({ timeout: 30_000 })
    await vino.page
      .getByRole('button', { name: 'Add goals' })
      .click({ timeout: 15_000 })
    const goalEditor = vino.page.getByRole('dialog')
    await goalEditor.getByRole('button', { name: 'Add goal' }).click()
    await goalEditor.getByLabel('Goal', { exact: true }).fill('Uli fridge')
    await goalEditor.getByLabel('Amount', { exact: true }).fill('1000000')
    await vino.page.keyboard.press('Escape')
    await dbGetWhen(`finances/${bookId}`, (fields) =>
      JSON.stringify(fields?.goals ?? '').includes('Uli fridge'),
    )

    // An expense paid toward the goal counts as realized.
    await vino.page
      .getByRole('button', { name: 'Entries', exact: true })
      .click()
    await addEntry('Fridge deposit', '400000', 'Uli fridge')
    const months = await dbListWhen(`finances/${bookId}/months`, (docs) =>
      JSON.stringify(docs).includes('Fridge deposit'),
    )
    assert.ok(JSON.stringify(months).includes('"goal"'), 'linked')

    await uli.page.goto(`${APP}/finances/${bookId}`)
    await uli.page
      .getByRole('button', { name: 'Analysis', exact: true })
      .click({ timeout: 30_000 })
    await uli.page
      .getByText(/400[.,]000 of .*1[.,]000[.,]000 realized/)
      .waitFor({ timeout: 15_000 })
    await uli.context.close()
    await vino.context.close()
  })

  test('a recurring entry waits to be added or skipped each month, encrypted', async () => {
    const sari = await newDevice(browser)
    await signUp(sari.page, 'Sari', 'sari@example.com')
    await sari.page.getByText('Protect your data').waitFor({ timeout: 30_000 })
    await setUpEncryption(sari.page, 'sari passphrase 1')
    await sari.page.goto(`${APP}/finances/create`)
    await sari.page.locator('textarea[name=title]').fill('Sari book')
    await sari.page.getByRole('button', { name: 'Save' }).click()
    await sari.page.waitForURL(/\/finances\/(?!create)/, { timeout: 30_000 })
    const bookId = new URL(sari.page.url()).pathname.split('/').pop()
    const sealed = (await dbGet(`finances/${bookId}`)).encrypted.mapValue.fields
      .ct.stringValue

    // Rent paid on the 1st two months ago, made to repeat: last month's is
    // due, then this month's.
    const now = new Date()
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const typed = `01-${String(twoMonthsAgo.getMonth() + 1).padStart(2, '0')}-${twoMonthsAgo.getFullYear()}`
    await sari.page.getByRole('button', { name: 'Add entry' }).click()
    await sari.page.getByRole('textbox', { name: 'Date' }).fill(typed)
    await sari.page.locator('input[name=description]').fill('Sari rent')
    await sari.page.locator('#finance-entry-amount').fill('2000000')
    await sari.page.getByRole('combobox', { name: 'Category' }).click()
    await sari.page.getByRole('option', { name: 'Food & drinks' }).click()
    await sari.page
      .getByRole('checkbox', { name: 'Repeat every month' })
      .check()
    await sari.page
      .locator('form')
      .getByRole('button', { name: 'Save' })
      .last()
      .click()
    await sari.page.getByRole('button', { name: 'Cancel' }).click()

    const card = sari.page.locator('section').filter({ hasText: 'Recurring' })
    await card.getByText('Sari rent').waitFor({ timeout: 15_000 })
    await card.getByLabel('Amount of Sari rent').fill('2100000')
    await card.getByRole('button', { name: 'Add', exact: true }).click()
    await sari.page
      .getByRole('listitem')
      .filter({ hasText: /2[.,]100[.,]000/ })
      .first()
      .waitFor({ timeout: 15_000 })
    // This month's comes next, with the amount just added; skipped.
    await card.getByText(/^Due /).waitFor()
    await card
      .getByRole('button', { name: 'Skip Sari rent this month' })
      .click()
    await card.getByText(/^Next: Sari rent on /).waitFor()

    const saved = await dbGetWhen(
      `finances/${bookId}`,
      (fields) => fields?.encrypted.mapValue.fields.ct.stringValue !== sealed,
    )
    assert.ok(!saved.recurring, 'no readable recurring entries')
    await sari.page.waitForTimeout(3000)
    await sari.page.reload()
    await card.getByText(/^Next: Sari rent on /).waitFor({ timeout: 30_000 })
    assert.equal(
      await sari.page
        .locator('[data-entry-id]', { hasText: 'Sari rent' })
        .count(),
      2,
    )
    await sari.context.close()
  })
})
