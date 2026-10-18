// Helpers for the end-to-end tests: the app on the local emulators, driven
// by Playwright (the installed Chrome), with the database read past the
// rules to check what is really stored.

import { spawn } from 'node:child_process'

import { chromium } from 'playwright'

export const APP = 'http://localhost:5199'
const PROJECT = 'demo-catatsaja'
const DATABASE = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`
// The emulators' admin access (bypasses the rules).
const ADMIN = { Authorization: 'Bearer owner' }

export const resetEmulators = async () => {
  await fetch(
    `http://127.0.0.1:9099/emulator/v1/projects/${PROJECT}/accounts`,
    { method: 'DELETE' },
  )
  await fetch(
    `http://127.0.0.1:8080/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,
    { method: 'DELETE' },
  )
}

export const dbList = async (collection) => {
  const response = await fetch(`${DATABASE}/${collection}?pageSize=300`, {
    headers: ADMIN,
  })
  const json = await response.json()
  return (json.documents ?? []).map((document) => ({
    id: document.name.split('/').pop(),
    fields: document.fields,
  }))
}

export const dbGet = async (path) => {
  const response = await fetch(`${DATABASE}/${path}`, { headers: ADMIN })
  if (!response.ok) return
  const json = await response.json()
  return json.fields
}

// The stored document once `isReady` holds: the screen shows a change as
// soon as it is made locally, a moment before the server has it.
export const dbGetWhen = async (path, isReady, timeout = 15_000) => {
  const end = Date.now() + timeout
  let fields = await dbGet(path)
  while (!isReady(fields) && Date.now() < end) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    fields = await dbGet(path)
  }
  return fields
}

// The collection's documents once `isReady` holds, like `dbGetWhen`.
export const dbListWhen = async (collection, isReady, timeout = 15_000) => {
  const end = Date.now() + timeout
  let documents = await dbList(collection)
  while (!isReady(documents) && Date.now() < end) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    documents = await dbList(collection)
  }
  return documents
}

export const dbPatch = async (path, fields) => {
  const mask = Object.keys(fields)
    .map((field) => `updateMask.fieldPaths=${field}`)
    .join('&')
  await fetch(`${DATABASE}/${path}?${mask}`, {
    method: 'PATCH',
    headers: { ...ADMIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
}

export const keysOf = (fields) =>
  Object.keys(fields?.keys?.mapValue?.fields ?? {})

export const readersOf = (fields) =>
  (fields?.permissions?.mapValue?.fields?.read?.arrayValue?.values ?? []).map(
    (value) => value.stringValue,
  )

export const uidOf = async (email) => {
  const lookup = await dbGet(`userLookup/${email.toLowerCase()}`)
  return lookup?.uid?.stringValue
}

// The dev server against the emulators. Placeholder Firebase settings when
// there is no .env (CI): the emulator mode never reaches a real project.
export const startApp = async () => {
  const server = spawn(
    'pnpm',
    ['exec', 'react-router', 'dev', '--port', '5199', '--strictPort'],
    {
      env: {
        VITE_FIREBASE_API_KEY: 'fake-api-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'localhost',
        VITE_FIREBASE_APP_ID: '1:1:web:1',
        ...process.env,
        VITE_USE_EMULATORS: 'true',
      },
      stdio: 'ignore',
      detached: true,
    },
  )
  // A busy port (another dev server) stops it at once: fail clearly rather
  // than test whatever else is answering there.
  let exited = false
  server.on('exit', () => {
    exited = true
  })
  for (let attempt = 0; attempt < 120; attempt++) {
    if (exited) throw new Error('The dev server stopped: is port 5199 in use?')
    try {
      const response = await fetch(APP)
      if (response.ok) return server
    } catch {
      // Not up yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('The dev server did not start')
}

export const stopApp = (server) => {
  if (!server?.pid) return
  try {
    process.kill(-server.pid)
  } catch {
    // Already stopped.
  }
}

export const launch = (options = {}) =>
  chromium.launch({ channel: 'chrome', ...options })

// A browser of its own: a separate device (nothing kept between them).
export const newDevice = async (browser, options = {}) => {
  const context = await browser.newContext({
    viewport: { width: 1100, height: 900 },
    ...options,
  })
  const page = await context.newPage()
  return { context, page }
}

export const signUp = async (page, name, email, password = 'password123') => {
  await page.goto(`${APP}/auth/sign-up`)
  await page.locator('input[name=displayName]').fill(name)
  await page.locator('input[name=email]').fill(email)
  await page.locator('input[name=password]').fill(password)
  await page.locator('input[name=confirmPassword]').fill(password)
  await page.locator('form button[type=submit]').last().click()
}

export const signIn = async (page, email, password = 'password123') => {
  await page.goto(`${APP}/auth/sign-in`)
  await page.locator('input[name=email]').fill(email)
  await page.locator('input[name=password]').fill(password)
  await page.locator('form button[type=submit]').first().click()
}

const unlockScreen = (page) => page.getByText('Unlock your data')

export const unlock = async (page, passphrase) => {
  await unlockScreen(page).waitFor({ timeout: 30_000 })
  await page.locator('input[name=passphrase]').fill(passphrase)
  await page.getByRole('button', { name: 'Unlock', exact: true }).click()
  await unlockScreen(page).waitFor({ state: 'hidden', timeout: 30_000 })
}

export const signInAndUnlock = async (browser, email, passphrase) => {
  const device = await newDevice(browser)
  await signIn(device.page, email)
  await unlock(device.page, passphrase)
  return device
}

// The setup new accounts get: passphrase, recovery code, no passkey.
export const setUpEncryption = async (page, passphrase, scope = page) => {
  await scope.locator('input[name=passphrase]').fill(passphrase)
  await scope.locator('input[name=confirm]').fill(passphrase)
  await scope.getByRole('button', { name: 'Next' }).click()
  const code = await scope
    .getByLabel('Recovery code', { exact: true })
    .textContent()
  await scope.getByLabel(/saved my recovery code/).click()
  await scope.getByRole('button', { name: 'Turn on encryption' }).click()
  await scope
    .getByRole('button', { name: 'Not now' })
    .click({ timeout: 30_000 })
  return code.trim()
}

export const createNote = async (page, title) => {
  await page.goto(`${APP}/notes/create`)
  await page.locator('textarea[name=title]').fill(title)
  await page.getByRole('button', { name: 'Save' }).click()
  await page.waitForURL(/\/notes\/(?!create)/, { timeout: 30_000 })
  return page.url().split('/').pop()
}

// Whether the notes list shows a title (after the live data arrives).
export const sees = async (page, text) => {
  await page.goto(`${APP}/notes`)
  await page.waitForTimeout(3000)
  return page.getByText(text).isVisible()
}

export const shareWith = async (page, email, access) => {
  await page.getByRole('button', { name: 'Share', exact: true }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('input[name=user]').fill(email)
  await dialog.locator('input[name=user]').press('Enter')
  await dialog.getByText(email).waitFor({ timeout: 15_000 })
  await dialog.getByRole('combobox').last().click()
  await page.getByRole('option', { name: access }).click()
  await page.waitForTimeout(1500)
  return dialog
}

// Accepting an invitation to the item with this title (it only appears in
// the person's lists once they do), on the list page of its kind.
export const acceptInvitation = async (page, title, list = 'notes') => {
  await page.goto(`${APP}/${list}`)
  await page
    .getByRole('listitem')
    .filter({ hasText: title })
    .getByRole('button', { name: 'Accept' })
    .click({ timeout: 30_000 })
  await page.waitForTimeout(2000)
}

// A new account going without encryption: the setup screen covers /notes
// (where sign-up lands), so wait until it is gone, not for the address.
export const skipEncryptionSetup = async (page) => {
  const setup = page.getByText('Protect your data')
  await setup.waitFor({ timeout: 30_000 })
  await page
    .getByRole('button', { name: 'Continue without encryption' })
    .click()
  await setup.waitFor({ state: 'hidden', timeout: 30_000 })
}

// Prepare the dev server before encryption or sharing scenarios start.
export const warmUpApp = async (browser) => {
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
}

// Files a push key for a device of this person, as the app does when push
// is turned on (the emulators have no Cloud Messaging, so the app can't turn
// it on there). Returns the private key (PKCS #8, base64) for `openSealed`.
export const filePushKey = async (page, uid, id = 'phone', lang = 'en') => {
  const { publicKey, privateKey } = await page.evaluate(async () => {
    const pair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits'],
    )
    const base64 = (bytes) =>
      btoa(String.fromCodePoint(...new Uint8Array(bytes)))
    return {
      publicKey: base64(await crypto.subtle.exportKey('raw', pair.publicKey)),
      privateKey: base64(
        await crypto.subtle.exportKey('pkcs8', pair.privateKey),
      ),
    }
  })
  await dbPatch(`users/${uid}/pushKeys/${id}`, {
    publicKey: { stringValue: publicKey },
    lang: { stringValue: lang },
  })
  return privateKey
}

// Push text sealed for a device `filePushKey` filed, opened as
// public/sw.js opens it.
export const openSealed = (page, sealed, privateKey) =>
  page.evaluate(
    async ({ text, pkcs8 }) => {
      const subtle = crypto.subtle
      const ECDH = { name: 'ECDH', namedCurve: 'P-256' }
      const bytes = (part) =>
        Uint8Array.from(atob(part), (character) => character.codePointAt(0))
      const [senderKey, iv, ciphertext] = text.split('.').map(bytes)
      const own = await subtle.importKey('pkcs8', bytes(pkcs8), ECDH, false, [
        'deriveBits',
      ])
      const sender = await subtle.importKey('raw', senderKey, ECDH, false, [])
      const secret = await subtle.deriveBits(
        { name: 'ECDH', public: sender },
        own,
        256,
      )
      const material = await subtle.importKey('raw', secret, 'HKDF', false, [
        'deriveKey',
      ])
      const key = await subtle.deriveKey(
        {
          name: 'HKDF',
          hash: 'SHA-256',
          salt: new Uint8Array(),
          info: new TextEncoder().encode('catatsaja push v1'),
        },
        material,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt'],
      )
      const plain = await subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext,
      )
      return new TextDecoder().decode(plain)
    },
    { text: sealed, pkcs8: privateKey },
  )
