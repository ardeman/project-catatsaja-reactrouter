import { Circle, CircleCheck, Lock } from 'lucide-react'
import { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/base/card'
import { CategoryBar } from '~/components/base/category-bar'
import { CategoryIcon } from '~/components/base/category-icon'
import { HealthStatus } from '~/components/base/health-status'
import { Markdown } from '~/components/base/markdown'
import { SexIcon } from '~/components/base/sex-icon'
import {
  classifyBmi,
  classifyGlucose,
  labUnitLabel,
} from '~/lib/constants/health'
import { formatCurrency, getDefaultCurrencyFormat } from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'

// Static look-alikes of the app's cards, filled with sample content, for the
// landing page and the guide (/help). They use the same card parts as the
// app (encrypted lock, shared label, task order, category bar, health
// statuses), so they follow its theme, size setting and language. Keep them
// in step with the cards in `pages/{notes,tasks,finances,health}/card.tsx`.

type TPreviewProperties = { className?: string }

const PreviewCard = ({
  className,
  date,
  isShared,
  title,
  children,
}: TPreviewProperties & {
  date: string
  isShared?: boolean
  title: ReactNode
  children: ReactNode
}) => {
  const { t } = useTranslation()
  return (
    <Card
      aria-hidden
      className={cn('w-72 shadow-lg', className)}
    >
      <CardHeader className="pb-3">
        <CardDescription className="flex justify-between text-xs">
          <span className="flex items-center gap-1">
            <Lock className="size-3 shrink-0" />
            {date}
          </span>
          {isShared && <span>{t('form.permissions.shared')}</span>}
        </CardDescription>
        {title}
      </CardHeader>
      {children}
    </Card>
  )
}

export const NotePreview = ({ className }: TPreviewProperties) => {
  const { t } = useTranslation()
  return (
    <PreviewCard
      className={className}
      date={t('landing.preview.note.date')}
      title={
        <CardTitle className="text-xl">
          {t('landing.preview.note.title')}
        </CardTitle>
      }
    >
      <CardContent>
        <Markdown className="text-sm">
          {t('landing.preview.note.content')}
        </Markdown>
      </CardContent>
    </PreviewCard>
  )
}

export const TaskPreview = ({ className }: TPreviewProperties) => {
  const { t } = useTranslation()
  const items = [
    { checked: true, item: t('landing.preview.task.items.0') },
    { checked: true, item: t('landing.preview.task.items.1') },
    { checked: false, item: t('landing.preview.task.items.2') },
    { checked: false, item: t('landing.preview.task.items.3') },
  ]
  // As on the task card: open items first, three at most.
  const preview = [
    ...items.filter((item) => !item.checked),
    ...items.filter((item) => item.checked),
  ].slice(0, 3)
  return (
    <PreviewCard
      className={className}
      date={t('landing.preview.task.date')}
      title={
        <CardTitle className="text-xl">
          {t('landing.preview.task.title')}
        </CardTitle>
      }
    >
      <CardContent className="flex flex-col gap-1">
        {preview.map(({ checked, item }) => (
          <div
            key={item}
            className="flex items-start gap-2 text-sm"
          >
            {checked ? (
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            ) : (
              <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            <span
              className={cn(checked && 'text-muted-foreground line-through')}
            >
              {item}
            </span>
          </div>
        ))}
        <div className="ml-6 text-xs text-muted-foreground">
          {t('tasks.more', { number: items.length - preview.length })}
        </div>
        <div className="text-xs text-muted-foreground">
          {t('tasks.progress', {
            done: items.filter((item) => item.checked).length,
            total: items.length,
          })}
        </div>
      </CardContent>
    </PreviewCard>
  )
}

const rupiah = (amount: number) =>
  formatCurrency({
    amount,
    format: { ...getDefaultCurrencyFormat(), minimumFractionDigits: 0 },
    currency: { code: 'IDR', symbol: 'Rp', maximumFractionDigits: 0 },
  })

export const FinancePreview = ({ className }: TPreviewProperties) => {
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
    <PreviewCard
      className={className}
      date={t('landing.preview.finance.date')}
      isShared
      title={
        <CardTitle className="text-xl">
          {t('landing.preview.finance.title')}
        </CardTitle>
      }
    >
      <CardContent className="grid gap-3">
        <div>
          <p className="text-xs text-muted-foreground">
            {t('finances.summary.balance')}
          </p>
          <p className="text-lg font-semibold">{rupiah(5_000_000 - expense)}</p>
          <p className="text-xs text-muted-foreground">
            <Trans
              i18nKey="finances.summary.incomeExpense"
              values={{
                income: rupiah(5_000_000),
                expense: rupiah(expense),
              }}
              components={{
                in: <span className="text-income" />,
                out: <span className="text-expense" />,
              }}
            />
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
              <span className="shrink-0 text-expense tabular-nums">
                −{rupiah(amount)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </PreviewCard>
  )
}

export const HealthPreview = ({ className }: TPreviewProperties) => {
  const { t, i18n } = useTranslation()
  const number = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 1,
  })
  const weight = 58.5
  const bmi = 22.8
  const glucose = 92
  return (
    <PreviewCard
      className={className}
      date={t('landing.preview.health.date')}
      isShared
      title={
        <>
          <CardTitle className="flex items-center gap-2 text-xl">
            {t('landing.preview.health.name')}
            <SexIcon
              sex="female"
              className="size-4"
            />
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {t('health.age', { count: 56 })}
          </p>
        </>
      }
    >
      <CardContent className="grid gap-3 text-sm">
        <div className="grid gap-0.5">
          <p className="text-xs text-muted-foreground">
            {t('health.kinds.body')} · {t('landing.preview.health.bodyDate')}
          </p>
          <p className="font-medium">
            {number.format(weight)} kg · BMI {number.format(bmi)}
          </p>
          <HealthStatus status={classifyBmi(bmi, 'kemenkes')} />
        </div>
        <div className="grid gap-0.5">
          <p className="text-xs text-muted-foreground">
            {t('health.kinds.glucose')} · {t('health.glucoseContext.fasting')}
          </p>
          <p className="font-medium">
            {glucose} {labUnitLabel('glucose', 'conventional')}
          </p>
          <HealthStatus status={classifyGlucose(glucose, 'fasting')} />
        </div>
      </CardContent>
    </PreviewCard>
  )
}
