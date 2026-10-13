// Entries for the same thing, grouped across a book ("Telur", "telur 1kg"
// and "TELUR" are one item), with what was spent on it and how its price
// moved. Computed in the browser, in the book's currency; nothing is stored.
// No app imports, so `pnpm test:unit` can run it.

type TEntryLike = {
  date: string
  type: 'income' | 'expense'
  description: string
  quantity: number
  amount: number
  rate: number
}

export type TSimilarItem = {
  key: string
  // The spelling used most often (the latest on a tie).
  name: string
  // Entries for it, and the units they add up to.
  count: number
  quantity: number
  total: number
  // Price of one unit: on average, and in the latest entry.
  averageUnit: number
  latestUnit: number
  // The latest unit price against the average (0.1 is 10% more); undefined
  // when every entry had the same price.
  change: number | undefined
}

// Units that say how much, not what: sizes, counts and amounts.
const UNIT =
  'kg|g|gr|gram|mg|ml|l|lt|ltr|liter|litre|cc|pcs|pc|pack|pak|bks|btl|sachet|buah|biji|rb|ribu|k|jt|juta'
const NUMBER = String.raw`\d+(?:[.,]\d+)?`
// "1kg", "500ml", "50rb", "x2", "2x".
const MEASURE = new RegExp(String.raw`^(?:${NUMBER}(?:${UNIT}|x)|x\d+)$`)
const BARE_NUMBER = new RegExp(`^${NUMBER}$`)
const UNIT_WORD = new RegExp(`^(?:${UNIT})$`)

// The part of a description that names the thing, for grouping: lower case,
// no accents or punctuation, without measures ("1kg", "1,5 l", "x2"). A
// number on its own stays ("Indomaret 24 jam"). Empty when nothing is left.
export const itemKey = (description: string) => {
  const words = description
    .normalize('NFKD')
    .replaceAll(/\p{M}/gu, '')
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{N}.,]+/gu, ' ')
    .split(' ')
    .map((word) => word.replaceAll(/^[.,]+|[.,]+$/g, ''))
    .filter(Boolean)
  const kept: string[] = []
  for (let index = 0; index < words.length; index++) {
    const word = words[index]
    if (MEASURE.test(word)) continue
    // A number with its unit as the next word.
    if (BARE_NUMBER.test(word) && UNIT_WORD.test(words[index + 1] ?? '')) {
      index++
      continue
    }
    kept.push(word)
  }
  return kept.join(' ')
}

// Items of one type that appear in at least `minimum` entries, the largest
// total first.
export const similarItems = (
  entries: TEntryLike[],
  type: TEntryLike['type'],
  minimum = 2,
): TSimilarItem[] => {
  const groups = new Map<string, TEntryLike[]>()
  for (const entry of entries) {
    if (entry.type !== type) continue
    const key = itemKey(entry.description)
    if (!key) continue
    groups.set(key, [...(groups.get(key) ?? []), entry])
  }

  const items: TSimilarItem[] = []
  for (const [key, group] of groups) {
    if (group.length < minimum) continue
    // Oldest first; entries on the same day keep the order they were added.
    const ordered = group
      .map((entry, index) => ({ entry, index }))
      .toSorted(
        (a, b) => a.entry.date.localeCompare(b.entry.date) || a.index - b.index,
      )
      .map(({ entry }) => entry)

    const spellings = new Map<string, number>()
    let quantity = 0
    let total = 0
    for (const entry of ordered) {
      const name = entry.description.trim()
      spellings.set(name, (spellings.get(name) ?? 0) + 1)
      quantity += entry.quantity
      total += entry.quantity * entry.amount * entry.rate
    }
    let name = ''
    let best = 0
    for (const [spelling, times] of spellings)
      if (times >= best) {
        name = spelling
        best = times
      }

    const unitPrices = ordered.map((entry) => entry.amount * entry.rate)
    const latest = ordered.at(-1)
    const latestUnit = latest ? latest.amount * latest.rate : 0
    const averageUnit = quantity > 0 ? total / quantity : 0
    const isSamePrice = unitPrices.every((price) => price === unitPrices[0])
    items.push({
      key,
      name,
      count: ordered.length,
      quantity,
      total,
      averageUnit,
      latestUnit,
      change:
        isSamePrice || averageUnit === 0
          ? undefined
          : latestUnit / averageUnit - 1,
    })
  }
  return items.toSorted((a, b) => b.total - a.total)
}
