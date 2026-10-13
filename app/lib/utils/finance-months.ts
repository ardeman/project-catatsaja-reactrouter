import { TFinanceEntry } from '~/lib/types/finance'

import { decryptJson, encryptJson, keyedId, TEncrypted } from './crypto'
import { decrypted } from './encryption-session'

// A book's entries once moved out of the book document: one document per
// month of their dates (`finances/{id}/months/{monthId}`), so a book never
// reaches Firestore's 1 MiB per document and an edit writes only its month.
// Plain, the month is the id ("2026-10") and the document holds it with its
// entries; encrypted, both are one blob under the book's content key and
// the id is derived from that key, so the month can't be read from it.

export type TMonth = { month: string; content: TFinanceEntry[] }

const monthOf = (entry: TFinanceEntry) => entry.date.slice(0, 7)

// Entries by month, each month keeping the entries' order.
export const groupByMonth = (entries: TFinanceEntry[]) => {
  const months = new Map<string, TFinanceEntry[]>()
  for (const entry of entries) {
    const month = monthOf(entry)
    const group = months.get(month)
    if (group) group.push(entry)
    else months.set(month, [entry])
  }
  return months
}

const monthDocumentId = async (month: string, contentKey?: CryptoKey) =>
  contentKey ? keyedId(contentKey, month) : month

export const encodeMonth = async (
  month: string,
  content: TFinanceEntry[],
  contentKey?: CryptoKey,
) => ({
  id: await monthDocumentId(month, contentKey),
  data: contentKey
    ? { encrypted: await encryptJson({ month, content }, contentKey) }
    : { month, content },
})

// A stored month as the app uses it. Undefined when it can't be read here:
// no key, or not the book's current key (a new key is being written to its
// months), so the book waits for the rest instead of showing it partly.
// Unchanged months are taken from the session's cache, like items.
export const decodeMonth = async (
  path: string,
  data: Record<string, unknown>,
  contentKey?: CryptoKey,
): Promise<TMonth | undefined> => {
  if (!data.encrypted)
    return typeof data.month === 'string' && Array.isArray(data.content)
      ? { month: data.month, content: data.content as TFinanceEntry[] }
      : undefined
  if (!contentKey) return
  const encrypted = data.encrypted as TEncrypted
  const cached = decrypted.get(path)
  if (cached?.iv === encrypted.iv && cached.contentKey === contentKey)
    return cached.plain as TMonth
  try {
    const plain = await decryptJson<TMonth>(encrypted, contentKey)
    decrypted.set(path, { iv: encrypted.iv, wrapped: '', contentKey, plain })
    return plain
  } catch {
    return
  }
}

// A book's entries from its months, oldest month first.
export const entriesOfMonths = (months: TMonth[]) =>
  months
    .toSorted((a, b) => a.month.localeCompare(b.month))
    .flatMap((month) => month.content)
