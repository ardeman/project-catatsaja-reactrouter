import { BanknoteArrowDown, BanknoteArrowUp, Layers } from 'lucide-react'
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useId,
  useMemo,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'

import { Segmented } from '~/components/base/segmented'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/base/select'
import { useMoney } from '~/lib/hooks/use-money'
import {
  TFinanceCurrency,
  TFinanceEntry,
  TFinanceResponse,
} from '~/lib/types/finance'
import { TCurrency } from '~/lib/types/settings'
import {
  comparedRange,
  comparisons,
  entryPeriods,
  filterEntries,
  fromValue,
  periodRange,
  TEntryFilter,
  TComparison,
  TEntryPeriod,
  toValue,
} from '~/lib/utils/entry-filter'
import { entryBookTotal, summarize } from '~/lib/utils/finance'
import {
  balanceBefore,
  formatPeriod,
  groupByPeriod,
  groupByWeekday,
  groupings,
  largestEntry,
  pickGranularity,
  rangeDays,
  spendingChange,
  TGroupBy,
  totalsByCategory,
} from '~/lib/utils/finance-analysis'
import { cn } from '~/lib/utils/shadcn'
import { similarItems } from '~/lib/utils/similar-items'

import { BalanceChart } from './balance-chart'
import { Budgets } from './budgets'
import { CashFlowChart } from './cash-flow-chart'
import { CategoryBreakdown } from './category-breakdown'
import { CategoryGroups } from './category-groups'
import { CopyAnalysis } from './copy-analysis'
import { CustomDates } from './entry-filter'
import { Goals } from './goals'
import { ItemBreakdown } from './item-breakdown'
import { Keywords } from './keywords'
import { PeriodComparison } from './period-comparison'
import { Section } from './section'
import { TAnalysisOptions } from './type'

type TProperties = {
  entries: TFinanceEntry[]
  book: TFinanceCurrency
  options: TAnalysisOptions
  setOptions: Dispatch<SetStateAction<TAnalysisOptions>>
  isReadOnly: boolean
  // The person's other books, to copy the analysis setup from.
  books: TFinanceResponse[]
  currencies: TCurrency[]
}

// The breakdowns show one type, or both one after the other.
type TShownType = TFinanceEntry['type'] | 'all'

const timeGroupings = ['day', 'week', 'month'] as const

const isTime = (
  groupBy?: TGroupBy,
): groupBy is (typeof timeGroupings)[number] =>
  (timeGroupings as readonly (TGroupBy | undefined)[]).includes(groupBy)

