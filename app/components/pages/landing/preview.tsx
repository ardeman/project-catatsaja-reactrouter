import { Circle, CircleCheck, Pin, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/base/card'
import { CategoryBar } from '~/components/base/category-bar'
import { CategoryIcon } from '~/components/base/category-icon'
import { Markdown } from '~/components/base/markdown'
import { formatCurrency, getDefaultCurrencyFormat } from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'

// Static look-alikes of the note and task cards, filled with sample content.
// They use the same card and Markdown components as the app, so they follow
// its theme, size setting and language.

export const NotePreview = (properties: { className?: string }) => {
  const { t } = useTranslation()
  return (
    <Card
      aria-hidden
      className={cn('w-72 shadow-lg', properties.className)}
    >
      <CardHeader className="pb-3">
        <CardDescription className="flex items-center justify-between text-xs">
          <span>{t('landing.preview.note.date')}</span>
          <Pin className="size-3.5 rotate-45 text-primary" />
        </CardDescription>
        <CardTitle className="text-xl">
          {t('landing.preview.note.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Markdown className="text-sm">
          {t('landing.preview.note.content')}
        </Markdown>
      </CardContent>
    </Card>
  )
}

export const TaskPreview = (properties: { className?: string }) => {
  const { t } = useTranslation()
  const items = [
    { checked: true, item: t('landing.preview.task.items.0') },
    { checked: true, item: t('landing.preview.task.items.1') },
    { checked: false, item: t('landing.preview.task.items.2') },
    { checked: false, item: t('landing.preview.task.items.3') },
  ]
  return (
    <Card
      aria-hidden
      className={cn('w-64 shadow-lg', properties.className)}
    >
      <CardHeader className="pb-3">
        <CardDescription className="flex items-center justify-between text-xs">
          <span>{t('landing.preview.task.date')}</span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />2
          </span>
        </CardDescription>
        <CardTitle className="text-xl">
          {t('landing.preview.task.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        {items.map(({ checked, item }) => (
          <div
            key={item}
            className="flex items-center gap-2 text-sm"
          >
            {checked ? (
              <CircleCheck className="size-4 shrink-0 text-primary" />
            ) : (
              <Circle className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span
              className={cn(checked && 'text-muted-foreground line-through')}
            >
              {item}
            </span>
          </div>
        ))}
        <div className="mt-1 text-xs text-muted-foreground">
          {t('tasks.progress', { done: 2, total: items.length })}
        </div>
      </CardContent>
    </Card>
  )
}

const rupiah = (amount: number) =>
  formatCurrency({
    amount,
    format: { ...getDefaultCurrencyFormat(), minimumFractionDigits: 0 },
    currency: { code: 'IDR', symbol: 'Rp', maximumFractionDigits: 0 },
  })

export const FinancePreview = (properties: { className?: string }) => {
  const { t } = useTranslation()
  // Real categories, so the icons and colours match the app.
  const entries = [
    {
      category: 'vacation',
      text: t('landing.preview.finance.entries.0'),
      amount: 1_850_000,
    },
    {
      category: 'fnb',
      text: t('landing.preview.finance.entries.1'),
      amount: 275_000,
    },
    {
      category: 'shopping',
      text: t('landing.preview.finance.entries.2'),
      amount: 400_000,
    },
  ]
  const expense = entries.reduce((total, entry) => total + entry.amount, 0)
  return (
    <Card
      aria-hidden
      className={cn('w-72 shadow-lg', properties.className)}
    >
      <CardHeader className="pb-3">
        <CardDescription className="text-xs">
          {t('landing.preview.finance.date')}
        </CardDescription>
        <CardTitle className="text-xl">
          {t('landing.preview.finance.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div>
          <p className="text-xs text-muted-foreground">
            {t('finances.summary.balance')}
          </p>
          <p className="text-lg font-semibold">{rupiah(5_000_000 - expense)}</p>
          <p className="text-xs text-muted-foreground">
            {t('finances.summary.incomeExpense', {
              income: rupiah(5_000_000),
              expense: rupiah(expense),
            })}
          </p>
        </div>
        <CategoryBar
          segments={entries.map(({ category, amount }) => ({
            category,
            total: amount,
          }))}
        />
        <ul className="grid gap-1.5 text-sm">
          {entries.map(({ category, text, amount }) => (
            <li
              key={text}
              className="flex min-w-0 items-center gap-2"
            >
              <CategoryIcon category={category} />
              <span className="min-w-0 flex-1 truncate">{text}</span>
              <span className="tabular-nums">−{rupiah(amount)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
