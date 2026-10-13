// End-to-end encryption primitives, on the browser's Web Crypto only.
//
// - Each person has an RSA-OAEP key pair (3072-bit, SHA-256). The public
//   key is on their profile; the private key is stored sealed (AES-GCM)
//   with a key derived from their passphrase (PBKDF2), their recovery code
//   (PBKDF2) or a passkey (HKDF over its PRF output).
// - Each encrypted item has a random AES-GCM 256 content key, sealed with
//   the public key of everyone it is shared with. The item's content is one
//   AES-GCM blob with a fresh 12-byte IV per write.

const subtle = () => crypto.subtle

// Bytes on a plain ArrayBuffer, as Web Crypto takes them.
export type TBytes = Uint8Array<ArrayBuffer>

// OWASP's 2023 guidance for PBKDF2-HMAC-SHA256.
export const PBKDF2_ITERATIONS = 600_000

const RSA = {
  name: 'RSA-OAEP',
  modulusLength: 3072,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: 'SHA-256',
} as const

export const toBase64 = (bytes: ArrayBuffer | TBytes) => {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let text = ''
  for (const byte of view) text += String.fromCodePoint(byte)
  return btoa(text)
}

export const fromBase64 = (text: string): TBytes =>
  Uint8Array.from(atob(text), (character) => character.codePointAt(0) ?? 0)

export const randomBytes = (length: number): TBytes =>
  crypto.getRandomValues(new Uint8Array(new ArrayBuffer(length)))

// --- Keys -----------------------------------------------------------------

export const generateKeyPair = async () => {
  const pair = await subtle().generateKey(RSA, true, ['wrapKey', 'unwrapKey'])
  const spki = await subtle().exportKey('spki', pair.publicKey)
  return {
    privateKey: pair.privateKey,
    publicKey: pair.publicKey,
    publicKeyBase64: toBase64(spki),
  }
}

export const importPublicKey = (spkiBase64: string) =>
  subtle().importKey('spki', fromBase64(spkiBase64), RSA, false, ['wrapKey'])

// A key that seals the private key, from a passphrase or recovery code.
export const deriveFromPassword = async (
  password: string,
  salt: TBytes,
  iterations = PBKDF2_ITERATIONS,
) => {
  const material = await subtle().importKey(
    'raw',
    new TextEncoder().encode(password.normalize('NFKC')),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return subtle().deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  )
}

// The same from a high-entropy secret (a passkey's PRF output).
export const deriveFromSecret = async (secret: TBytes, salt: TBytes) => {
  const material = await subtle().importKey('raw', secret, 'HKDF', false, [
    'deriveKey',
  ])
  return subtle().deriveKey(
    {
      name: 'HKDF',
      salt,
      info: new TextEncoder().encode('catatsaja private key'),
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  )
}

export type TSealed = { iv: string; ct: string }

export const sealPrivateKey = async (
  privateKey: CryptoKey,
  sealingKey: CryptoKey,
): Promise<TSealed> => {
  const iv = randomBytes(12)
  const sealed = await subtle().wrapKey('pkcs8', privateKey, sealingKey, {
    name: 'AES-GCM',
    iv,
  })
  return { iv: toBase64(iv), ct: toBase64(sealed) }
}

// Opened as non-extractable: once unlocked, the key can be used but never
// read back out (not even from the browser's storage).
export const openPrivateKey = (sealed: TSealed, sealingKey: CryptoKey) =>
  subtle().unwrapKey(
    'pkcs8',
    fromBase64(sealed.ct),
    sealingKey,
    { name: 'AES-GCM', iv: fromBase64(sealed.iv) },
    RSA,
    false,
    ['unwrapKey'],
  )

// Re-sealing (a new passphrase) needs the key readable once: open an
// extractable copy for that.
export const openPrivateKeyForResealing = (
  sealed: TSealed,
  sealingKey: CryptoKey,
) =>
  subtle().unwrapKey(
    'pkcs8',
    fromBase64(sealed.ct),
    sealingKey,
    { name: 'AES-GCM', iv: fromBase64(sealed.iv) },
    RSA,
    true,
    // A private RSA-OAEP key only unwraps; asking for more fails to open.
    ['unwrapKey'],
  )

// --- Content --------------------------------------------------------------

export const generateContentKey = () =>
  subtle().generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ])

export const wrapContentKey = async (
  contentKey: CryptoKey,
  publicKey: CryptoKey,
) =>
  toBase64(
    await subtle().wrapKey('raw', contentKey, publicKey, { name: 'RSA-OAEP' }),
  )

// Extractable, so it can be sealed again for someone the item is shared
// with.
export const unwrapContentKey = (wrapped: string, privateKey: CryptoKey) =>
  subtle().unwrapKey(
    'raw',
    fromBase64(wrapped),
    privateKey,
    { name: 'RSA-OAEP' },
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  )

export type TEncrypted = { v: 1; iv: string; ct: string }

export const encryptJson = async (
  value: unknown,
  contentKey: CryptoKey,
): Promise<TEncrypted> => {
  const iv = randomBytes(12)
  const ct = await subtle().encrypt(
    { name: 'AES-GCM', iv },
    contentKey,
    new TextEncoder().encode(JSON.stringify(value)),
  )
  return { v: 1, iv: toBase64(iv), ct: toBase64(ct) }
}

export const decryptJson = async <T>(
  encrypted: TEncrypted,
  contentKey: CryptoKey,
): Promise<T> => {
  const plain = await subtle().decrypt(
    { name: 'AES-GCM', iv: fromBase64(encrypted.iv) },
    contentKey,
    fromBase64(encrypted.ct),
  )
  return JSON.parse(new TextDecoder().decode(plain)) as T
}

// A stable id for a label under an item's content key (a book's month,
// "2026-10"), that reveals nothing about the label without the key: a key
// for HMAC-SHA-256 is first derived from it (HKDF), so the content key itself
// is never used for anything but AES-GCM.
export const keyedId = async (contentKey: CryptoKey, label: string) => {
  const material = await subtle().importKey(
    'raw',
    await subtle().exportKey('raw', contentKey),
    'HKDF',
    false,
    ['deriveKey'],
  )
  const hmacKey = await subtle().deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(new ArrayBuffer(0)),
      info: new TextEncoder().encode('catatsaja keyed id'),
    },
    material,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    ['sign'],
  )
  const mac = new Uint8Array(
    await subtle().sign('HMAC', hmacKey, new TextEncoder().encode(label)),
  )
  let hex = ''
  for (const byte of mac.slice(0, 16)) hex += byte.toString(16).padStart(2, '0')
  return hex
}

// --- Recovery code ----------------------------------------------------------

// 20 random bytes (160 bits) in Crockford base32: 32 characters, shown in
// groups of four. No I, L, O or U, so it reads back without mistakes.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export const generateRecoveryCode = () => {
  const bytes = randomBytes(20)
  let bits = 0
  let value = 0
  let code = ''
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      code += ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  return code.match(/.{4}/g)?.join('-') ?? code
}

// What was typed back to the code's characters: case, spaces and dashes
// don't matter, and the look-alikes read as intended (O → 0, I and L → 1).
export const normalizeRecoveryCode = (text: string) =>
  text
    .toUpperCase()
    .replaceAll(/[\s-]/g, '')
    .replaceAll('O', '0')
    .replaceAll(/[IL]/g, '1')
