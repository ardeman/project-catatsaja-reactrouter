// Copying a book's analysis setup (groups of categories, budgets, keywords,
// savings goals and payday) into another book. It only adds what the book
// doesn't have yet, so nothing of its own is lost, and amounts are turned
// into its currency. No app imports, so `pnpm test:unit` can run it.

type TGroup = { id: string; name: string; categories: string[] }
type TBudget = {
  id: string
  category: string
  limit: number | null
  period?: 'month' | 'book'
}
type TKeyword = { id: string; text: string }
type TGoal = {
  id: string
  name: string
  amount: number | null
  due: string
  done: boolean
  spent: number | null
}

export type TAnalysisSetup = {
  categoryGroups?: TGroup[]
  budgets?: TBudget[]
  keywords?: TKeyword[]
  goals?: TGoal[]
  payday?: number | null
}

// Which of the other book's things to bring across. When omitted, everything
// that can be copied is. When set, only the listed ids (and payday when true).
export type TCopyOnly = {
  categoryGroups?: Iterable<string>
  budgets?: Iterable<string>
  keywords?: Iterable<string>
  goals?: Iterable<string>
  payday?: boolean
}

type TOptions = {
  // Units of this book's currency for 1 unit of the other's; undefined when
  // no rate is known, which leaves the amounts empty.
  rate: number | undefined
  // This book's currency's decimals.
  fractionDigits: number
  newId: () => string
  only?: TCopyOnly
}

const sameText = (text: string) => text.trim().toLocaleLowerCase()

// Goals still to save for; done ones are the other book's history.
const openGoals = (setup: TAnalysisSetup) =>
  (setup.goals ?? []).filter((goal) => !goal.done)

// What picking a book would offer to copy: non-empty groups, every budget,
// trimmed keywords, open goals, and the payday when set.
export const copyableFrom = (from: TAnalysisSetup) => ({
  categoryGroups: (from.categoryGroups ?? []).filter(
    (group) => group.categories.length > 0,
  ),
  budgets: [...(from.budgets ?? [])],
  keywords: (from.keywords ?? []).filter((keyword) => keyword.text.trim()),
  goals: openGoals(from),
  payday: from.payday || null,
})

// How many things copying from `from` would bring, before looking at what
// this book already has: to show which books have something to copy.
export const setupSize = (from: TAnalysisSetup) => {
  const items = copyableFrom(from)
  return (
    items.categoryGroups.length +
    items.budgets.length +
    items.keywords.length +
    items.goals.length +
    (items.payday ? 1 : 0)
  )
}

const asSet = (ids: Iterable<string> | undefined) =>
  ids === undefined ? undefined : new Set(ids)

// This book's setup with what `from` has and it doesn't: categories not in
// any of its groups (into its group of the same name, or a new one), budgets
// for categories it has none for, keywords and open goals it doesn't have by
// name, and the payday when it has none. `added` counts them. `only` limits
// which of `from`'s things are considered.
export const copySetup = (
  to: TAnalysisSetup,
  from: TAnalysisSetup,
  { rate, fractionDigits, newId, only }: TOptions,
) => {
  const {
    categoryGroups: fromGroups = [],
    budgets: fromBudgets = [],
    keywords: fromKeywords = [],
  } = from
  let added = 0
  const convert = (amount: number | null) =>
    amount === null || rate === undefined
      ? null
      : Number((amount * rate).toFixed(fractionDigits))

  const onlyGroups = asSet(only?.categoryGroups)
  const onlyBudgets = asSet(only?.budgets)
  const onlyKeywords = asSet(only?.keywords)
  const onlyGoals = asSet(only?.goals)
  const shouldCopyGroups = !only || only.categoryGroups !== undefined
  const shouldCopyBudgets = !only || only.budgets !== undefined
  const shouldCopyKeywords = !only || only.keywords !== undefined
  const shouldCopyGoals = !only || only.goals !== undefined
  const shouldCopyPayday = !only || only.payday === true

  const categoryGroups = (to.categoryGroups ?? []).map((group) => ({
    ...group,
    categories: [...group.categories],
  }))
  const grouped = new Set(categoryGroups.flatMap((group) => group.categories))
  if (shouldCopyGroups) {
    for (const group of fromGroups) {
      if (onlyGroups && !onlyGroups.has(group.id)) continue
      const categories = group.categories.filter(
        (category) => !grouped.has(category),
      )
      if (categories.length === 0) continue
      for (const category of categories) grouped.add(category)
      added += categories.length
      const same = categoryGroups.find(
        (existing) => sameText(existing.name) === sameText(group.name),
      )
      if (same) same.categories.push(...categories)
      else
        categoryGroups.push({
          id: newId(),
          name: group.name.trim(),
          categories,
        })
    }
  }

  const budgets = [...(to.budgets ?? [])]
  const budgeted = new Set(budgets.map((budget) => budget.category))
  if (shouldCopyBudgets) {
    for (const budget of fromBudgets) {
      if (onlyBudgets && !onlyBudgets.has(budget.id)) continue
      if (budgeted.has(budget.category)) continue
      budgeted.add(budget.category)
      budgets.push({
        id: newId(),
        category: budget.category,
        limit: convert(budget.limit),
        ...(budget.period && { period: budget.period }),
      })
      added++
    }
  }

  const keywords = [...(to.keywords ?? [])]
  const words = new Set(keywords.map((keyword) => sameText(keyword.text)))
  if (shouldCopyKeywords) {
    for (const keyword of fromKeywords) {
      if (onlyKeywords && !onlyKeywords.has(keyword.id)) continue
      const word = sameText(keyword.text)
      if (!word || words.has(word)) continue
      words.add(word)
      keywords.push({ id: newId(), text: keyword.text.trim() })
      added++
    }
  }

  const goals = [...(to.goals ?? [])]
  const names = new Set(goals.map((goal) => sameText(goal.name)))
  if (shouldCopyGoals) {
    for (const goal of openGoals(from)) {
      if (onlyGoals && !onlyGoals.has(goal.id)) continue
      const name = sameText(goal.name)
      if (names.has(name)) continue
      names.add(name)
      goals.push({
        id: newId(),
        name: goal.name.trim(),
        amount: convert(goal.amount),
        due: goal.due,
        done: false,
        spent: null,
      })
      added++
    }
  }

  const payday =
    shouldCopyPayday && !to.payday && from.payday
      ? from.payday
      : (to.payday ?? null)
  if (shouldCopyPayday && !to.payday && from.payday) added++

  return { categoryGroups, budgets, keywords, goals, payday, added }
}