// A select with its name shown above it.
const Picker = <T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) => {
  const id = useId()
  return (
    <div className="grid min-w-0 gap-1">
      <span
        id={id}
        className="text-xs text-muted-foreground"
      >
        {label}
      </span>
      <Select
        value={value}
        onValueChange={(next) => onChange(next as T)}
      >
        <SelectTrigger aria-labelledby={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

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
  <div className="glass-surface grid min-w-0 content-start gap-0.5 rounded-xl border p-3">
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
// where the money went, for the range and grouping the person picks.
// Everything comes from the entries, in the book's currency.
export const Analysis = ({
  entries,
  book,
  options,
  setOptions,
  isReadOnly,
  books,
  currencies,
}: TProperties) => {
  const { t, i18n } = useTranslation()
  const { range } = options
  const money = useMoney()
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [type, setType] = useState<TShownType>('all')
  const [comparison, setComparison] = useState<TComparison>('previous')
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
  const dates = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  // A new range picks the grouping that suits it again, unless the person
  // chose one that doesn't depend on its length.
  const setRange = useCallback<Dispatch<SetStateAction<TEntryFilter>>>(
    (next) =>
      setOptions((current) => {
        const nextRange =
          typeof next === 'function' ? next(current.range) : next
        if (nextRange === current.range) return current
        return {
          range: nextRange,
          groupBy: isTime(current.groupBy) ? undefined : current.groupBy,
        }
      }),
    [setOptions],
  )

  const analysis = useMemo(() => {
    const shown = filterEntries(entries, range)
    const dates = shown
      .map((entry) => entry.date)
      .toSorted((a, b) => a.localeCompare(b))
    const chosen = periodRange(range)
    const today = toValue(new Date())
    // The range's days, from its start (or the first entry) to its end, or
    // today if that hasn't come yet, unless entries are dated later.
    const from = chosen.from || dates[0] || today
    const last = dates.at(-1) ?? from
    const to = chosen.to
      ? chosen.to > today
        ? [today, last].toSorted((a, b) => a.localeCompare(b))[1]
        : chosen.to
      : last
    const days = rangeDays(from, to)
    const groupBy = options.groupBy ?? pickGranularity(days)
    // Only a range with a start has one to compare with.
    const compared = chosen.from
      ? comparedRange({ from, to }, range.period, comparison)
      : undefined
    return {
      shown,
      groupBy,
      periods:
        groupBy === 'weekday'
          ? groupByWeekday(shown)
          : isTime(groupBy)
            ? groupByPeriod(shown, groupBy, {
                from,
                to,
                opening: balanceBefore(entries, from),
              })
            : [],
      days,
      range: { from, to },
      compared,
      previous: compared
        ? entries.filter(
            (entry) => entry.date >= compared.from && entry.date <= compared.to,
          )
        : [],
      totals: summarize(shown),
      expenseCategories: totalsByCategory(shown, 'expense'),
      incomeCategories: totalsByCategory(shown, 'income'),
      largest: largestEntry(shown, 'expense'),
      expenseItems: similarItems(shown, 'expense'),
      incomeItems: similarItems(shown, 'income'),
    }
  }, [entries, range, options.groupBy, comparison])

  if (entries.length === 0)
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {t('finances.analysis.empty')}
      </p>
    )

  const controls = (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Picker
          label={t('finances.filter.period.label')}
          value={range.period}
          options={entryPeriods.map((period) => ({
            value: period,
            label: t(`finances.filter.period.${period}`),
          }))}
          onChange={(period: TEntryPeriod) =>
            setRange((current) => ({ ...current, period }))
          }
        />
        <Picker
          label={t('finances.analysis.groupBy.label')}
          value={analysis.groupBy}
          options={groupings.map((grouping) => ({
            value: grouping,
            label: t(`finances.analysis.groupBy.${grouping}`),
          }))}
          onChange={(groupBy: TGroupBy) =>
            setOptions((current) => ({ ...current, groupBy }))
          }
        />
      </div>
      {range.period === 'custom' && (
        <CustomDates
          filter={range}
          setFilter={setRange}
        />
      )}
    </div>
  )

  if (analysis.shown.length === 0)
    return (
      <div className="grid grid-cols-1 gap-4">
        {controls}
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t('finances.analysis.emptyRange')}
        </p>
      </div>
    )

  const { groupBy, periods, days, totals, largest, compared } = analysis
  // Category and item groupings show their breakdown alone; days of the
  // week have no balance.
  const isOverTime = isTime(groupBy)
  const granularity = isOverTime || groupBy === 'weekday' ? groupBy : undefined
  const { income, expense } = totals
  const savingsRate = income > 0 ? (income - expense) / income : undefined
  const change =
    groupBy === 'week' || groupBy === 'month'
      ? spendingChange(periods)
      : undefined
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
  const shownTypes: TFinanceEntry['type'][] =
    shownType === 'all' ? ['expense', 'income'] : [shownType]
  const breakdowns = shownTypes.map((type) => ({
    type,
    categories:
      type === 'expense'
        ? analysis.expenseCategories
        : analysis.incomeCategories,
    items: type === 'expense' ? analysis.expenseItems : analysis.incomeItems,
  }))
  // With both shown, each breakdown's title says which type it is.
  const titleOf = (title: string, type: TFinanceEntry['type']) =>
    shownTypes.length > 1
      ? t('finances.analysis.ofType', {
          title,
          type: t(`finances.form.type.${type}`),
        })
      : title

  return (
    // One column that may shrink below its content (`grid-cols-1`): the
    // charts draw at their measured width, and a plain grid kept them as
    // wide as they were drawn when the window got narrower.
    <div className="grid grid-cols-1 gap-4">
      {controls}
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
            label={t(`finances.analysis.insights.change.${groupBy}`)}
            value={percent.format(change)}
            detail={t(`finances.analysis.insights.versus.${groupBy}`)}
            tone={change > 0 ? 'bad' : 'good'}
          />
        )}
      </dl>

      {granularity && (
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
      )}

      {granularity === undefined ? undefined : view === 'chart' ? (
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
          {isOverTime && (
            <Section title={t('finances.analysis.balance.title')}>
              <BalanceChart
                periods={periods}
                granularity={granularity}
                book={book}
              />
            </Section>
          )}
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
                    ...(isOverTime ? [t('finances.summary.balance')] : []),
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
                {(isOverTime ? periods.toReversed() : periods).map((period) => {
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
                      {isOverTime && (
                        <td className="py-2 pl-3 text-right whitespace-nowrap">
                          {money(period.balance, book, period.balance < 0)}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {hasBothTypes && (
        <div className="flex">
          <Segmented
            label={t('finances.form.type.label')}
            value={shownType}
            options={[
              {
                value: 'all',
                label: t('finances.analysis.allTypes'),
                icon: (
                  <Layers
                    aria-hidden="true"
                    className="size-3.5 text-muted-foreground"
                  />
                ),
              },
              {
                value: 'expense',
                label: t('finances.form.type.expense'),
                icon: (
                  <BanknoteArrowUp
                    aria-hidden="true"
                    className="size-3.5 text-expense"
                  />
                ),
              },
              {
                value: 'income',
                label: t('finances.form.type.income'),
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
        </div>
      )}

      {compared && (
        <Section
          title={t('finances.analysis.compare.title')}
          subtitle={t('finances.analysis.compare.subtitle', {
            current: dates.formatRange(
              fromValue(analysis.range.from),
              fromValue(analysis.range.to),
            ),
            previous: dates.formatRange(
              fromValue(compared.from),
              fromValue(compared.to),
            ),
          })}
          action={
            <Segmented
              label={t('finances.analysis.compare.with')}
              value={comparison}
              options={comparisons.map((option) => ({
                value: option,
                label: t(`finances.analysis.compare.${option}Range`),
              }))}
              onChange={setComparison}
            />
          }
        >
          {analysis.previous.length > 0 ? (
            <PeriodComparison
              current={analysis.shown}
              previous={analysis.previous}
              types={shownTypes}
              book={book}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('finances.analysis.compare.empty')}
            </p>
          )}
        </Section>
      )}

      {groupBy !== 'item' &&
        breakdowns.map(
          ({ type, categories }) =>
            categories.length > 0 && (
              <Section
                key={type}
                title={titleOf(t('finances.analysis.categories.title'), type)}
              >
                <CategoryBreakdown
                  totals={categories}
                  book={book}
                />
              </Section>
            ),
        )}

      {/* The breakdowns follow the type chosen above them. */}
      {breakdowns.every(({ items }) => items.length === 0) &&
        groupBy === 'item' && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('finances.analysis.items.none')}
          </p>
        )}

      {groupBy !== 'category' &&
        breakdowns.map(
          ({ type, items }) =>
            items.length > 0 && (
              <Section
                key={type}
                title={titleOf(t('finances.analysis.items.title'), type)}
                subtitle={t('finances.analysis.items.subtitle')}
              >
                <ItemBreakdown
                  items={items}
                  book={book}
                  showsPriceChange={type === 'expense'}
                />
              </Section>
            ),
        )}

      <Keywords
        entries={analysis.shown}
        types={shownTypes}
        book={book}
        isReadOnly={isReadOnly}
      />

      <Budgets
        entries={entries}
        book={book}
        isReadOnly={isReadOnly}
      />

      <Goals
        entries={entries}
        book={book}
        isReadOnly={isReadOnly}
      />

      {groupBy !== 'item' && (
        <CategoryGroups
          entries={analysis.shown}
          types={shownTypes}
          book={book}
          isReadOnly={isReadOnly}
        />
      )}

      <CopyAnalysis
        books={books}
        currencies={currencies}
        isReadOnly={isReadOnly}
      />
    </div>
  )
}
