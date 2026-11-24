import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { describe, test } from 'node:test'

// Smoke against the Functions + Firestore emulators: Dahlunas-style HMAC
// POST to deliverPlus sets plan / planEndsAt, rejects bad signatures, and
// is idempotent per orderId. Run via `pnpm test:plus-delivery`.

const PROJECT = 'demo-catatsaja'
const REGION = 'asia-southeast2'
const DELIVER = `http://127.0.0.1:5001/${PROJECT}/${REGION}/deliverPlus`
const DATABASE = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`
const ADMIN = { Authorization: 'Bearer owner' }
const SECRET = process.env.DAHLUNAS_DELIVERY_SECRET ?? 'local-delivery-secret'

const sign = (body) =>
  createHmac('sha256', SECRET).update(body).digest('hex')

const dbGet = async (path) => {
  const response = await fetch(`${DATABASE}/${path}`, { headers: ADMIN })
  if (!response.ok) return
  return (await response.json()).fields
}

const dbSet = async (path, fields) => {
  const mask = Object.keys(fields)
    .map((field) => `updateMask.fieldPaths=${field}`)
    .join('&')
  const response = await fetch(`${DATABASE}/${path}?${mask}`, {
    method: 'PATCH',
    headers: { ...ADMIN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  assert.equal(response.ok, true, await response.text())
}

const deliver = async (payload, signature = sign(payload)) =>
  fetch(DELIVER, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Dahlunas-Signature': signature,
    },
    body: payload,
  })

describe('deliverPlus emulator smoke', () => {
  test('rejects a bad signature', async () => {
    const body = JSON.stringify({
      uid: 'nobody',
      orderId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      months: 1,
      paidAt: '2026-11-22T00:00:00.000Z',
    })
    const response = await deliver(body, '0'.repeat(64))
    assert.equal(response.status, 401)
  })

  test('sets Plus and extends planEndsAt; duplicate is a no-op', async () => {
    const uid = 'plus-smoke-user'
    const orderId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    await dbSet(`users/${uid}`, {
      uid: { stringValue: uid },
      displayName: { stringValue: 'Smoke' },
    })

    const body = JSON.stringify({
      uid,
      orderId,
      months: 1,
      paidAt: '2026-11-22T06:00:00.000Z',
    })
    const first = await deliver(body)
    const firstText = await first.text()
    assert.equal(first.status, 200, firstText)
    assert.deepEqual(JSON.parse(firstText), { ok: true })

    const profile = await dbGet(`users/${uid}`)
    assert.equal(profile?.plan?.stringValue, 'plus')
    assert.ok(profile?.planEndsAt?.timestampValue)

    const delivery = await dbGet(`plusDeliveries/${orderId}`)
    assert.equal(delivery?.uid?.stringValue, uid)
    assert.equal(delivery?.months?.integerValue, '1')

    const second = await deliver(body)
    const secondText = await second.text()
    assert.equal(second.status, 200, secondText)
    assert.deepEqual(JSON.parse(secondText), { ok: true, duplicate: true })
  })

  test('404 when the account does not exist', async () => {
    const body = JSON.stringify({
      uid: 'missing-user',
      orderId: 'cccccccccccccccccccccccccccccccc',
      months: 3,
      paidAt: '2026-11-22T00:00:00.000Z',
    })
    const response = await deliver(body)
    assert.equal(response.status, 404)
  })
})
