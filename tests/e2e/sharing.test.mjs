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
  launch,
  newDevice,
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
    await page.goto(`${APP}/finances`)
    await page.getByText('Gita lunch').waitFor({ timeout: 15_000 })
    await page.context().close()
  })

  test('note formatting opens by button and right click, not long touch', async () => {
    const { page, context } = await newDevice(browser, { hasTouch: true })
    try {
      await signUp(
        page,
        'Formatting writer',
        `note-format-${Date.now()}@example.com`,
      )
      await setUpEncryption(page, 'formatting passphrase')
      await page.goto(`${APP}/notes/create`)
      await page
        .getByRole('textbox', { name: 'Title', exact: true })
        .fill('Formatted note')
      const editor = page.getByRole('textbox', { name: 'Content', exact: true })
      const toggle = page.getByRole('button', { name: 'Format', exact: true })
      // The right-click menu is a popup; the Format button shows a row in the
      // page's toolbar that stays open. Both are named "Text formatting".
      const menu = page
        .getByRole('dialog', { name: 'Text formatting', exact: true })
        .getByRole('group', { name: 'Text formatting', exact: true })
      const bar = page.locator(
        '[role="group"][aria-label="Text formatting"]:not([role="dialog"] *)',
      )
      const choose = (label) =>
        bar.getByRole('button', { name: label, exact: true }).click()
      await editor.click()
      await page.keyboard.insertText('Project plan')
      // Select text rather than ProseMirror's whole-document selection.
      await page.keyboard.down('Shift')
      for (let index = 0; index < 'Project plan'.length; index++)
        await page.keyboard.press('ArrowLeft')
      await page.keyboard.up('Shift')
      assert.equal(
        await page.locator('.milkdown-toolbar').count(),
        0,
        'selection alone does not open a competing toolbar',
      )
      // Right click over the selected words, so the menu keeps the selection.
      await editor
        .getByText('Project plan', { exact: true })
        .click({ button: 'right', position: { x: 10, y: 8 } })
      await menu.getByRole('button', { name: 'Bold', exact: true }).click()
      await editor.locator('strong').waitFor()
      assert.equal(
        await editor.locator('strong').textContent(),
        'Project plan',
        'right click preserves the selected text',
      )

      await menu.waitFor({ state: 'hidden' })
      await toggle.click()
      await bar.waitFor()
      assert.equal(await toggle.getAttribute('aria-pressed'), 'true')
      await choose('Heading')
      assert.equal(await editor.locator('h1').textContent(), 'Project plan')
      await choose('Subheading')
      assert.equal(await editor.locator('h2').textContent(), 'Project plan')
      await choose('Normal text')
      assert.equal(await editor.locator('h1, h2').count(), 0)
      await choose('Bulleted list')
      await editor.locator('ul li').waitFor()
      await choose('Numbered list')
      await editor.locator('ol li').waitFor()
      await choose('Numbered list')
      assert.equal(
        await editor.locator('ul, ol').count(),
        0,
        'choosing the same list removes it',
      )

      await toggle.click()
      await bar.waitFor({ state: 'hidden' })
      assert.equal(await toggle.getAttribute('aria-pressed'), 'false')

      // Touch and hold is left to the phone, which selects text with it
      // and shows its own menu: the formatting menu must stay closed.
      await editor.click({ position: { x: 20, y: 10 } })
      const bounds = await editor.boundingBox()
      const point = { x: bounds.x + 20, y: bounds.y + 10 }
      const touch = await context.newCDPSession(page)
      await touch.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [point],
      })
      await page.waitForTimeout(900)
      await touch.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      })
      assert.equal(
        await menu.count(),
        0,
        'touch and hold leaves text selection to the phone',
      )

      await editor.press('ControlOrMeta+a')
      await toggle.click()
      await choose('Code')
      assert.equal(await editor.locator('code').textContent(), 'Project plan')
      await editor.press('Control+s')
      await page.waitForURL(/\/notes\/(?!create)/, { timeout: 30_000 })
      const id = new URL(page.url()).pathname.split('/').pop()
      const document = await dbGetWhen(
        `notes/${id}`,
        (fields) => !!fields?.encrypted,
      )
      assert.ok(
        document.encrypted && !document.content,
        'formatted content stays encrypted',
      )
      await page.reload()
      await editor.locator('code').waitFor()
      assert.equal(await editor.textContent(), 'Project plan')
    } finally {
      await context.close()
    }
  })

  for (const encrypted of [false, true]) {
    test(`note keyboard saving keeps the last words (${encrypted ? 'encrypted' : 'plain'})`, async () => {
      const { page, context } = await newDevice(browser)
      try {
        const email = `note-keyboard-${encrypted}-${Date.now()}@example.com`
        await signUp(page, 'Note writer', email)
        if (encrypted) await setUpEncryption(page, 'note writing passphrase')
        else await skipEncryptionSetup(page)
        const uid = await uidOf(email)
        await page.goto(`${APP}/notes/create`)
        const title = page.getByRole('textbox', { name: 'Title', exact: true })
        const editor = page.getByRole('textbox', {
          name: 'Content',
          exact: true,
        })
        await editor.waitFor()

        // An empty shortcut never creates a note. Enter moves from the
        // title into the real editor, which has an accessible name.
        await title.press('Control+s')
        assert.equal(new URL(page.url()).pathname, '/notes/create')
        await title.press('Enter')
        assert.equal(
          await editor.evaluate(
            (element) => element === document.activeElement,
          ),
          true,
        )
        await page.keyboard.insertText('Remember the milk')
        // Save before Milkdown's debounced form update can run.
        await page.keyboard.press('Control+s')
        await page.waitForURL(/\/notes\/(?!create)/, { timeout: 30_000 })
        const id = new URL(page.url()).pathname.split('/').pop()
        const url = page.url()
        const initial = await dbGetWhen(`notes/${id}`, (fields) =>
          encrypted
            ? !!fields?.encrypted
            : fields?.content?.stringValue?.includes('Remember the milk'),
        )
        assert.ok(initial)
        if (encrypted)
          assert.ok(
            !initial.title && !initial.content,
            'content stays encrypted',
          )
        else assert.equal(initial.title?.stringValue, '')

        // The other shortcut updates the same note, with the last words
        // still present after a reload (including encrypted notes).
        await editor.click()
        await page.keyboard.press('ControlOrMeta+End')
        await page.keyboard.insertText(' and bread')
        await page.keyboard.press('Meta+s')
        await page.getByText('Saved', { exact: true }).waitFor()
        await page.reload()
        await editor.waitFor()
        assert.match(await editor.textContent(), /Remember the milk and bread/)
        const ownNotes = (await dbList('notes')).filter(
          (item) => item.fields.owner?.stringValue === uid,
        )
        assert.equal(ownNotes.length, 1, 'saving does not duplicate the note')

        await page.goto(`${APP}/notes`)
        await page
          .getByRole('link', { name: 'Untitled note', exact: true })
          .click()
        await page.waitForURL(url)
        assert.match(await editor.textContent(), /Remember the milk and bread/)
      } finally {
        await context.close()
      }
    })
  }

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
  })
})
