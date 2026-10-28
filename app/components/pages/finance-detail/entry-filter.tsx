import { BanknoteArrowDown, BanknoteArrowUp, ListFilter, X } from 'lucide-react'
import { Dispatch, ReactNode, SetStateAction, useEffect, useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'

import { CategoryIcon } from '~/components/base/category-icon'
import { DatePicker } from '~/components/base/date-picker'
import { Segmented } from '~/components/base/segmented'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/base/select'
import { Button } from '~/components/ui/button'
import { financeCategories } from '~/lib/constants/finance'
import { useMoney } from '~/lib/hooks/use-money'
import { TFinanceCurrency, TFinanceEntry } from '~/lib/types/finance'
import {
  activeFilterCount,
  emptyEntryFilter,
  entryPeriods,
  TEntryFilter,
  TEntryPeriod,
} from '~/lib/utils/entry-filter'
import { summarize } from '~/lib/utils/finance'

const ALL_CATEGORIES = 'all'

type TProperties = {
  filter: TEntryFilter
  setFilter: Dispatch<SetStateAction<TEntryFilter>>
  // Every entry of the book, for the categories offered.
  entries: TFinanceEntry[]
  // The entries the filter keeps.
  shown: TFinanceEntry[]
  book: TFinanceCurrency
  // More buttons beside Filter.
  actions?: ReactNode
}

// The custom period's dates, in a small form of their own so they can use
// the app's date picker.
export const CustomDates = ({
  filter,
  setFilter,
}: Pick<TProperties, 'filter' | 'setFilter'>) => {
  const { t } = useTranslation()
  const form = useForm({
    defaultValues: { from: filter.from, to: filter.to },
  })
  const [from = '', to = ''] = useWatch({
    control: form.control,
    name: ['from', 'to'],
  })
  useEffect(() => {
    setFilter((current) =>
      current.from === from && current.to === to
        ? current
        : { ...current, from, to },
    )
  }, [from, to, setFilter])

  return (
    <FormProvider {...form}>
      <div className="grid grid-cols-2 gap-2">
        <DatePicker
          name="from"
          label={t('finances.filter.from')}
        />
        <DatePicker
          name="to"
          label={t('finances.filter.to')}
        />
      </div>
    </FormProvider>
  )
}

export const EntryFilter = (properties: TProperties) => {
  const { filter, setFilter, entries, shown, book, actions } = properties
  const { t } = useTranslation()
  const money = useMoney()
  const count = activeFilterCount(filter)
  const [isOpen, setIsOpen] = useState(count > 0)
  const { income, expense } = summarize(shown)
  // Only categories the book uses, of the chosen type.
  const used = new Set(entries.map((entry) => entry.category))
  const categories = financeCategories.filter(
    (category) =>
      used.has(category.key) &&
      (filter.type === 'all' || category.type === filter.type),
  )
  const update = (next: Partial<TEntryFilter>) =>
    setFilter((current) => ({ ...current, ...next }))

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {count > 0 && (
          <p className="min-w-0 flex-1 text-xs text-muted-foreground">
            {t('finances.filter.shown', {
              count: shown.length,
              total: entries.length,
            })}{' '}
            ·{' '}
            <Trans
              i18nKey="finances.summary.incomeExpense"
              values={{
                income: money(income, book),
                expense: money(expense, book),
              }}
              components={{
                in: <span className="text-income" />,
                out: <span className="text-expense" />,
              }}
            />
          </p>
        )}
        <div className="ml-auto flex gap-1">
          {actions}
          {count > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => setFilter(emptyEntryFilter)}
            >
              <X className="size-4" />
              {t('finances.filter.clear')}
            </Button>
          )}
          <Button
            type="button"
            variant={isOpen ? 'secondary' : 'ghost'}
            size="sm"
            className="gap-1"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
          >
            <ListFilter className="size-4" />
            {t('finances.filter.label')}
            {count > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[0.625rem] leading-4 text-primary-foreground tabular-nums">
                {count}
              </span>
            )}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="glass-surface motion-fade grid gap-3 rounded-xl border p-3">
          <Segmented
            label={t('finances.form.type.label')}
            value={filter.type}
            className="justify-self-start"
            options={[
              { value: 'all', label: t('finances.filter.allTypes') },
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
            onChange={(type) =>
              update({
                type,
                // A category of the other type would hide every entry.
                category:
                  type === 'all' ||
                  financeCategories.some(
                    (item) =>
                      item.key === filter.category && item.type === type,
                  )
                    ? filter.category
                    : '',
              })
            }
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Select
              value={filter.category || ALL_CATEGORIES}
              onValueChange={(category) =>
                update({
                  category: category === ALL_CATEGORIES ? '' : category,
                })
              }
            >
              <SelectTrigger aria-label={t('finances.form.category.label')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES}>
                  {t('finances.filter.allCategories')}
                </SelectItem>
                {categories.map(({ key }) => (
                  <SelectItem
                    key={key}
                    value={key}
                  >
                    <span className="flex items-center gap-2">
                      <CategoryIcon category={key} />
                      {t(`finances.form.category.${key}.label`)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filter.period}
              onValueChange={(period) =>
                update({ period: period as TEntryPeriod })
              }
            >
              <SelectTrigger aria-label={t('finances.filter.period.label')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {entryPeriods.map((period) => (
                  <SelectItem
                    key={period}
                    value={period}
                  >
                    {t(`finances.filter.period.${period}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {filter.period === 'custom' && (
            <CustomDates
              filter={filter}
              setFilter={setFilter}
            />
          )}
        </div>
      )}
    </div>
  )
}
