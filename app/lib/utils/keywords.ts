// A book's keywords: words to look for in entries' descriptions ("bensin",
// "grab, gojek"), with what the entries that have them add up to.
// Computed in the browser, in the book's currency; nothing is stored but
// the keywords. No app imports, so `pnpm test:unit` can run it.

type TEntryLike = {
  type: 'income' | 'expense'
  description: string
  quantity: number
  amount: number
  rate: number
}

type TKeyword = {
  id: string
  text: string
}

export type TKeywordTotal = {
  id: string
  text: string
  count: number
  total: number
  // Of everything of that type in the range; keywords can overlap, so the
  // shares need not add up to 100%.
  share: number
}

// The words a keyword stands for: commas separate alternatives, case
// doesn't count.
const termsOf = (text: string) =>
  text
    .toLocaleLowerCase()
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean)

// Trimmed, without empty ones, each keyword once (two devices may have
// added the same one at once).
export const normalizeKeywords = <T extends TKeyword>(
  keywords: T[] = [],
): T[] => {
  const seen = new Set<string>()
  return keywords
    .map((keyword) => ({ ...keyword, text: keyword.text.trim() }))
    .filter((keyword) => {
      const key = termsOf(keyword.text).join(',')
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

// What the entries of a type whose description has each keyword add up
// to, the largest first. Keywords nothing matched are left out.
export const keywordTotals = (
  entries: TEntryLike[],
  type: TEntryLike['type'],
  keywords: TKeyword[] = [],
): TKeywordTotal[] => {
  const shown = entries.filter((entry) => entry.type === type)
  const all = shown.reduce(
    (sum, entry) => sum + entry.quantity * entry.amount * entry.rate,
    0,
  )
  return normalizeKeywords(keywords)
    .map(({ id, text }) => {
      const terms = termsOf(text)
      const matched = shown.filter((entry) => {
        const description = entry.description.toLocaleLowerCase()
        return terms.some((term) => description.includes(term))
      })
      const total = matched.reduce(
        (sum, entry) => sum + entry.quantity * entry.amount * entry.rate,
        0,
      )
      return {
        id,
        text,
        count: matched.length,
        total,
        share: all > 0 ? total / all : 0,
      }
    })
    .filter((row) => row.count > 0)
    .toSorted((a, b) => b.total - a.total)
}

export type TKeywordRow = {
  id: string
  text: string
  count: number
  // One per type with matching entries, in the order the types were given.
  totals: (Omit<TKeywordTotal, 'id' | 'text' | 'count'> & {
    type: TEntryLike['type']
    count: number
  })[]
}

// The keyword totals of several types in one list, a row per keyword with
// what it adds up to in each type, the largest altogether first.
export const combinedKeywordTotals = (
  entries: TEntryLike[],
  types: TEntryLike['type'][],
  keywords: TKeyword[] = [],
): TKeywordRow[] => {
  const rows: TKeywordRow[] = []
  const byId = new Map<string, TKeywordRow>()
  for (const type of types) {
    for (const { id, text, count, total, share } of keywordTotals(
      entries,
      type,
      keywords,
    )) {
      let row = byId.get(id)
      if (!row) {
        row = { id, text, count: 0, totals: [] }
        byId.set(id, row)
        rows.push(row)
      }
      row.count += count
      row.totals.push({ type, count, total, share })
    }
  }
  const sumOf = (row: TKeywordRow) =>
    row.totals.reduce((sum, { total }) => sum + total, 0)
  return rows.toSorted((a, b) => sumOf(b) - sumOf(a))
}
