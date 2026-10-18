// Interface behaviour that doesn't decide what is stored, shared or
// encrypted: editing tasks and notes, mobile taps, undo and redo. Run on its
// own CI runner and doesn't block a deploy (the other suites do). Each
// scenario creates its own accounts. Run against the Auth and Firestore
// emulators.
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { after, before, test } from 'node:test'

import {
  APP,
  dbGetWhen,
  dbList,
  dbListWhen,
  dbPatch,
  launch,
  newDevice,
  setUpEncryption,
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

const shows = (page, text) =>
  page.getByText(text).first().waitFor({ timeout: 30_000 })

for (const encrypted of [false, true]) {
  test(`task input survives adding, saving and leaving (${encrypted ? 'encrypted' : 'plain'})`, async () => {
    const { page, context } = await newDevice(browser)
    const email = `tasks-${encrypted}-${Date.now()}@example.com`
    await signUp(page, 'Task tester', email)
    if (encrypted) await setUpEncryption(page, 'tasks passphrase 1')
    else await skipEncryptionSetup(page)
    const uid = await uidOf(email)
    await page.goto(`${APP}/tasks/create`)
    const input = page.locator('textarea[name=item]')
    await input.fill('Buy rice')
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await page
      .getByRole('checkbox', { name: 'Buy rice', exact: true })
      .waitFor()
    assert.equal(await input.inputValue(), '')
    await input.fill('Buy vegetables')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await page.waitForURL(/\/tasks\/(?!create)/)
    const url = page.url()
    const id = url.split('/').pop()
    await page
      .getByRole('checkbox', { name: 'Buy vegetables', exact: true })
      .waitFor()
    // Immediate typing must reach the saved list, and title edits must not
    // consume unfinished text from the add field during idle autosave.
    const title = page.locator('textarea[name=title]')
    await input.fill('Buy fruit')
    await title.fill('Shopping')
    // An idle pause must keep unfinished text editable in the add field.
    await page.waitForTimeout(800)
    assert.equal(await input.inputValue(), 'Buy fruit')
    assert.equal(await page.getByRole('checkbox').count(), 2)
    await title.fill('')
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await page.waitForURL(/\/tasks$/)
    await page
      .getByRole('link', { name: 'Untitled task' })
      .waitFor({ state: 'attached' })
    await page.goto(url)
    await page
      .getByRole('checkbox', { name: 'Buy fruit', exact: true })
      .waitFor()
    assert.equal(await page.getByRole('checkbox').count(), 3)
    const clickItemText = async (index, caret) => {
      const text = page.locator(
        `[data-task-index="${index}"] button.cursor-text`,
      )
      const point = await text.evaluate((element, offset) => {
        const range = document.createRange()
        range.setStart(element.firstChild, offset)
        range.setEnd(element.firstChild, offset + 1)
        const rectangle = range.getBoundingClientRect()
        return {
          x: rectangle.left + 1,
          y: rectangle.top + rectangle.height / 2,
        }
      }, caret)
      await page.mouse.click(point.x, point.y)
      await page.waitForFunction(
        ({ index, caret }) => {
          const input = document.querySelector(
            `textarea[name="content.${index}.item"]`,
          )
          return (
            document.activeElement === input &&
            input.selectionStart === caret &&
            input.selectionEnd === caret
          )
        },
        { index, caret },
      )
    }
    await clickItemText(0, 4)
    const edit = page.locator('textarea[name="content.0.item"]')
    await edit.waitFor()
    assert.equal(await page.locator('textarea[name^="content."]').count(), 1)
    await edit.fill('Buy brown rice\nSecond line')
    await edit.press('ArrowLeft')
    await edit.press('ArrowUp')
    assert.equal(
      await edit.evaluate((element) => document.activeElement === element),
      true,
    )
    await page
      .getByRole('button', { name: 'Done editing', exact: true })
      .click()
    await clickItemText(0, 17)
    await edit.fill('Buy brown rice')
    await page
      .getByRole('button', { name: 'Done editing', exact: true })
      .click()
    await page
      .getByRole('checkbox', { name: 'Buy brown rice', exact: true })
      .click()
    await page.getByRole('heading', { name: 'Completed (1 of 3)' }).waitFor()
    await input.fill('Take bags\nBring wallet')
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await page
      .getByRole('checkbox', { name: 'Bring wallet', exact: true })
      .waitFor()
    await page.waitForTimeout(1000)
    await page.reload()
    await page
      .getByRole('checkbox', { name: 'Bring wallet', exact: true })
      .waitFor()
    assert.equal(await page.getByRole('checkbox').count(), 5)
    // Empty add input returns to the end of the last unfinished item.
    await input.focus()
    await input.press('Backspace')
    const lastEdit = page.locator('textarea[name="content.4.item"]')
    await lastEdit.waitFor()
    await page.waitForFunction(() => {
      const input = document.querySelector('textarea[name="content.4.item"]')
      return (
        document.activeElement === input &&
        input.selectionStart === input.value.length
      )
    })
    assert.equal(
      await lastEdit.evaluate((element) => element.selectionStart),
      12,
    )
    await page
      .getByRole('button', { name: 'Done editing', exact: true })
      .click()
    await page
      .locator('[data-task-index="1"]')
      .getByRole('button', { name: 'Edit item', exact: true })
      .click()
    const vegetables = page.locator('textarea[name="content.1.item"]')
    await vegetables.fill('First line\nBuy vegetables')
    await vegetables.evaluate((element) => element.setSelectionRange(15, 15))
    await vegetables.press('ArrowDown')
    const fruit = page.locator('textarea[name="content.2.item"]')
    await fruit.waitFor()
    await page.waitForFunction(() => {
      const input = document.querySelector('textarea[name="content.2.item"]')
      return document.activeElement === input && input.selectionStart === 4
    })
    assert.equal(await fruit.evaluate((element) => element.selectionStart), 4)
    await fruit.press('ArrowUp')
    await page.waitForFunction(() => {
      const input = document.querySelector('textarea[name="content.1.item"]')
      return document.activeElement === input && input.selectionStart === 15
    })
    assert.equal(
      await vegetables.evaluate((element) => element.selectionStart),
      15,
    )
    await vegetables.fill('Buy vegetables')
    await input.fill('Pending draft')
    await input.evaluate((element) => element.setSelectionRange(4, 4))
    await input.press('ArrowUp')
    await page.waitForFunction(() => {
      const input = document.querySelector('textarea[name="content.4.item"]')
      return document.activeElement === input && input.selectionStart === 4
    })
    assert.equal(await input.inputValue(), 'Pending draft')
    await page
      .getByRole('button', { name: 'Done editing', exact: true })
      .click()
    await input.fill('')
    // Holding the grip reorders only unfinished items; a quick drag cancels.
    const drag = async ({
      shouldHold,
      source = 4,
      target = 3,
      shouldCancel = false,
      screenshotPath,
    }) => {
      const handle = await page
        .locator(`[data-task-index="${source}"]`)
        .locator('button')
        .first()
        .boundingBox()
      const destination = await page
        .locator(`[data-task-index="${target}"]`)
        .boundingBox()
      await page.mouse.move(
        handle.x + handle.width / 2,
        handle.y + handle.height / 2,
      )
      await page.mouse.down()
      if (shouldHold) await page.waitForTimeout(400)
      await page.mouse.move(
        destination.x + destination.width / 2,
        destination.y + destination.height / 2,
      )
      const marker = page.locator('[data-task-drop-marker]')
      if (shouldHold) {
        await marker.waitFor()
        assert.equal(
          await page
            .locator(`[data-task-index="${target}"]`)
            .getAttribute('data-task-drop'),
          source < target ? 'after' : 'before',
        )
        assert.equal(
          await page
            .locator(`[data-task-index="${source}"]`)
            .getAttribute('data-task-dragging'),
          'true',
        )
        if (screenshotPath)
          await page
            .locator('form.group\\/form')
            .screenshot({ path: screenshotPath })
      } else assert.equal(await marker.count(), 0)
      if (shouldCancel)
        await page
          .locator(`[data-task-index="${source}"]`)
          .locator('button')
          .first()
          .dispatchEvent('pointercancel', { pointerId: 1 })
      await page.mouse.up()
      await marker.waitFor({ state: 'hidden' })
    }
    await drag({ shouldHold: false })
    assert.equal(
      await page.getByRole('checkbox').nth(2).getAttribute('aria-label'),
      'Take bags',
    )
    await drag({ shouldHold: true })
    assert.equal(
      await page.getByRole('checkbox').nth(2).getAttribute('aria-label'),
      'Bring wallet',
    )
    await drag({ shouldHold: true, source: 3, target: 4, shouldCancel: true })
    assert.equal(
      await page.getByRole('checkbox').nth(2).getAttribute('aria-label'),
      'Bring wallet',
    )
    await page
      .getByRole('button', { name: 'Delete completed', exact: true })
      .click()
    assert.equal(await page.getByRole('checkbox').count(), 4)
    await page.getByRole('button', { name: 'Undo', exact: true }).last().click()
    await page.getByRole('heading', { name: 'Completed (1 of 5)' }).waitFor()
    const stored = await dbGetWhen(`tasks/${id}`, (fields) =>
      encrypted
        ? fields?.encrypted
        : fields?.content?.arrayValue?.values?.length === 5,
    )
    if (encrypted) {
      assert.ok(stored.encrypted)
      assert.ok(!stored.content)
      assert.ok(!JSON.stringify(stored).includes('Buy brown rice'))
    } else {
      const content = stored.content.arrayValue.values.map(
        (value) => value.mapValue.fields,
      )
      assert.equal(
        content.filter((item) => item.item.stringValue === 'Buy fruit').length,
        1,
      )
      assert.ok(
        content.find((item) => item.item.stringValue === 'Buy brown rice')
          .checked.booleanValue,
      )
      if (process.env.TASK_UX_SCREENSHOTS) {
        await mkdir(process.env.TASK_UX_SCREENSHOTS, { recursive: true })
        for (const language of ['en', 'id']) {
          for (const theme of ['light', 'dark']) {
            await dbPatch(`users/${uid}`, {
              language: { stringValue: language },
              theme: { stringValue: theme },
            })
            await page.reload()
            await page.setViewportSize({ width: 390, height: 844 })
            await page.waitForFunction(
              ({ language, theme }) =>
                document.documentElement.lang === language &&
                document.documentElement.classList.contains(theme),
              { language, theme },
            )
            await page
              .getByRole('button', {
                name: 'Edit item',
                exact: true,
              })
              .first()
              .click()
            await drag({
              shouldHold: true,
              shouldCancel: true,
              screenshotPath: `${process.env.TASK_UX_SCREENSHOTS}/${language}-${theme}.png`,
            })
            await page
              .getByRole('button', {
                name: language === 'en' ? 'Done editing' : 'Selesai mengedit',
                exact: true,
              })
              .click()
          }
        }
        await dbPatch(`users/${uid}`, {
          language: { stringValue: 'en' },
          theme: { stringValue: 'light' },
        })
        await page.reload()
        await page.getByRole('button', { name: 'Add', exact: true }).waitFor()
      }
      await dbPatch(`tasks/${id}`, {
        owner: { stringValue: 'another-owner' },
        permissions: {
          mapValue: {
            fields: {
              read: { arrayValue: { values: [{ stringValue: uid }] } },
              write: { arrayValue: { values: [] } },
            },
          },
        },
      })
      await page
        .getByRole('button', { name: 'Add', exact: true })
        .waitFor({ state: 'hidden' })
      assert.ok(await page.getByRole('checkbox').first().isDisabled())
      assert.equal(
        await page
          .getByRole('button', { name: 'Edit item', exact: true })
          .count(),
        0,
      )
    }
    // New lists with only unfinished text must also be created on leaving.
    await page.goto(`${APP}/tasks/create`)
    await page.locator('textarea[name=title]').fill('Pending-only list')
    await input.fill('Remember keys')
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await page
      .getByRole('link', { name: 'Pending-only list', exact: true })
      .waitFor()
    await page
      .getByRole('link', { name: 'Pending-only list', exact: true })
      .click()
    await page
      .getByRole('checkbox', { name: 'Remember keys', exact: true })
      .waitFor()
    const owned = (documents) =>
      documents.filter((task) => task.fields.owner?.stringValue === uid)
    assert.equal(
      owned(
        await dbListWhen(
          'tasks',
          (documents) => owned(documents).length >= (encrypted ? 2 : 1),
        ),
      ).length,
      encrypted ? 2 : 1,
    )
    await context.close()
  })
}

test('mobile taps preserve the caret and focus within the tap event', async () => {
  const { page, context } = await newDevice(browser, {
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  try {
    await page.addInitScript(() => {
      let isInClick = false
      window.addEventListener(
        'click',
        (event) => {
          isInClick = true
          // Cover touch-generated clicks with no mouse click count as well.
          if (
            event.target instanceof HTMLElement &&
            event.target.closest('button.cursor-text')
          )
            Object.defineProperty(event, 'detail', { value: 0 })
        },
        true,
      )
      window.addEventListener('click', () => {
        isInClick = false
      })
      const focus = HTMLTextAreaElement.prototype.focus
      HTMLTextAreaElement.prototype.focus = function focusTaskInput(options) {
        if (this.name.startsWith('content.'))
          window.__taskFocusOutsideTap = !isInClick
        return focus.call(this, options)
      }
    })
    await signUp(
      page,
      'Mobile task tester',
      `mobile-tasks-${Date.now()}@example.com`,
    )
    await skipEncryptionSetup(page)
    await page.goto(`${APP}/tasks/create`)
    const wrapped =
      'A longer mobile task item that wraps across several lines on a phone screen.'
    await page.locator('textarea[name=title]').fill('Mobile cursor')
    await page.locator('textarea[name=item]').fill(wrapped)
    await page.getByRole('button', { name: 'Save', exact: true }).tap()
    await page.waitForURL(/\/tasks\/(?!create)/)
    const edit = page.locator('textarea[name="content.0.item"]')
    for (const text of [wrapped, 'First line\nSecond mobile line']) {
      if (text !== wrapped) {
        await edit.fill(text)
        await page
          .getByRole('button', { name: 'Done editing', exact: true })
          .tap()
      }
      const caret = text.indexOf(text === wrapped ? 'phone' : 'mobile') + 2
      const item = page.locator('[data-task-index="0"] button.cursor-text')
      // Navigation can leave the old creation form in the DOM briefly.
      // Wait for the saved item's visible, enabled text before measuring.
      await item.click({ trial: true })
      const point = await item.evaluate((element, offset) => {
        const range = document.createRange()
        range.setStart(element.firstChild, 0)
        range.setEnd(element.firstChild, 1)
        const firstTop = range.getBoundingClientRect().top
        range.setStart(element.firstChild, offset)
        range.setEnd(element.firstChild, offset + 1)
        const rectangle = range.getBoundingClientRect()
        return {
          x: rectangle.left + 1,
          y: rectangle.top + rectangle.height / 2,
          isLowerLine: rectangle.top > firstTop,
        }
      }, caret)
      assert.equal(point.isLowerLine, true, JSON.stringify(point))
      await page.touchscreen.tap(point.x, point.y)
      await page.waitForFunction((caret) => {
        const input = document.querySelector('textarea[name="content.0.item"]')
        return (
          document.activeElement === input &&
          input.selectionStart === caret &&
          input.selectionEnd === caret
        )
      }, caret)
      assert.equal(
        await page.evaluate(() => window.__taskFocusOutsideTap),
        false,
      )
      await page.keyboard.type('|')
      assert.equal(
        await edit.inputValue(),
        `${text.slice(0, caret)}|${text.slice(caret)}`,
      )
    }
  } finally {
    await context.close()
  }
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
    // The editor takes the selection from the browser's selectionchange
    // event, which comes later; right-clicking before it collapsed the
    // selection on slow runners.
    await page.waitForFunction(
      () => globalThis.getSelection()?.toString() === 'Project plan',
    )
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => setTimeout(resolve)),
        ),
    )
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
        await editor.evaluate((element) => element === document.activeElement),
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
        assert.ok(!initial.title && !initial.content, 'content stays encrypted')
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

test('undo and redo in task lists, finance books and health logs', async () => {
  const { page, context } = await newDevice(browser)
  try {
    await signUp(page, 'Undo writer', `undo-${Date.now()}@example.com`)
    await setUpEncryption(page, 'undo passphrase')
    await page.waitForURL(/\/notes/, { timeout: 30_000 })
    const undo = () =>
      page.getByRole('button', { name: 'Undo', exact: true }).click()
    const redo = () =>
      page.getByRole('button', { name: 'Redo', exact: true }).click()
    const pause = () => page.waitForTimeout(1500)

    // A task list: adding an item is a step.
    await page.goto(`${APP}/tasks/create`)
    await page.locator('textarea[name=title]').fill('Groceries')
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForURL(/\/tasks\/(?!create)/, { timeout: 30_000 })
    await page.waitForTimeout(2000)
    await page.locator('textarea[name=item]').fill('Eggs')
    await page.locator('textarea[name=item]').press('Enter')
    await shows(page, 'Eggs')
    await pause()
    await undo()
    await page.getByText('Eggs').waitFor({ state: 'hidden' })
    await redo()
    await shows(page, 'Eggs')

    // A finance book: its title, opened fresh (nothing to undo yet).
    await page.goto(`${APP}/finances/create`)
    await page.locator('textarea[name=title]').fill('Belanja')
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForURL(/\/finances\/(?!create)/, { timeout: 30_000 })
    await page.waitForTimeout(2000)
    await page.reload()
    await page.waitForTimeout(3000)
    assert.equal(
      await page.getByRole('button', { name: 'Undo', exact: true }).isEnabled(),
      false,
    )
    const bookTitle = page.locator('textarea[name=title]')
    await bookTitle.fill('Belanja Oktober')
    await pause()
    await undo()
    assert.equal(await bookTitle.inputValue(), 'Belanja')
    await redo()
    assert.equal(await bookTitle.inputValue(), 'Belanja Oktober')

    // A health log: its name, and a removed reminder brought back.
    await page.goto(`${APP}/health/create`)
    await page.locator('textarea[name=name]').fill('Rara')
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForURL(/\/health\/(?!create)/, { timeout: 30_000 })
    await page.getByRole('button', { name: 'Add reminder' }).click()
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await shows(page, 'Every 7 days')
    await page.getByText('Saved', { exact: true }).waitFor()
    await page.reload()
    await page.waitForTimeout(3000)
    const name = page.locator('textarea[name=name]')
    await name.fill('Rara Ayu')
    await pause()
    await undo()
    assert.equal(await name.inputValue(), 'Rara')
    await page.getByRole('button', { name: 'Remove reminder' }).click()
    await pause()
    await undo()
    await shows(page, 'Every 7 days')
  } finally {
    await context.close()
  }
})

test('a new device is asked about notifications once, after encryption', async () => {
  // The emulators have no push service, so only an iPhone outside the
  // installed app is asked: there it says to install first.
  const { page, context } = await newDevice(browser, {
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  })
  try {
    await signUp(page, 'Push asker', `push-ask-${Date.now()}@example.com`)
    await skipEncryptionSetup(page)
    const step = page.getByText('Get notifications on this device?')
    await step.waitFor({ timeout: 30_000 })
    await shows(page, 'notifications work only in the installed app')
    assert.equal(
      await page.getByRole('button', { name: 'Turn on' }).count(),
      0,
    )
    await page.getByRole('button', { name: 'Not now' }).click()
    await step.waitFor({ state: 'hidden' })

    // Not asked again on this device.
    await page.goto(`${APP}/tasks/create`)
    await page.locator('textarea[name=title]').waitFor({ timeout: 30_000 })
    assert.equal(await step.count(), 0)
  } finally {
    await context.close()
  }
})
