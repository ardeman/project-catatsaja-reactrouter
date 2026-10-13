import { BanknoteArrowDown, BanknoteArrowUp } from 'lucide-react'
import { ReactNode, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Segmented } from '~/components/base/segmented'
import { useMoney } from '~/lib/hooks/use-money'
import { TFinanceCurrency, TFinanceEntry } from '~/lib/types/finance'
import { entryBookTotal, summarize } from '~/lib/utils/finance'
import {
  formatPeriod,
  groupByPeriod,
  largestEntry,
  pickGranularity,
  spanDays,
  spendingChange,
  totalsByCategory,
} from '~/lib/utils/finance-analysis'
import { cn } from '~/lib/utils/shadcn'
import { similarItems } from '~/lib/utils/similar-items'

import { BalanceChart } from './balance-chart'
import { CashFlowChart } from './cash-flow-chart'
import { CategoryBreakdown } from './category-breakdown'
import { ItemBreakdown } from './item-breakdown'

type TProperties = {
  entries: TFinanceEntry[]
  book: TFinanceCurrency
}

const Section = ({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}) => (
  <section className="glass-surface motion-enter grid grid-cols-1 gap-3 rounded-xl border p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      {/* Takes the free width and wraps, so a long subtitle can't widen the
          page on a phone. */}
      <div className="grid min-w-0 flex-1 basis-48 gap-0.5">
        <h2 className="text-sm font-medium">{title}</h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
    {children}
  </section>
)

const Tile = ({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string
  detail?: string
  tone?: 'good' | 'bad'
}) => (
  <div className="grid min-w-0 content-start gap-0.5 rounded-lg bg-muted/50 p-3">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd
      className={cn(
        'truncate text-base font-semibold',
        tone === 'good' && 'text-emerald-600 dark:text-emerald-400',
        tone === 'bad' && 'text-destructive-text',
      )}
      title={value}
    >
      {value}
    </dd>
    {detail && (
      <dd
        className="truncate text-xs text-muted-foreground"
        title={detail}
      >
        {detail}
      </dd>
    )}
  </div>
)

