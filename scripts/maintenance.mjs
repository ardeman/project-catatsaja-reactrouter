// Maintenance mode and the oldest app allowed (`config/app`, README →
// Deployment → Maintenance mode) from the command line, through Firestore's
// REST API with your gcloud sign-in (`gcloud auth login`, with an account
// that can edit the project):
//
//   pnpm maintenance status
//   pnpm maintenance on [--message "…"] [--until 2026-10-14T21:00+07:00]
//                       [--min-app-version 2]
//   pnpm maintenance off
//
// Only the fields named are written. `--project` picks another Firebase
// project than `.firebaserc`'s default.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    message: { type: 'string' },
    until: { type: 'string' },
    'min-app-version': { type: 'string' },
    project: { type: 'string' },
  },
})
const [command] = positionals

const fail = (message) => {
  console.error(message)
  process.exit(1)
}

if (!['status', 'on', 'off'].includes(command))
  fail(
    'Usage: pnpm maintenance status | on [--message …] [--until …] [--min-app-version N] | off',
  )

const project =
  values.project ??
  JSON.parse(readFileSync(new URL('../.firebaserc', import.meta.url), 'utf8'))
    .projects.default

let token
try {
  token = execFileSync('gcloud', ['auth', 'print-access-token'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  }).trim()
} catch {
  fail('Could not get a token from gcloud: run `gcloud auth login` first.')
}

const url = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/config/app`
const headers = {
  Authorization: `Bearer ${token}`,
  'x-goog-user-project': project,
  'Content-Type': 'application/json',
}

const fields = {}
if (command !== 'status') {
  fields.maintenance = { booleanValue: command === 'on' }
  if (values.message !== undefined)
    fields.message = { stringValue: values.message }
  if (values.until !== undefined) {
    const until = new Date(values.until)
    if (Number.isNaN(until.getTime()))
      fail(`--until isn't a date and time: ${values.until}`)
    fields.until = { timestampValue: until.toISOString() }
  }
  if (values['min-app-version'] !== undefined) {
    const version = Number(values['min-app-version'])
    if (!Number.isInteger(version) || version < 1)
      fail('--min-app-version must be a whole number from 1')
    fields.minAppVersion = { integerValue: String(version) }
  }
}

const mask = Object.keys(fields)
  .map((field) => `updateMask.fieldPaths=${field}`)
  .join('&')
const response = await fetch(command === 'status' ? url : `${url}?${mask}`, {
  method: command === 'status' ? 'GET' : 'PATCH',
  headers,
  ...(command !== 'status' && { body: JSON.stringify({ fields }) }),
})
const body = await response.json()
if (response.status === 404 && command === 'status')
  fail(`No config/app in ${project} yet: maintenance is off.`)
if (!response.ok)
  fail(`Firestore refused (${response.status}): ${body.error?.message}`)

const shown = Object.fromEntries(
  Object.entries(body.fields ?? {}).map(([field, value]) => [
    field,
    Object.values(value)[0],
  ]),
)
console.log(`config/app in ${project}:`, shown)
