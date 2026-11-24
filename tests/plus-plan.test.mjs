import assert from 'node:assert/strict'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { describe, test } from 'node:test'

// Mirrors functions/src/plus.ts: keep both in sync when the contract changes.

const extendPlanEndsAt = (now, current, months) => {
  const start = current !== undefined && current.getTime() > now.getTime() ? current : now
  const end = new Date(start.getTime())
  end.setUTCMonth(end.getUTCMonth() + months)
  return end
}

const b64url = (value) =>
  Buffer.from(value).toString('base64url').replace(/=+$/, '')

const signCheckoutToken = (secret, uid, email, now) => {
  const payload = b64url(
    JSON.stringify({
      uid,
      email,
      exp: Math.floor((now + 10 * 60_000) / 1000),
    }),
  )
  return `${payload}.${b64url(createHmac('sha256', secret).update(payload).digest())}`
}

const verifyCheckoutToken = (secret, token, now) => {
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return
  const expected = createHmac('sha256', secret).update(payload).digest()
  const given = Buffer.from(signature, 'base64url')
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return
  }
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  if (claims.exp * 1000 <= now) return
  return claims
}

const signDeliveryBody = (secret, body) =>
  createHmac('sha256', secret).update(body).digest('hex')

describe('prepaid Plus plan extension', () => {
  test('extends from now when there is no current Plus', () => {
    const now = new Date('2026-11-22T06:00:00.000Z')
    const end = extendPlanEndsAt(now, undefined, 1)
    assert.equal(end.toISOString(), '2026-12-22T06:00:00.000Z')
  })

  test('extends from the current end when Plus is still active', () => {
    const now = new Date('2026-11-22T06:00:00.000Z')
    const current = new Date('2027-01-15T06:00:00.000Z')
    const end = extendPlanEndsAt(now, current, 3)
    assert.equal(end.toISOString(), '2027-04-15T06:00:00.000Z')
  })

  test('starts from now when the previous Plus already ended', () => {
    const now = new Date('2026-11-22T06:00:00.000Z')
    const current = new Date('2026-01-01T00:00:00.000Z')
    const end = extendPlanEndsAt(now, current, 12)
    assert.equal(end.toISOString(), '2027-11-22T06:00:00.000Z')
  })
})

describe('Plus checkout token and delivery HMAC', () => {
  test('round-trips a checkout token', () => {
    const now = Date.parse('2026-11-22T06:00:00.000Z')
    const token = signCheckoutToken('secret', 'uid-1', 'a@example.com', now)
    const claims = verifyCheckoutToken('secret', token, now)
    assert.deepEqual(claims, {
      uid: 'uid-1',
      email: 'a@example.com',
      exp: Math.floor((now + 10 * 60_000) / 1000),
    })
  })

  test('rejects a token signed with another secret or past expiry', () => {
    const now = Date.parse('2026-11-22T06:00:00.000Z')
    const token = signCheckoutToken('secret', 'uid-1', 'a@example.com', now)
    assert.equal(verifyCheckoutToken('other', token, now), undefined)
    assert.equal(
      verifyCheckoutToken('secret', token, now + 11 * 60_000),
      undefined,
    )
  })

  test('delivery signature matches hex HMAC-SHA256 of the body', () => {
    const body = '{"uid":"u","orderId":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","months":1,"paidAt":"2026-11-22T00:00:00.000Z"}'
    const signature = signDeliveryBody('delivery-secret', body)
    assert.match(signature, /^[0-9a-f]{64}$/)
    assert.equal(signDeliveryBody('delivery-secret', body), signature)
    assert.notEqual(signDeliveryBody('other', body), signature)
  })
})
