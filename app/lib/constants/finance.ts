import {
  Banknote,
  BookOpen,
  Car,
  CircleEllipsis,
  Clapperboard,
  CreditCard,
  Gift,
  HeartPulse,
  Landmark,
  LucideIcon,
  Percent,
  Plane,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'

import { TFinanceEntry } from '~/lib/types/finance'

type TCategory = {
  // Translation key under finances.form.category.
  key: string
  type: TFinanceEntry['type']
  icon: LucideIcon
}

export const financeCategories: TCategory[] = [
  { key: 'fnb', type: 'expense', icon: UtensilsCrossed },
  { key: 'groceries', type: 'expense', icon: ShoppingBasket },
  { key: 'shopping', type: 'expense', icon: ShoppingBag },
  { key: 'emoney', type: 'expense', icon: Wallet },
  { key: 'transport', type: 'expense', icon: Car },
  { key: 'entertainment', type: 'expense', icon: Clapperboard },
  { key: 'vacation', type: 'expense', icon: Plane },
  { key: 'bills', type: 'expense', icon: Receipt },
  { key: 'health', type: 'expense', icon: HeartPulse },
  { key: 'social', type: 'expense', icon: Gift },
  { key: 'insurance', type: 'expense', icon: ShieldCheck },
  { key: 'investment', type: 'expense', icon: TrendingUp },
  { key: 'education', type: 'expense', icon: BookOpen },
  { key: 'family', type: 'expense', icon: Users },
  { key: 'loan', type: 'expense', icon: CreditCard },
  { key: 'fees', type: 'expense', icon: Landmark },
  { key: 'otherExpenses', type: 'expense', icon: CircleEllipsis },
  { key: 'income', type: 'income', icon: Banknote },
  { key: 'interest', type: 'income', icon: Percent },
  { key: 'otherIncome', type: 'income', icon: CircleEllipsis },
]

export const findCategory = (key: string) =>
  financeCategories.find((category) => category.key === key)

// Used when someone has no currencies set up yet.
export const fallbackCurrency = {
  code: 'IDR',
  symbol: 'Rp',
  maximumFractionDigits: 0,
}
