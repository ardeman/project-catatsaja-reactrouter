// A book's budgets: a monthly limit per expense category or on all of the
// book's spending, and what is left of it in a month. Computed in the browser, in the book's currency;
// nothing is stored but the limits. No app imports, so `pnpm test:unit`
// can run it.

type TEntryLike = {
  date: string
  type: 'income' | 'expense'
  category: string
  quantity: number
  amount: number
  rate: number
}

type TBudget = {
  id: string
  category: string
  limit: number | null
}

export type TBudgetUsage = {
  id: string
  category: string
  limit: number
  spent: number
  // Negative once spending goes over the limit.
  left: number
  share: number
}

// The category of the budget that limits all of the book's spending.
export const wholeBook = 'all'

// The month of a YYYY-MM-DD date, as YYYY-MM.
export const monthOf = (date: string) => date.slice(0, 7)

// Limits arrive as typed text ("1500000") until saved as numbers; one left
// empty is saved as null. A category keeps the first budget that has it
// (two devices may have added one each at once).
export const normalizeBudgets = <T extends TBudget>(budgets: T[] = []): T[] => {
  const seen = new Set<string>()
  return budgets
    .filter((budget) => {
      if (seen.has(budget.category)) return false
      seen.add(budget.category)
      return true
    })
    .map((budget) => {
      const text = String(budget.limit ?? '')
      const limit = Number(text)
      return {
        ...budget,
        limit: text === '' || Number.isNaN(limit) ? null : limit,
      }
    })
}

// What each budget has spent in a month (YYYY-MM) and what is left, the
// most used first, after the whole book's. Budgets without a limit above 0
// are left out.
export const budgetUsage = (
  entries: TEntryLike[],
  budgets: TBudget[] = [],
  month: string,
): TBudgetUsage[] => {
  const spentBy = new Map<string, number>()
  let spentAll = 0
  for (const entry of entries) {
    if (entry.type !== 'expense' || monthOf(entry.date) !== month) continue
    const total = entry.quantity * entry.amount * entry.rate
    spentBy.set(entry.category, (spentBy.get(entry.category) ?? 0) + total)
    spentAll += total
  }
  return normalizeBudgets(budgets)
    .filter((budget) => (budget.limit ?? 0) > 0)
    .map((budget) => {
      const limit = budget.limit ?? 0
      const spent =
        budget.category === wholeBook
          ? spentAll
          : (spentBy.get(budget.category) ?? 0)
      return {
        id: budget.id,
        category: budget.category,
        limit,
        spent,
        left: limit - spent,
        share: spent / limit,
      }
    })
    .toSorted(
      (a, b) =>
        Number(b.category === wholeBook) - Number(a.category === wholeBook) ||
        b.share - a.share,
    )
}
