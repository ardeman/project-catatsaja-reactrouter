// Task input must survive Save and in-app navigation, with and without
// encryption. Run against the Auth and Firestore emulators.
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { after, before, test } from 'node:test'

import {
  APP,
  dbGetWhen,
  dbList,
  dbPatch,
  launch,
  newDevice,
  setUpEncryption,
  signUp,
  skipEncryptionSetup,
  startApp,
  stopApp,
  uidOf,
} from './helpers.mjs'

let server
let browser
before(async () => {
  server = await startApp()
  browser = await launch()
})
after(async () => {
  await browser?.close()
  stopApp(server)
})

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
    assert.equal(
      (await dbList('tasks')).filter(
        (task) => task.fields.owner?.stringValue === uid,
      ).length,
      encrypted ? 2 : 1,
    )
    await context.close()
  })
}
