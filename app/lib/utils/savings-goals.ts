// A book's savings goals: what to put aside on each payday so every goal is
// ready when its month starts. Computed in the browser, in the book's
// currency; nothing is stored but the goals and the payday. No app imports,
// so `pnpm test:unit` can run it.

type TEntryLike = {
  date: string
  type: 'income' | 'expense'
  category: string
  description: string
  quantity: number
  amount: number
  rate: number
  // The savings goal an expense was paid toward.
  goal?: string
}

type TAccountLike = { balance: number | null }

type TGoal = {
  id: string
  name: string
  amount: number | null
  // The month it is needed in, as YYYY-MM.
  due: string
  // Marked done by hand; a goal is also done once realized covers it.
  done: boolean
  // What was paid toward it outside the book's linked expenses, such as
  // before linking them.
  spent: number | null
}

// A goal with what was paid toward it: `spent` plus its linked expenses.
type TRealizedGoal<T extends TGoal = TGoal> = T & {
  realized: number
  // What is still to pay.
  remaining: number
}

type TGoalMonth<T extends TGoal = TGoal> = {
  due: string
  goals: TRealizedGoal<T>[]
  // What is still to pay for them.
  total: number
  // This month's goals and every earlier one's.
  cumulative: number
  // What savings don't cover of the cumulative total.
  shortfall: number
  // Paydays from today until the month starts; undefined without a payday.
  paydays?: number
  // What each of those paydays must put aside; undefined without paydays.
  perPayday?: number
}

const toAmount = (value: unknown = '') => {
  const text = String(value ?? '')
  const amount = Number(text)
  return text === '' || Number.isNaN(amount) ? null : amount
}

// Amounts arrive as typed text ("1500000") until saved as numbers; one left
// empty is saved as null.
export const normalizeGoals = <T extends TGoal>(goals: T[] = []): T[] =>
  goals.map((goal) => ({
    ...goal,
    amount: toAmount(goal.amount),
    spent: toAmount(goal.spent),
  }))

// The entry linked to `goal`, or to none: only expenses are, and an entry
// without a goal has no `goal` key (Firestore refuses undefined).
export const linkGoal = <
  T extends { type: 'income' | 'expense'; goal?: string },
>(
  { goal: _previous, ...entry }: T,
  goal?: string,
) => (goal && entry.type === 'expense' ? { ...entry, goal } : entry) as T

// In the book's currency, by goal id: what its linked expenses add up to.
export const linkedTotals = (entries: TEntryLike[] = []) => {
  const totals = new Map<string, number>()
  for (const entry of entries)
    if (entry.type === 'expense' && entry.goal)
      totals.set(
        entry.goal,
        (totals.get(entry.goal) ?? 0) +
          entry.quantity * entry.amount * entry.rate,
      )
  return totals
}

// Each goal with what was realized; a goal is done when marked so or once
// realized covers its amount.
export const realizeGoals = <T extends TGoal>(
  goals: T[] = [],
  entries: TEntryLike[] = [],
): TRealizedGoal<T>[] => {
  const linked = linkedTotals(entries)
  return normalizeGoals(goals).map((goal) => {
    const amount = goal.amount ?? 0
    const realized = (goal.spent ?? 0) + (linked.get(goal.id) ?? 0)
    return {
      ...goal,
      done: goal.done || (amount > 0 && realized >= amount),
      realized,
      remaining: Math.max(0, amount - realized),
    }
  })
}

// A day of the month from 1 to 31, or null when not set.
export const normalizePayday = (value: unknown) => {
  const day = Number(value)
  return Number.isSafeInteger(day) && day >= 1 && day <= 31 ? day : null
}

// The month after a YYYY-MM month, or `count` months later.
export const addMonths = (month: string, count = 1) => {
  const [year, monthIndex] = month.split('-').map(Number)
  const date = new Date(Date.UTC(year, monthIndex - 1 + count, 1))
  return date.toISOString().slice(0, 7)
}

const daysIn = (month: string) => {
  const [year, monthIndex] = month.split('-').map(Number)
  return new Date(Date.UTC(year, monthIndex, 0)).getUTCDate()
}

