import { useState } from 'react'
import { enUS, id as indonesian } from 'react-day-picker/locale'
import { useTranslation } from 'react-i18next'

import { Calendar } from '~/components/ui/calendar'
import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
import { THealthEntryOf } from '~/lib/types/health'
import { cycleCalendar, periodTap, TCycleDay } from '~/lib/utils/cycle-calendar'
import { periodStats } from '~/lib/utils/health'
import { cn } from '~/lib/utils/shadcn'

import { HealthEntryForm } from './entry-form'
import { TSectionProperties } from './type'

type TProperties = Pick<
  TSectionProperties,
  'isReadOnly' | 'units' | 'onSaveEntry' | 'onDeleteEntry'
> & {
  periods: THealthEntryOf<'period'>[]
  // None before the first period: only logged days, no predictions.
  stats: ReturnType<typeof periodStats>
  today: string
}

// Period days in the colour of the period, fertile days and ovulation in
// another; predictions outlined or lighter than what was logged.
const dayClassName: Record<TCycleDay, string> = {
  period: 'bg-(--cat-5)/35 font-semibold',
  predicted: 'border-2 border-dashed border-(--cat-5)',
  possible: 'bg-(--cat-5)/10',
  fertile: 'bg-(--cat-3)/15',
  ovulationWindow: 'bg-(--cat-3)/35',
  ovulation: 'bg-(--cat-3)/35 font-semibold ring-2 ring-(--cat-3) ring-inset',
}

const legend: TCycleDay[] = [
  'period',
  'predicted',
  'possible',
  'fertile',
  'ovulationWindow',
  'ovulation',
]

const toValue = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')

// A month at a time: logged periods behind, predictions ahead. Tapping a
// day opens the period it is part of, or a new one starting on it, and can
// make it the last day of the period before (longer or shorter). Without a
// logged last day, a period follows the expected length.
export const PeriodCalendar = ({
  periods,
  stats,
  today,
  isReadOnly,
  units,
  onSaveEntry,
  onDeleteEntry,
}: TProperties) => {
  const { t, i18n } = useTranslation()
  const [month, setMonth] = useState(() => new Date())
  const [selected, setSelected] = useState<Date>()
  const [isEnd, setIsEnd] = useState(false)
  const periodLength = stats?.periodLength ?? 5
  const tapOf = (date: Date) =>
    periodTap(periods, toValue(date), today, periodLength)
  const tap = selected && tapOf(selected)
  const byId = (id?: string) => periods.find((period) => period.id === id)
  const handleSelect = (date?: Date) => {
    setSelected(date)
    setIsEnd(!!date && !!tapOf(date)?.end?.isEnd)
  }
  const close = () => setSelected(undefined)
  // To the end of the week after the month, for the days shown around it.
  const until = toValue(new Date(month.getFullYear(), month.getMonth() + 1, 7))
  const days = cycleCalendar(periods, stats, today, until)
  const kindOf = (date: Date) => days.get(toValue(date))
  const modifiers = Object.fromEntries(
    legend.map((kind) => [kind, (date: Date) => kindOf(date) === kind]),
  )
  const dateFormat = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'full',
  })

  const calendarProperties = {
    month,
    onMonthChange: setMonth,
    locale: i18n.language === 'id' ? indonesian : enUS,
    modifiers,
    modifiersClassNames: dayClassName,
    labels: {
      labelGridcell: (date: Date) => {
        const kind = kindOf(date)
        const label = dateFormat.format(date)
        return kind ? `${label}: ${t(`health.period.calendar.${kind}`)}` : label
      },
    },
    classNames: {
      day: 'relative flex size-9 items-center justify-center rounded-md p-0 text-sm',
      today: 'underline decoration-2 underline-offset-4',
    },
    className: 'p-0',
  }
  const form = (
    key: string,
    entry: THealthEntryOf<'period'> | undefined,
    defaults: { date?: string; end?: string },
  ) => (
    <HealthEntryForm
      key={key}
      kind="period"
      entry={entry}
      defaults={defaults}
      units={units}
      onSave={onSaveEntry}
      onDelete={onDeleteEntry}
      onClose={close}
    />
  )

  return (
    <section className="glass-surface grid justify-items-center gap-3 rounded-xl border p-4">
      {!isReadOnly && (
        <p className="text-center text-xs text-muted-foreground">
          {t('health.period.tapHint')}
        </p>
      )}
      {isReadOnly ? (
        <Calendar {...calendarProperties} />
      ) : (
        <Calendar
          {...calendarProperties}
          mode="single"
          selected={selected}
          onSelect={handleSelect}
        />
      )}
      {selected && (
        <div className="grid w-full gap-2 border-t pt-3">
          <p className="text-center text-sm font-medium">
            {dateFormat.format(selected)}
          </p>
          {tap ? (
            <>
              {tap.end && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="period-ended"
                    checked={isEnd}
                    onCheckedChange={(checked) => setIsEnd(checked === true)}
                  />
                  <Label htmlFor="period-ended">
                    {t('health.period.endedThisDay')}
                  </Label>
                </div>
              )}
              {isEnd && tap.end
                ? form(`${toValue(selected)}-end`, byId(tap.end.id), {
                    end: toValue(selected),
                  })
                : form(`${toValue(selected)}-start`, byId(tap.start.id), {
                    ...(tap.start.date && { date: tap.start.date }),
                    // Not the last day after all: back to the expected
                    // length.
                    ...(tap.end?.isEnd && { end: '' }),
                  })}
            </>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              {t('health.period.ahead')}
            </p>
          )}
        </div>
      )}
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
        {legend.map((kind) => (
          <li
            key={kind}
            className="flex items-center gap-1.5"
          >
            <span
              aria-hidden
              className={cn('size-4 rounded', dayClassName[kind])}
            />
            {t(`health.period.calendar.${kind}`)}
          </li>
        ))}
      </ul>
    </section>
  )
}
