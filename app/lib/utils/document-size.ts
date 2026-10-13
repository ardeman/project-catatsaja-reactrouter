// How much room a document takes in Firestore, which refuses any over
// 1 MiB. Follows Firestore's storage size rules
// (https://firebase.google.com/docs/firestore/storage-size); an encrypted
// item's content is one base64 AES-GCM blob (`crypto.ts`) plus a sealed key
// per person, so it is measured as that. No app imports, so
// `pnpm test:unit` can run it.

export const maxDocumentBytes = 1_048_576

const encoder = new TextEncoder()

const stringSize = (text: string) => encoder.encode(text).length + 1

const isTimestamp = (value: object) =>
  value instanceof Date || ('seconds' in value && 'nanoseconds' in value)

export const valueSize = (value: unknown): number => {
  if (value === null || value === undefined) return 1
  if (typeof value === 'string') return stringSize(value)
  if (typeof value === 'number') return 8
  if (typeof value === 'boolean') return 1
  if (typeof value !== 'object') return 0
  let total = 0
  if (Array.isArray(value)) {
    for (const item of value) total += valueSize(item)
    return total
  }
  if (isTimestamp(value)) return 8
  for (const [field, item] of Object.entries(value))
    if (item !== undefined) total += stringSize(field) + valueSize(item)
  return total
}

export const documentSize = (path: string, fields: Record<string, unknown>) => {
  let total = 16 + 32 + valueSize(fields)
  for (const part of path.split('/')) total += stringSize(part)
  return total
}

// Base64 length of `bytes` bytes.
const base64Length = (bytes: number) => Math.ceil(bytes / 3) * 4

// An item as stored: its content fields in one blob when encrypted, with an
// RSA-OAEP 3072 key (384 bytes) sealed for each person who can read it.
export const storedSize = ({
  path,
  fields,
  contentFields,
  isEncrypted,
  readers,
}: {
  path: string
  fields: Record<string, unknown>
  contentFields: readonly string[]
  isEncrypted: boolean
  readers: string[]
}) => {
  if (!isEncrypted) return documentSize(path, fields)
  const content = Object.fromEntries(
    contentFields
      .filter((field) => Object.hasOwn(fields, field))
      .map((field) => [field, fields[field]]),
  )
  const rest = Object.fromEntries(
    Object.entries(fields).filter(([field]) => !contentFields.includes(field)),
  )
  const plainBytes = encoder.encode(JSON.stringify(content)).length
  return documentSize(path, {
    ...rest,
    encrypted: {
      v: 1,
      iv: 'x'.repeat(base64Length(12)),
      // The 16-byte authentication tag is part of the ciphertext.
      ct: 'x'.repeat(base64Length(plainBytes + 16)),
    },
    keys: Object.fromEntries(
      readers.map((uid) => [uid, 'x'.repeat(base64Length(384))]),
    ),
  })
}