// Paydays from today (YYYY-MM-DD, counted if it is one) up to the last day
// before `due` (YYYY-MM) starts. A payday past a month's end falls on its
// last day (the 31st is the 30th in November).
export const paydaysBefore = (today: string, payday: number, due: string) => {
  let count = 0
  for (let month = today.slice(0, 7); month < due; month = addMonths(month)) {
    const day = Math.min(payday, daysIn(month))
    const date = `${month}-${String(day).padStart(2, '0')}`
    if (date >= today) count += 1
  }
  return count
}

// What the book has to save from: its accounts' total when it has any
// balance entered (what the person actually holds), otherwise its balance
// from entries. Never below 0.
export const bookSavings = (accounts: TAccountLike[] = [], balance: number) => {
  const held = accounts.filter((account) => account.balance !== null)
  if (held.length > 0)
    return {
      amount: Math.max(
        0,
        held.reduce((total, account) => total + Number(account.balance), 0),
      ),
      from: 'accounts' as const,
    }
  return { amount: Math.max(0, balance), from: 'balance' as const }
}

// The plan for the goals not done yet: grouped by due month, earliest
// first, each with what is still to pay (less what was realized), what is
// short and what each payday until then
// must put aside. The highest of those is what to save a month; anything
// short in a month with no payday left is needed now. Amounts to save are
// rounded up to the book's smallest unit.
export const savingsPlan = <T extends TGoal>({
  goals = [],
  entries = [],
  savings,
  payday,
  today,
  fractionDigits = 0,
}: {
  goals?: T[]
  // The book's entries, for the expenses linked to goals.
  entries?: TEntryLike[]
  savings: number
  payday: number | null
  today: string
  fractionDigits?: number
}) => {
  const unit = 10 ** fractionDigits
  const roundUp = (value: number) => Math.ceil(value * unit - 1e-9) / unit
  const realized = realizeGoals(goals, entries)
  const open = realized
    .filter((goal) => !goal.done && goal.remaining > 0)
    .toSorted((a, b) => a.due.localeCompare(b.due))

  const months: TGoalMonth<T>[] = []
  let cumulative = 0
  for (const goal of open) {
    const amount = goal.remaining
    cumulative += amount
    const last = months.at(-1)
    if (last?.due === goal.due) {
      last.goals.push(goal)
      last.total += amount
      last.cumulative = cumulative
    } else
      months.push({
        due: goal.due,
        goals: [goal],
        total: amount,
        cumulative,
        shortfall: 0,
      })
  }

  let monthly = 0
  let neededNow = 0
  for (const month of months) {
    month.shortfall = Math.max(0, month.cumulative - savings)
    if (payday === null) continue
    month.paydays = paydaysBefore(today, payday, month.due)
    if (month.paydays > 0) {
      month.perPayday = roundUp(month.shortfall / month.paydays)
      monthly = Math.max(monthly, month.perPayday)
    } else neededNow = Math.max(neededNow, month.shortfall)
  }

  return {
    months,
    total: cumulative,
    monthly,
    neededNow,
    done: realized.filter((goal) => goal.done),
  }
}

// A payday to suggest: the day the book's largest regular income (the same
// category and description in at least two months) arrives most often, the
// latest day on a tie.
export const suggestPayday = (entries: TEntryLike[]) => {
  const incomes = new Map<
    string,
    {
      category: string
      description: string
      total: number
      months: Set<string>
      days: number[]
    }
  >()
  for (const entry of entries) {
    if (entry.type !== 'income') continue
    const key = `${entry.category}\n${entry.description.trim().toLowerCase()}`
    const income = incomes.get(key) ?? {
      category: entry.category,
      description: entry.description.trim(),
      total: 0,
      months: new Set<string>(),
      days: [],
    }
    income.total += entry.quantity * entry.amount * entry.rate
    income.months.add(entry.date.slice(0, 7))
    income.days.push(Number(entry.date.slice(8, 10)))
    incomes.set(key, income)
  }

  const perMonth = (income: { total: number; months: Set<string> }) =>
    income.total / income.months.size
  let largest
  for (const income of incomes.values())
    if (
      income.months.size >= 2 &&
      (!largest || perMonth(income) > perMonth(largest))
    )
      largest = income
  if (!largest) return

  const counts = new Map<number, number>()
  for (const day of largest.days) counts.set(day, (counts.get(day) ?? 0) + 1)
  const [[day]] = [...counts].toSorted((a, b) => b[1] - a[1] || b[0] - a[0])
  return {
    day,
    category: largest.category,
    description: largest.description,
  }
}
