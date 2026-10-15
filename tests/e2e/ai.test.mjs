// End-to-end tests of the AI features (receipt scanning, quick add, note
// helpers, dictation, taking back consent) and health reminders, on the local
// emulators:
//   pnpm test:e2e
// Gemini is replaced by fixed answers (nothing reaches Google, and runs cost
// nothing); what is tested is everything around it: the notice, checking
// and choosing before adding, what is stored, and that it stays encrypted.
// One account; each scenario builds on the one before, so they run in order.

import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { after, before, describe, test } from 'node:test'

import {
  APP,
  createNote,
  dbGet,
  dbList,
  dbPatch,
  launch,
  newDevice,
  resetEmulators,
  setUpEncryption,
  signInAndUnlock,
  signUp,
  startApp,
  stopApp,
  uidOf,
} from './helpers.mjs'

const RINA = 'rina@example.com'

// Gemini's answers, by what each feature asks it.
const answers = [
  [
    'Read this shopping receipt',
    {
      merchant: 'INDOMARET',
      // Read month first: the app takes it back as 11 October.
      date: '2026-11-10',
      currency: 'IDR',
      items: [
        {
          description: 'INDOMIE GORENG',
          quantity: 5,
          unitPrice: 3500,
          discount: 0,
        },
        {
          description: 'AQUA 600ML',
          quantity: 1,
          unitPrice: 4000,
          discount: 0,
        },
        {
          description: 'SUSU UHT 1L',
          quantity: 2,
          unitPrice: 19_900,
          discount: 4000,
        },
      ],
      charges: [],
      discount: 0,
      total: 57_300,
    },
  ],
  [
    'Turn this note of money',
    {
      currency: '',
      entries: [
        {
          description: 'Makan siang',
          type: 'expense',
          quantity: 1,
          unitPrice: 45_000,
          date: '',
        },
        {
          description: 'Gaji',
          type: 'income',
          quantity: 1,
          unitPrice: 8_000_000,
          date: '',
        },
      ],
    },
  ],
  [
    'Tidy up this note',
    { title: 'Shopping', markdown: 'Buy milk and bread.', items: [] },
  ],
  ['Transcribe this voice recording', { text: 'Call the dentist on Monday.' }],
  [
    'Turn this note into a checklist',
    { title: 'Shopping list', markdown: '', items: ['Buy milk', 'Buy bread'] },
  ],
]

// Answers Gemini's requests for a device; counts them.
const fakeGemini = async (context) => {
  const calls = []
  await context.route(
    '**/firebasevertexai.googleapis.com/**',
    async (route) => {
      const body = route.request().postData() ?? ''
      const [prompt, answer] = answers.find(([key]) => body.includes(key)) ?? []
      calls.push(prompt ?? 'unknown')
      // Tidying answers after a moment, so the test can see the waiting
      // message the note helpers show.
      if (prompt === 'Tidy up this note')
        await new Promise((resolve) => setTimeout(resolve, 500))
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [
            {
              index: 0,
              finishReason: 'STOP',
              content: {
                role: 'model',
                parts: [{ text: JSON.stringify(answer ?? {}) }],
              },
            },
          ],
        }),
      })
    },
  )
  return calls
}

let server
let browser
let device
let calls
let receiptPhoto
let bookUrl
let healthUrl

before(async () => {
  server = await startApp()
  // Chrome's fake microphone (a beep) for dictation, allowed without asking.
  browser = await launch({
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
    ],
  })
  // A first visit to each kind of page: the dev server prepares its
  // dependencies on first use and reloads, which mustn't happen mid-test.
  await resetEmulators()
  const warmUp = await newDevice(browser)
  await fakeGemini(warmUp.context)
  await signUp(warmUp.page, 'Warm-up', 'warm-up@example.com')
  await warmUp.page.getByText('Protect your data').waitFor({ timeout: 60_000 })
  for (const page of [
    '/finances/create',
    '/notes/create',
    '/tasks/create',
    '/health/create',
    '/health',
    '/settings/account',
  ]) {
    await warmUp.page.goto(`${APP}${page}`)
    await warmUp.page.waitForTimeout(2000)
  }
  await warmUp.context.close()
  await resetEmulators()
  device = await newDevice(browser)
  calls = await fakeGemini(device.context)
  // A receipt photo to choose (its content doesn't matter: Gemini is fake).
  const directory = await mkdtemp(path.join(tmpdir(), 'catatsaja-e2e-'))
  receiptPhoto = path.join(directory, 'receipt.jpg')
  const photo = await device.page.screenshot({ type: 'jpeg' })
  await writeFile(receiptPhoto, photo)
})

