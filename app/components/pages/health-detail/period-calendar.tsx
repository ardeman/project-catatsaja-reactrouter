import { useState } from 'react'
import { enUS, id as indonesian } from 'react-day-picker/locale'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { THealthEntryOf } from '~/lib/types/health'
import {
  cycleCalendar,
  periodActions,
  TCycleDay,
  TPeriodAction,
} from '~/lib/utils/cycle-calendar'
import { periodStats } from '~/lib/utils/health'
import { cn } from '~/lib/utils/shadcn'

type TProperties = {
  periods: THealthEntryOf<'period'>[]
  // None before the first period: only logged days, no predictions.
  stats: ReturnType<typeof periodStats>
  today: string
  isReadOnly: boolean
  onAction: (action: TPeriodAction, day: string) => void
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
// day offers what can be logged on it: a period starting or ending.
export const PeriodCalendar = ({
  periods,
  stats,
  today,
  isReadOnly,
  onAction,
}: TProperties) => {
  const { t, i18n } = useTranslation()
  const [month, setMonth] = useState(() => new Date())
  const [selected, setSelected] = useState<Date>()
  const selectedDay = selected && toValue(selected)
  const actions = selectedDay
    ? periodActions(periods, selectedDay, today, stats?.periodLength ?? 5)
    : []
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
          onSelect={setSelected}
        />
      )}
      {selected && selectedDay && (
        <div
          aria-live="polite"
          className="grid w-full justify-items-center gap-2 border-t pt-3"
        >
          <p className="text-sm font-medium">{dateFormat.format(selected)}</p>
          {actions.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {t('health.period.ahead')}
            </p>
          ) : (
            <div className="flex flex-wrap justify-center gap-2">
              {actions.map((action) => (
                <Button
                  key={action.type}
                  type="button"
                  size="sm"
                  variant={action.type === 'remove' ? 'outline' : 'default'}
                  onClick={() => {
                    onAction(action, selectedDay)
                    setSelected(undefined)
                  }}
                >
                  {t(`health.period.action.${action.type}`)}
                </Button>
              ))}
            </div>
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
