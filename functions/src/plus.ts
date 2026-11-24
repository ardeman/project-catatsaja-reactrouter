import { createHmac, timingSafeEqual } from 'node:crypto'

import { Timestamp } from 'firebase-admin/firestore'

// Prepaid Catat Saja Plus: checkout tokens and delivery signed with Dahlunas.
// Months are calendar months from the later of now or the current end date.

const TOKEN_TTL_MS = 10 * 60_000

type TCheckoutClaims = {
  uid: string
  email: string
  exp: number
}

export type TDeliverBody = {
  uid: string
  orderId: string
  months: number
  paidAt: string
}

const extendPlanEndsAt = (
  now: Date,
  current: Date | undefined,
  months: number,
): Date => {
  const start = current !== undefined && current > now ? current : now
  const end = new Date(start)
  end.setUTCMonth(end.getUTCMonth() + months)
  return end
}

export const planEndsAtTimestamp = (
  now: Date,
  current: Timestamp | undefined,
  months: number,
): Timestamp =>
  Timestamp.fromDate(
    extendPlanEndsAt(
      now,
      current === undefined ? undefined : current.toDate(),
      months,
    ),
  )

const b64url = (value: Buffer | string) =>
  Buffer.from(value).toString('base64url').replace(/=+$/, '')

const hmac = (secret: string, message: string) =>
  createHmac('sha256', secret).update(message).digest()

const equal = (a: Buffer, b: Buffer) =>
  a.length === b.length && timingSafeEqual(a, b)

export const signCheckoutToken = (
  secret: string,
  uid: string,
  email: string,
  now = Date.now(),
): string => {
  const payload = b64url(
    JSON.stringify({
      uid,
      email,
      exp: Math.floor((now + TOKEN_TTL_MS) / 1000),
    } satisfies TCheckoutClaims),
  )
  return `${payload}.${b64url(hmac(secret, payload))}`
}

export const verifyDeliverySignature = (
  secret: string,
  body: string,
  signature: string,
) => {
  if (!/^[0-9a-f]{64}$/i.test(signature)) return false
  const expected = hmac(secret, body)
  const given = Buffer.from(signature, 'hex')
  return equal(expected, given)
}

const isPlusMonths = (value: unknown): value is number =>
  Number.isSafeInteger(value) &&
  (value as number) >= 1 &&
  (value as number) <= 120

export const parseDeliverBody = (raw: unknown): TDeliverBody | undefined => {
  if (!raw || typeof raw !== 'object') return
  const body = raw as Record<string, unknown>
  const uid = body.uid
  const orderId = body.orderId
  const months = body.months
  const paidAt = body.paidAt
  if (
    typeof uid !== 'string' ||
    typeof orderId !== 'string' ||
    typeof paidAt !== 'string' ||
    uid.length === 0 ||
    uid.length > 128 ||
    !/^[a-f0-9]{32}$/.test(orderId) ||
    Number.isNaN(Date.parse(paidAt)) ||
    !isPlusMonths(months)
  ) {
    return
  }
  return { uid, orderId, months, paidAt }
}
