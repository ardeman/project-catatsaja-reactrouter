import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { NumberInput } from '~/components/base/number-input'
import { Button } from '~/components/ui/button'
import { THealthLogForm } from '~/lib/types/health'
import { today } from '~/lib/utils/finance'
import {
  ageInYears,
  caloriesByDay,
  entriesOf,
  suggestedCalories,
} from '~/lib/utils/health'
import { cn } from '~/lib/utils/shadcn'

import { EntryList } from './entry-list'
import { TSectionProperties } from './type'

// Food eaten, by meal: today's total against the daily target (which can
// be suggested from weight, height, age and sex), and recent days.
export const CaloriesSection = (properties: TSectionProperties) => {
  const { log, isReadOnly } = properties
  const { t, i18n } = useTranslation()
  const { control, setValue } = useFormContext<THealthLogForm>()
  const target = Number(useWatch({ control, name: 'calorieTarget' })) || 0
  const now = today()
  const entries = entriesOf(log.content, 'calories')
  const days = caloriesByDay(log.content).slice(0, 14)
  const todayTotal = days.find(([date]) => date === now)?.[1] ?? 0
  const number = new Intl.NumberFormat(i18n.language)
  const dayFormat = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
  const latestBody = entriesOf(log.content, 'body')
  const weight = latestBody.find((entry) => entry.weight)?.weight
  const height = latestBody.find((entry) => entry.height)?.height
  const age = log.birthDate ? ageInYears(log.birthDate, now) : undefined
  const suggestion =
    weight && height && age !== undefined && age >= 18
      ? suggestedCalories({ weight, height, age, sex: log.sex })
      : undefined
  const scale = Math.max(target, ...days.map(([, total]) => total), 1)
  const share = target > 0 ? Math.min(todayTotal / target, 1) : 0

  return (
    <EntryList
      {...properties}
      kind="calories"
      entries={entries}
      addLabel={t('health.add.calories')}
      emptyLabel={t('health.empty.calories')}
      renderRow={(entry) => ({
        primary: `${number.format(entry.kcal)} kcal · ${t(`health.meal.${entry.meal}`)}`,
      })}
    >
      <section className="glass-surface grid gap-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium">{t('health.calories.today')}</h2>
          <p className="text-lg font-semibold">
            {number.format(todayTotal)}
            {target > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                {' '}
                / {number.format(target)} kcal
              </span>
            )}
          </p>
        </div>
        {target > 0 && (
          <>
            {/* A meter: the fill on a lighter track of the same colour. */}
            <div
              role="meter"
              aria-label={t('health.calories.today')}
              aria-valuemin={0}
              aria-valuemax={target}
              aria-valuenow={todayTotal}
              className="h-2 overflow-hidden rounded-full bg-viz-balance/20"
            >
              <div
                className={cn(
                  'h-full rounded-full',
                  todayTotal > target ? 'bg-viz-expense' : 'bg-viz-balance',
                )}
                style={{ width: `${share * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {todayTotal > target
                ? t('health.calories.over', {
                    amount: number.format(todayTotal - target),
                  })
                : t('health.calories.left', {
                    amount: number.format(target - todayTotal),
                  })}
            </p>
          </>
        )}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
          <NumberInput
            name="calorieTarget"
            label={t('health.calories.target')}
            placeholder="2000"
            allowMath
            fractionDigits={0}
            disabled={isReadOnly}
          />
          {suggestion && !isReadOnly && suggestion !== target && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setValue('calorieTarget', suggestion, { shouldDirty: true })
              }
            >
              {t('health.calories.useSuggestion', {
                amount: number.format(suggestion),
              })}
            </Button>
          )}
        </div>
        {suggestion && (
          <p className="text-xs text-muted-foreground">
            {t('health.calories.suggestionHint')}
          </p>
        )}
      </section>

      {days.length > 0 && (
        <section className="glass-surface grid gap-2 rounded-xl border p-4">
          <h2 className="text-sm font-medium">{t('health.calories.recent')}</h2>
          <ul className="grid gap-2">
            {days.map(([date, total]) => (
              <li
                key={date}
                className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-2 text-xs"
              >
                <span className="text-muted-foreground">
                  {dayFormat.format(new Date(`${date}T00:00:00Z`))}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-2 rounded-r-[4px]',
                    target > 0 && total > target
                      ? 'bg-viz-expense'
                      : 'bg-viz-balance',
                  )}
                  style={{ width: `${Math.max((total / scale) * 100, 1)}%` }}
                />
                <span className="tabular-nums">{number.format(total)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </EntryList>
  )
}
