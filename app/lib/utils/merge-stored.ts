// Three-way merges for forms that edit an item someone else may save at the
// same time (another device, or a person it is shared with). `base` is the
// stored value the form last took in, `local` what is on screen, `remote`
// the newly stored value. No app imports, so `pnpm test:unit` can run it.

export const isSameJson = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b)

// One value: a change made here and not saved yet is kept, otherwise the
// stored value is taken.
export const mergeValue = <T>(base: T, local: T, remote: T): T =>
  isSameJson(local, base) ? remote : local

// A list of items with an `id`, item by item: items added, changed or
// deleted here are kept as they are on screen, everything else (including
// items added, changed or deleted elsewhere) as stored. A missing list is
// an empty one.
export const mergeById = <T extends { id: string }>(
  base: T[] = [],
  local: T[] = [],
  remote: T[] = [],
): T[] => {
  const baseById = new Map(base.map((item) => [item.id, item]))
  const localById = new Map(local.map((item) => [item.id, item]))
  const remoteIds = new Set(remote.map((item) => item.id))
  const isChangedHere = (item: T) => {
    const before = baseById.get(item.id)
    return !before || !isSameJson(before, item)
  }
  const merged = remote.flatMap((item) => {
    const mine = localById.get(item.id)
    // Deleted here, unless it is new elsewhere.
    if (!mine) return baseById.has(item.id) ? [] : [item]
    return [isChangedHere(mine) ? mine : item]
  })
  // Added here, or changed here after being deleted elsewhere.
  const added = local.filter(
    (item) => !remoteIds.has(item.id) && isChangedHere(item),
  )
  return [...merged, ...added]
}
