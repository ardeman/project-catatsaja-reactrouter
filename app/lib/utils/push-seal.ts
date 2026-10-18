// End-to-end encrypted push text. Each device that gets push has its own
// ECDH P-256 key pair: the private key never leaves the device (kept in
// IndexedDB, where the service worker reads it, `push-device.ts`),
// and the public key is filed next to its push token for others to seal
// with. A sender seals a short text for each device of the recipient:
// ECDH with a fresh key pair, HKDF-SHA-256, then AES-GCM. The server
// carries the result without being able to read it.
//
// `public/sw.js` opens it the same way: keep both in step. No app imports,
// so `pnpm test:unit` can run it in Node.

const subtle = () => crypto.subtle

const toBase64 = (bytes: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCodePoint(...new Uint8Array(bytes)))

const fromBase64 = (text: string) =>
  Uint8Array.from(atob(text), (character) => character.codePointAt(0) ?? 0)

const ECDH = { name: 'ECDH', namedCurve: 'P-256' } as const

const info = new TextEncoder().encode('catatsaja push v1')

const messageKey = async (privateKey: CryptoKey, publicKey: CryptoKey) => {
  const secret = await subtle().deriveBits(
    { name: 'ECDH', public: publicKey },
    privateKey,
    256,
  )
  const material = await subtle().importKey('raw', secret, 'HKDF', false, [
    'deriveKey',
  ])
  return subtle().deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(), info },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

// A device's key pair; the private key can't be exported.
export const generateDeviceKey = () =>
  subtle().generateKey(ECDH, false, ['deriveBits'])

export const exportDeviceKey = async (publicKey: CryptoKey) =>
  toBase64(await subtle().exportKey('raw', publicKey))

// "<sender's public key>.<iv>.<ciphertext>", all base64.
export const sealForDevice = async (text: string, devicePublicKey: string) => {
  const recipient = await subtle().importKey(
    'raw',
    fromBase64(devicePublicKey),
    ECDH,
    false,
    [],
  )
  const sender = await subtle().generateKey(ECDH, false, ['deriveBits'])
  const key = await messageKey(sender.privateKey, recipient)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await subtle().encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(text),
  )
  const senderKey = await subtle().exportKey('raw', sender.publicKey)
  return [senderKey, iv, ciphertext].map((part) => toBase64(part)).join('.')
}

export const openForDevice = async (sealed: string, privateKey: CryptoKey) => {
  const [senderKey, iv, ciphertext] = sealed
    .split('.')
    .map((part) => fromBase64(part))
  const sender = await subtle().importKey('raw', senderKey, ECDH, false, [])
  const key = await messageKey(privateKey, sender)
  const plain = await subtle().decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plain)
}