after(async () => {
  await browser?.close()
  stopApp(server)
})

const shows = (page, text) =>
  page.getByText(text).first().waitFor({ timeout: 30_000 })

describe('AI features and reminders', () => {
  test('a receipt is scanned after the notice, checked and added in part', async () => {
    const { page } = device
    await signUp(page, 'Rina', RINA)
    await page.getByText('Protect your data').waitFor({ timeout: 60_000 })
    await setUpEncryption(page, 'rina passphrase 1')
    await page.waitForURL(/\/notes/, { timeout: 30_000 })

    await page.goto(`${APP}/finances/create`)
    await page.locator('textarea[name=title]').fill('Belanja')
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForURL(/\/finances\/(?!create)/, { timeout: 30_000 })
    bookUrl = page.url()

    // The first time: the notice, then the file picker from its button.
    assert.equal(
      await page.getByRole('button', { name: 'Scan receipt' }).count(),
      0,
    )
    await page.getByRole('button', { name: 'Gemini', exact: true }).click()
    await page.getByRole('button', { name: 'Scan receipt' }).click()
    await shows(page, 'Use Gemini?')
    const chooser = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: 'Continue' }).click()
    await (await chooser).setFiles(receiptPhoto)
    await shows(page, 'Check the receipt')
    const uid = await uidOf(RINA)
    assert.equal((await dbGet(`users/${uid}`)).aiConsent?.booleanValue, true)

    // The line discount stays on its item; the misread date is swapped back
    // and said so; the total follows what is ticked.
    await shows(page, 'Discount Rp4,000')
    await shows(page, '2 × Rp17,900 · Rp4,000 off')
    await shows(page, /day and month swapped/)
    await page.getByText('AQUA 600ML').click()
    await shows(page, 'Total of 2 items')
    await shows(page, 'Rp53,300')
    await page.getByRole('button', { name: 'Add 2 entries' }).click()
    await shows(page, 'Sunday, October 11, 2026')
    assert.equal(await page.getByText('AQUA 600ML').count(), 0)
    await page.waitForTimeout(4000)

    // Stored encrypted, like any other entry.
    const book = await dbGet(`finances/${bookUrl.split('/').pop()}`)
    assert.ok(book.encrypted && !book.content, 'the book is encrypted')
  })

  test('quick add reads typed text into entries to check', async () => {
    const { page } = device
    await page.getByRole('button', { name: 'Gemini', exact: true }).click()
    await page.locator('textarea[name=text]').fill('makan siang 45rb, gaji 8jt')
    await page.getByRole('button', { name: 'Read', exact: true }).click()
    await shows(page, 'Makan siang')
    await page.getByText('Gaji').click() // leave the salary out
    await page.getByRole('button', { name: 'Add 1 entry' }).click()
    await shows(page, 'Makan siang')
    assert.equal(await page.getByText('Gaji').count(), 0)
    assert.deepEqual(calls, [
      'Read this shopping receipt',
      'Turn this note of money',
    ])
  })

  test('an entry deleted on another device stays deleted', async () => {
    // This device added "Makan siang" above and still has the book open.
    const { page } = device
    await page.waitForTimeout(2000)
    const other = await signInAndUnlock(browser, RINA, 'rina passphrase 1')
    await other.page.goto(bookUrl)
    await other.page.getByText('Makan siang').click({ timeout: 30_000 })
    await other.page.getByRole('button', { name: 'Delete entry' }).click()
    await other.page.getByText('Makan siang').waitFor({ state: 'hidden' })
    await other.page.waitForTimeout(3000)

    // Gone here too, and leaving (which saves) doesn't bring it back.
    await page.getByText('Makan siang').waitFor({
      state: 'hidden',
      timeout: 30_000,
    })
    await page.goto(`${APP}/finances`)
    await page.waitForTimeout(3000)
    await other.page.reload()
    await shows(other.page, 'INDOMIE GORENG')
    assert.equal(await other.page.getByText('Makan siang').count(), 0)
    await other.context.close()
  })

  test('note helpers preview, apply, undo, and make a task list', async () => {
    const { page } = device
    await createNote(page, 'shoping')
    // The editor settles after the page switches to the new note.
    await page.waitForTimeout(2000)
    await page.locator('.ProseMirror[contenteditable=true]').first().click()
    await page.keyboard.type('buy milk and bread')
    // Still a step once autosave has stored it.
    await page.waitForTimeout(3000)
    assert.ok(
      await page.getByRole('button', { name: 'Undo', exact: true }).isEnabled(),
    )
    await page.getByRole('button', { name: 'Gemini' }).click()
    await page.getByRole('menuitem', { name: 'Tidy up' }).click()
    await shows(page, 'Gemini is tidying up your note…')
    await shows(page, 'Tidied note')
    await page.getByRole('button', { name: 'Replace note' }).click()
    await shows(page, 'Buy milk and bread.')
    assert.equal(
      await page.locator('textarea[name=title]').inputValue(),
      'Shopping',
    )
    // Undo and redo in the icon bar step over the whole change.
    const title = () => page.locator('textarea[name=title]').inputValue()
    await page.getByRole('button', { name: 'Undo', exact: true }).click()
    await shows(page, 'buy milk and bread')
    assert.equal(await title(), 'shoping')
    await page.getByRole('button', { name: 'Redo', exact: true }).click()
    await shows(page, 'Buy milk and bread.')
    assert.equal(await title(), 'Shopping')
    await page.getByRole('button', { name: 'Undo', exact: true }).click()
    await shows(page, 'buy milk and bread')

    // Typing becomes a step once it pauses.
    await page.locator('textarea[name=title]').fill('shoping list')
    await page.waitForTimeout(1500)
    await page.getByRole('button', { name: 'Undo', exact: true }).click()
    await page.waitForTimeout(500)
    assert.equal(await title(), 'shoping')
    assert.ok(
      await page.getByRole('button', { name: 'Redo', exact: true }).isEnabled(),
    )

    await page.getByRole('button', { name: 'Gemini' }).click()
    await page.getByRole('menuitem', { name: 'Turn into a checklist' }).click()
    await page.getByRole('button', { name: 'Create task list' }).click()
    await page.waitForURL(/\/tasks\/(?!create)/, { timeout: 30_000 })
    await shows(page, 'Buy bread')
    const tasks = await dbList('tasks')
    assert.equal(tasks.length, 1)
    assert.ok(tasks[0].fields.encrypted, 'the new task list is encrypted')
  })

  test('dictation records, is checked and edited, then added to the note', async () => {
    const { page } = device
    await createNote(page, 'Errands')
    await page.waitForTimeout(2000)
    // Dictating works on an empty note; the other helpers wait for text.
    await page.getByRole('button', { name: 'Gemini' }).click()
    assert.ok(
      await page.getByRole('menuitem', { name: 'Tidy up' }).isDisabled(),
    )
    await page.getByRole('menuitem', { name: 'Dictate' }).click()
    await page.getByRole('button', { name: 'Start recording' }).click()
    await shows(page, 'Recording…')
    await page.waitForTimeout(1500)
    const before = calls.length
    await page.getByRole('button', { name: 'Stop recording' }).click()
    const transcript = page.getByLabel('What you said')
    await transcript.waitFor({ timeout: 30_000 })
    assert.equal(calls.length, before + 1)
    assert.equal(calls.at(-1), 'Transcribe this voice recording')
    assert.equal(await transcript.inputValue(), 'Call the dentist on Monday.')
    await transcript.fill('Call the dentist on Tuesday.')
    await page.getByRole('button', { name: 'Insert' }).click()
    await shows(page, 'Call the dentist on Tuesday.')
    await page.waitForTimeout(3000)
    const notes = await dbList('notes')
    const stored = notes.find((note) =>
      JSON.stringify(note).includes('dentist'),
    )
    assert.ok(notes.length > 1)
    assert.equal(stored, undefined, 'the note stays encrypted')
  })

  test('taking back consent shows the notice again', async () => {
    const { page } = device
    await page.goto(`${APP}/settings/account`)
    await page.getByRole('button', { name: 'Take back my agreement' }).click()
    await shows(
      page,
      'You’ll be asked before an AI feature first sends anything.',
    )
    const uid = await uidOf(RINA)
    assert.equal((await dbGet(`users/${uid}`)).aiConsent?.booleanValue, false)

    const sent = calls.length
    await page.goto(bookUrl)
    assert.equal(
      await page.getByRole('button', { name: 'Scan receipt' }).count(),
      0,
    )
    await page.getByRole('button', { name: 'Gemini', exact: true }).click()
    await page.getByRole('button', { name: 'Scan receipt' }).click()
    await shows(page, 'Use Gemini?')
    assert.equal(calls.length, sent, 'nothing sent before agreeing')
  })

  test('a health reminder is due until it is logged, and stays encrypted', async () => {
    const { page } = device
    await page.goto(`${APP}/health/create`)
    await page.locator('textarea[name=name]').fill('Rara')
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForURL(/\/health\/(?!create)/, { timeout: 30_000 })
    const logId = page.url().split('/').pop().split('?')[0]
    healthUrl = `${APP}/health/${logId}`

    await page.getByRole('button', { name: 'Add reminder' }).click()
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await shows(page, 'Time to weigh and measure.')
    await shows(page, 'Every 7 days')
    await page.waitForTimeout(4000)

    // On the menu and the log's card too.
    await page.goto(`${APP}/health`)
    await shows(page, '1 reminder due')
    const log = await dbGet(`healthLogs/${logId}`)
    assert.ok(log.encrypted && !log.reminders, 'reminders are encrypted')

    await page.goto(`${APP}/health/${logId}`)
    await page.getByRole('button', { name: 'Log now' }).click()
    await page.getByRole('button', { name: 'Add measurement' }).click()
    await page.locator('input[name=weight]').fill('20')
    await page.getByRole('button', { name: 'Save', exact: true }).last().click()
    await page
      .getByText('Time to weigh and measure.')
      .waitFor({ state: 'hidden' })
    await shows(page, /next /)
  })

  test('undo and redo in task lists, finance books and health logs', async () => {
    const { page } = device
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
    await page.goto(bookUrl)
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
    await page.goto(healthUrl)
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
  })

  test('an unsaved entry comes back after a reload, until it is cancelled', async () => {
    const { page } = device
    await page.goto(bookUrl)
    await page.getByRole('button', { name: 'Add entry' }).click()
    await page.locator('input[name=description]').fill('Draft parking')
    await page.locator('input[name=amount]').fill('5000')
    await page.waitForTimeout(500)
    await page.reload()
    // Open again, filled in, and nothing saved.
    await page.locator('input[name=description]').waitFor({ timeout: 30_000 })
    assert.equal(
      await page.locator('input[name=description]').inputValue(),
      'Draft parking',
    )
    assert.equal(await page.locator('input[name=amount]').inputValue(), '5,000')
    assert.equal(await page.getByText('Draft parking').count(), 0)
    await page.getByRole('button', { name: 'Cancel' }).click()
    await page.reload()
    await page.getByRole('button', { name: 'Add entry' }).waitFor()
    assert.equal(await page.locator('input[name=description]').count(), 0)
  })

  test('maintenance mode closes the app until it is turned off', async () => {
    const { page } = device
    await page.goto(`${APP}/notes`)
    await page.waitForTimeout(2000)
    await dbPatch('config/app', {
      maintenance: { booleanValue: true },
      message: { stringValue: 'Moving to a new server.' },
    })
    await shows(page, "We're updating Catat Saja")
    await shows(page, 'Moving to a new server.')
    assert.equal(await page.getByRole('link', { name: 'New note' }).count(), 0)
    await dbPatch('config/app', { maintenance: { booleanValue: false } })
    await page
      .getByText("We're updating Catat Saja")
      .waitFor({ state: 'hidden', timeout: 30_000 })
  })

  test('signing out clears drafts and the offline copy on this device', async () => {
    const { page } = device
    await page.goto(bookUrl)
    await page.getByRole('button', { name: 'Gemini', exact: true }).click()
    await page.locator('textarea[name=text]').fill('kopi 20rb')
    await page.waitForTimeout(500)
    const before = await page.evaluate(async () => ({
      drafts: Object.keys({ ...localStorage, ...sessionStorage }).filter(
        (key) => key.startsWith('catatsaja-draft:'),
      ).length,
      databases: (await indexedDB.databases()).filter((database) =>
        database.name?.startsWith('firestore/'),
      ).length,
    }))
    assert.ok(before.drafts > 0 && before.databases > 0)

    await page.getByRole('button', { name: 'Account menu' }).click()
    await page.getByRole('menuitem', { name: 'Sign out' }).click()
    await page.waitForURL(/\/auth\/sign-in/, { timeout: 30_000 })
    const after = await page.evaluate(async () => ({
      drafts: Object.keys({ ...localStorage, ...sessionStorage }).filter(
        (key) => key.startsWith('catatsaja-draft:'),
      ).length,
      main: (await indexedDB.databases()).filter((database) =>
        database.name?.endsWith('/main'),
      ).length,
    }))
    assert.deepEqual(after, { drafts: 0, main: 0 })
  })
})
