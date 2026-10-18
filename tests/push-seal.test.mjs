// Tests for the end-to-end encrypted push text:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  exportDeviceKey,
  generateDeviceKey,
  openForDevice,
  sealForDevice,
} from '../app/lib/utils/push-seal.ts'

describe('push text', () => {
  test('opens on the device it was sealed for', async () => {
    const device = await generateDeviceKey()
    const sealed = await sealForDevice(
      'Belanja “minggu ini”',
      await exportDeviceKey(device.publicKey),
    )
    assert.equal(
      await openForDevice(sealed, device.privateKey),
      'Belanja “minggu ini”',
    )
  })

  test('is sealed afresh each time', async () => {
    const device = await generateDeviceKey()
    const publicKey = await exportDeviceKey(device.publicKey)
    assert.notEqual(
      await sealForDevice('Groceries', publicKey),
      await sealForDevice('Groceries', publicKey),
    )
  })

  test("doesn't open on another device", async () => {
    const device = await generateDeviceKey()
    const other = await generateDeviceKey()
    const sealed = await sealForDevice(
      'Groceries',
      await exportDeviceKey(device.publicKey),
    )
    await assert.rejects(openForDevice(sealed, other.privateKey))
  })
})
