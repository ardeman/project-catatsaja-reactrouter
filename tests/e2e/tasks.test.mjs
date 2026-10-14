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
    await page.getByRole('button', { name: 'Buy rice', exact: true }).waitFor()
    assert.equal(await input.inputValue(), '')
    await input.fill('Buy vegetables')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await page.waitForURL(/\/tasks\/(?!create)/)
    const url = page.url()
    const id = url.split('/').pop()
    await page
      .getByRole('button', { name: 'Buy vegetables', exact: true })
      .waitFor()
    await input.fill('Buy fruit')
    // An idle pause must keep unfinished text editable in the add field.
    await page.waitForTimeout(800)
    assert.equal(await input.inputValue(), 'Buy fruit')
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await page.waitForURL(/\/tasks$/)
    await page
      .getByRole('link', { name: 'Untitled task' })
      .waitFor({ state: 'attached' })
    await page.goto(url)
    await page.getByRole('button', { name: 'Buy fruit', exact: true }).waitFor()
    assert.equal(await page.getByRole('checkbox').count(), 3)
    await page
      .getByRole('button', { name: 'Edit item', exact: true })
      .first()
      .click()
    const edit = page.locator('textarea[name="content.0.item"]')
    await edit.fill('Buy brown rice')
    await edit.press('ArrowLeft')
    await edit.press('ArrowUp')
    assert.equal(
      await edit.evaluate((element) => document.activeElement === element),
      true,
    )
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
      .getByRole('button', { name: 'Bring wallet', exact: true })
      .waitFor()
    await page.waitForTimeout(1000)
    await page.reload()
    await page
      .getByRole('button', { name: 'Bring wallet', exact: true })
      .waitFor()
    assert.equal(await page.getByRole('checkbox').count(), 5)
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
            await page.locator('form.group\\/form').screenshot({
              path: `${process.env.TASK_UX_SCREENSHOTS}/${language}-${theme}.png`,
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
      .getByRole('button', { name: 'Remember keys', exact: true })
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
