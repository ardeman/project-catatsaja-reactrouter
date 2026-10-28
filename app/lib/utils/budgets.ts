// A book's budgets: a limit per expense category or on all of the book's
// spending, all of them for each month or all for the whole book, and what is
// left of each. Computed in the browser, in the book's currency;
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
  period?: 'month' | 'book'
}

export type TBudgetUsage = {
  id: string
  category: string
  period: 'month' | 'book'
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
// (two devices may have added one each at once). The period is one choice for
// all budgets, stored on each: the first budget's.
export const normalizeBudgets = <T extends TBudget>(budgets: T[] = []): T[] => {
  const seen = new Set<string>()
  const period = budgets[0]?.period
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
        ...(period && { period }),
        limit: text === '' || Number.isNaN(limit) ? null : limit,
      }
    })
}

// What each budget has spent and what is left: in a month (YYYY-MM), or
// since the book began for a whole-book budget. The most used first, after
// the one on all spending. Budgets without a limit above 0 are left out.
export const budgetUsage = (
  entries: TEntryLike[],
  budgets: TBudget[] = [],
  month: string,
): TBudgetUsage[] => {
  // Per category, plus the whole book's, for the month and for all time.
  const spent = {
    month: new Map<string, number>(),
    book: new Map<string, number>(),
  }
  const add = (totals: Map<string, number>, key: string, total: number) =>
    totals.set(key, (totals.get(key) ?? 0) + total)
  for (const entry of entries) {
    if (entry.type !== 'expense') continue
    const total = entry.quantity * entry.amount * entry.rate
    const periods =
      monthOf(entry.date) === month
        ? (['month', 'book'] as const)
        : (['book'] as const)
    for (const period of periods) {
      add(spent[period], entry.category, total)
      add(spent[period], wholeBook, total)
    }
  }
  return normalizeBudgets(budgets)
    .filter((budget) => (budget.limit ?? 0) > 0)
    .map((budget) => {
      const limit = budget.limit ?? 0
      const period = budget.period ?? 'month'
      const used = spent[period].get(budget.category) ?? 0
      return {
        id: budget.id,
        category: budget.category,
        period,
        limit,
        spent: used,
        left: limit - used,
        share: used / limit,
      }
    })
    .toSorted(
      (a, b) =>
        Number(b.category === wholeBook) - Number(a.category === wholeBook) ||
        b.share - a.share,
    )
}