// The book's numbers at a glance, its cash flow and balance over time, and
// where the money went. Everything comes from the entries, in the book's
// currency.
export const Analysis = ({ entries, book }: TProperties) => {
  const { t, i18n } = useTranslation()
  const money = useMoney()
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [type, setType] = useState<TFinanceEntry['type']>('expense')
  // Changes carry their sign (+20%); shares and rates don't.
  const percent = new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 0,
    signDisplay: 'exceptZero',
  })
  const share = new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 0,
  })

  const analysis = useMemo(() => {
    const granularity = pickGranularity(entries)
    return {
      granularity,
      periods: groupByPeriod(entries, granularity),
      days: spanDays(entries),
      totals: summarize(entries),
      expenseCategories: totalsByCategory(entries, 'expense'),
      incomeCategories: totalsByCategory(entries, 'income'),
      largest: largestEntry(entries, 'expense'),
      expenseItems: similarItems(entries, 'expense'),
      incomeItems: similarItems(entries, 'income'),
    }
  }, [entries])

  if (entries.length === 0)
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {t('finances.analysis.empty')}
      </p>
    )

  const { granularity, periods, days, totals, largest } = analysis
  const { income, expense } = totals
  const savingsRate = income > 0 ? (income - expense) / income : undefined
  const change = granularity === 'day' ? undefined : spendingChange(periods)
  const topExpense = analysis.expenseCategories[0]
  const categoryLabel = (category: string) =>
    t(
      category === 'rest'
        ? 'finances.analysis.categories.rest'
        : `finances.form.category.${category}.label`,
    )
  const hasBothTypes =
    analysis.expenseCategories.length > 0 &&
    analysis.incomeCategories.length > 0
  const shownType = hasBothTypes
    ? type
    : analysis.expenseCategories.length > 0
      ? 'expense'
      : 'income'
  const categories =
    shownType === 'expense'
      ? analysis.expenseCategories
      : analysis.incomeCategories
  const items =
    shownType === 'expense' ? analysis.expenseItems : analysis.incomeItems

  return (
    // One column that may shrink below its content (`grid-cols-1`): the
    // charts draw at their measured width, and a plain grid kept them as
    // wide as they were drawn when the window got narrower.
    <div className="grid grid-cols-1 gap-4">
      <dl className="grid grid-cols-2 gap-2">
        {savingsRate !== undefined && (
          <Tile
            label={t('finances.analysis.insights.savingsRate')}
            value={share.format(savingsRate)}
            detail={t(
              savingsRate < 0
                ? 'finances.analysis.insights.overspent'
                : 'finances.analysis.insights.ofIncome',
            )}
            tone={savingsRate < 0 ? 'bad' : 'good'}
          />
        )}
        {expense > 0 && (
          <Tile
            label={t('finances.analysis.insights.dailySpending')}
            value={money(expense / Math.max(days, 1), book)}
            detail={t('finances.analysis.insights.overDays', { count: days })}
          />
        )}
        {topExpense && (
          <Tile
            label={t('finances.analysis.insights.topCategory')}
            value={categoryLabel(topExpense.category)}
            detail={t('finances.analysis.insights.shareOfExpenses', {
              share: share.format(topExpense.share),
            })}
          />
        )}
        {largest && (
          <Tile
            label={t('finances.analysis.insights.largestExpense')}
            value={money(entryBookTotal(largest), book)}
            detail={largest.description || categoryLabel(largest.category)}
          />
        )}
        {change !== undefined && (
          <Tile
            label={t(`finances.analysis.insights.change.${granularity}`)}
            value={percent.format(change)}
            detail={t(`finances.analysis.insights.versus.${granularity}`)}
            tone={change > 0 ? 'bad' : 'good'}
          />
        )}
      </dl>

      <div className="flex justify-end">
        <Segmented
          label={t('finances.analysis.showAs')}
          value={view}
          options={[
            { value: 'chart', label: t('finances.analysis.chart') },
            { value: 'table', label: t('finances.analysis.table') },
          ]}
          onChange={setView}
        />
      </div>

      {view === 'chart' ? (
        <>
          <Section
            title={t('finances.analysis.cashFlow.title')}
            subtitle={t(`finances.analysis.cashFlow.subtitle.${granularity}`)}
            action={
              <ul className="flex gap-3 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="size-2.5 rounded-[3px] bg-viz-income"
                  />
                  {t('finances.summary.income')}
                </li>
                <li className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="size-2.5 rounded-[3px] bg-viz-expense"
                  />
                  {t('finances.summary.expense')}
                </li>
              </ul>
            }
          >
            <CashFlowChart
              periods={periods}
              granularity={granularity}
              book={book}
            />
          </Section>
          <Section title={t('finances.analysis.balance.title')}>
            <BalanceChart
              periods={periods}
              granularity={granularity}
              book={book}
            />
          </Section>
        </>
      ) : (
        <Section
          title={t('finances.analysis.periodTable.title')}
          subtitle={t(`finances.analysis.cashFlow.subtitle.${granularity}`)}
        >
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-md text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b">
                  <th
                    scope="col"
                    className="py-2 pr-3 text-left font-normal"
                  >
                    {t(`finances.analysis.period.${granularity}`)}
                  </th>
                  {[
                    t('finances.summary.income'),
                    t('finances.summary.expense'),
                    t('finances.analysis.net'),
                    t('finances.summary.balance'),
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="py-2 pl-3 text-right font-normal"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {periods.toReversed().map((period) => {
                  const net = period.income - period.expense
                  return (
                    <tr
                      key={period.start}
                      className="border-b last:border-0"
                    >
                      <th
                        scope="row"
                        className="py-2 pr-3 text-left font-normal whitespace-nowrap"
                      >
                        {formatPeriod({
                          start: period.start,
                          granularity,
                          locale: i18n.language,
                          withYear: true,
                        })}
                      </th>
                      <td className="py-2 pl-3 text-right whitespace-nowrap">
                        {money(period.income, book)}
                      </td>
                      <td className="py-2 pl-3 text-right whitespace-nowrap">
                        {money(period.expense, book)}
                      </td>
                      <td
                        className={cn(
                          'py-2 pl-3 text-right whitespace-nowrap',
                          net < 0 && 'text-destructive-text',
                        )}
                      >
                        {money(net, book, true)}
                      </td>
                      <td className="py-2 pl-3 text-right whitespace-nowrap">
                        {money(period.balance, book, period.balance < 0)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {categories.length > 0 && (
        <Section
          title={t('finances.analysis.categories.title')}
          action={
            hasBothTypes && (
              <Segmented
                label={t('finances.analysis.categories.title')}
                value={shownType}
                options={[
                  {
                    value: 'expense',
                    label: t('finances.summary.expense'),
                    icon: (
                      <BanknoteArrowUp
                        aria-hidden="true"
                        className="size-3.5 text-expense"
                      />
                    ),
                  },
                  {
                    value: 'income',
                    label: t('finances.summary.income'),
                    icon: (
                      <BanknoteArrowDown
                        aria-hidden="true"
                        className="size-3.5 text-income"
                      />
                    ),
                  },
                ]}
                onChange={setType}
              />
            )
          }
        >
          <CategoryBreakdown
            totals={categories}
            book={book}
          />
        </Section>
      )}

      {/* Follows the type chosen for the categories above. */}
      {items.length > 0 && (
        <Section
          title={t('finances.analysis.items.title')}
          subtitle={t('finances.analysis.items.subtitle')}
        >
          <ItemBreakdown
            items={items}
            book={book}
            showsPriceChange={shownType === 'expense'}
          />
        </Section>
      )}
    </div>
  )
}
