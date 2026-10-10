import {
  ArrowLeftRight,
  Award,
  Banknote,
  Bitcoin,
  BookOpen,
  Building2,
  Car,
  ChartLine,
  CircleEllipsis,
  Clapperboard,
  CreditCard,
  Gift,
  HandHeart,
  HeartPulse,
  Landmark,
  Laptop,
  LucideIcon,
  Percent,
  Plane,
  Receipt,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  Store,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'

import { TFinanceEntry } from '~/lib/types/finance'

// One of seven validated chart colours (--cat-1 … --cat-7 in
// app/styles/tailwind.css), shared by related categories, or neutral for
// "other". There are too many categories for a colour each: the icon and
// name tell apart categories that share one.
type TCategoryColor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'other'

type TCategory = {
  // Translation key under finances.form.category.
  key: string
  type: TFinanceEntry['type']
  icon: LucideIcon
  color: TCategoryColor
}

export const financeCategories: TCategory[] = [
  { key: 'fnb', type: 'expense', icon: UtensilsCrossed, color: 2 },
  { key: 'groceries', type: 'expense', icon: ShoppingBasket, color: 2 },
  { key: 'shopping', type: 'expense', icon: ShoppingBag, color: 4 },
  { key: 'emoney', type: 'expense', icon: Wallet, color: 4 },
  { key: 'transport', type: 'expense', icon: Car, color: 1 },
  { key: 'entertainment', type: 'expense', icon: Clapperboard, color: 5 },
  { key: 'vacation', type: 'expense', icon: Plane, color: 1 },
  { key: 'bills', type: 'expense', icon: Receipt, color: 7 },
  { key: 'health', type: 'expense', icon: HeartPulse, color: 3 },
  { key: 'social', type: 'expense', icon: Gift, color: 5 },
  { key: 'insurance', type: 'expense', icon: ShieldCheck, color: 3 },
  { key: 'investment', type: 'expense', icon: TrendingUp, color: 6 },
  { key: 'education', type: 'expense', icon: BookOpen, color: 6 },
  { key: 'family', type: 'expense', icon: Users, color: 5 },
  { key: 'loan', type: 'expense', icon: CreditCard, color: 7 },
  { key: 'fees', type: 'expense', icon: Landmark, color: 7 },
  {
    key: 'otherExpenses',
    type: 'expense',
    icon: CircleEllipsis,
    color: 'other',
  },
  { key: 'income', type: 'income', icon: Banknote, color: 1 },
  { key: 'bonus', type: 'income', icon: Award, color: 1 },
  { key: 'business', type: 'income', icon: Store, color: 7 },
  { key: 'freelance', type: 'income', icon: Laptop, color: 7 },
  { key: 'rent', type: 'income', icon: Building2, color: 2 },
  { key: 'interest', type: 'income', icon: Percent, color: 6 },
  { key: 'investmentReturns', type: 'income', icon: ChartLine, color: 6 },
  { key: 'crypto', type: 'income', icon: Bitcoin, color: 4 },
  { key: 'exchangeGain', type: 'income', icon: ArrowLeftRight, color: 3 },
  { key: 'giftReceived', type: 'income', icon: HandHeart, color: 5 },
  { key: 'refund', type: 'income', icon: RotateCcw, color: 5 },
  { key: 'otherIncome', type: 'income', icon: CircleEllipsis, color: 'other' },
]

export const findCategory = (key: string) =>
  financeCategories.find((category) => category.key === key)

// The category's colour as a CSS value; unknown categories are neutral.
export const categoryColor = (key: string) =>
  `var(--cat-${findCategory(key)?.color ?? 'other'})`

// Used when someone has no currencies set up yet.
export const fallbackCurrency = {
  code: 'IDR',
  symbol: 'Rp',
  maximumFractionDigits: 0,
}
