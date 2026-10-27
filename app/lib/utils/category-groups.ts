// A book's own groups of categories (such as Needs = food + bills): what
// each adds up to in a range, and keeping each category in one group at
// most, so the shares add up to the whole. Computed in the browser, in the
// book's currency; nothing is stored. No app imports, so `pnpm test:unit`
// can run it.

type TEntryLike = {
  type: 'income' | 'expense'
  category: string
  quantity: number
  amount: number
  rate: number
}

type TGroup = {
  id: string
  name: string
  categories: string[]
}

export type TGroupTotal = {
  // A group's id, or `ungrouped` for the categories in none.
  id: string
  name: string
  total: number
  share: number
}

export const ungrouped = 'ungrouped'

// Each category in the first group that has it (two devices may have put
// it in two at once), and names without surrounding spaces.
export const normalizeGroups = <T extends TGroup>(groups: T[] = []): T[] => {
  const seen = new Set<string>()
  return groups.map((group) => {
    const categories = group.categories.filter((category) => {
      if (seen.has(category)) return false
      seen.add(category)
      return true
    })
    return { ...group, name: group.name.trim(), categories }
  })
}

// Puts a category in a group, taking it out of any other, or in none when
// `id` is undefined.
export const assignCategory = <T extends TGroup>(
  groups: T[],
  id: string | undefined,
  category: string,
): T[] =>
  groups.map((group) => {
    const categories = group.categories.filter((item) => item !== category)
    return group.id === id
      ? { ...group, categories: [...categories, category] }
      : { ...group, categories }
  })

// What each group adds up to among one type's entries, largest first, and
// the rest as `ungrouped` at the end. Groups with nothing in the range are
// left out; none at all when no group has anything.
export const groupTotals = (
  entries: TEntryLike[],
  type: TEntryLike['type'],
  groups: TGroup[] = [],
): TGroupTotal[] => {
  const groupOf = new Map<string, string>()
  for (const group of normalizeGroups(groups))
    for (const category of group.categories) groupOf.set(category, group.id)

  const totals = new Map<string, number>()
  let sum = 0
  for (const entry of entries) {
    if (entry.type !== type) continue
    const total = entry.quantity * entry.amount * entry.rate
    const id = groupOf.get(entry.category) ?? ungrouped
    totals.set(id, (totals.get(id) ?? 0) + total)
    sum += total
  }
  if (sum === 0) return []

  const rows = groups
    .map((group) => ({
      id: group.id,
      name: group.name.trim(),
      total: totals.get(group.id) ?? 0,
      share: (totals.get(group.id) ?? 0) / sum,
    }))
    .filter((row) => row.total > 0)
    .toSorted((a, b) => b.total - a.total)
  if (rows.length === 0) return []
  const rest = totals.get(ungrouped) ?? 0
  return rest > 0
    ? [...rows, { id: ungrouped, name: '', total: rest, share: rest / sum }]
    : rows
}
