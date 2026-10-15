import { useState } from 'react'
import { enUS, id as indonesian } from 'react-day-picker/locale'
import { useTranslation } from 'react-i18next'

import { Calendar } from '~/components/ui/calendar'
import { THealthEntryOf } from '~/lib/types/health'
import { cycleCalendar, TCycleDay } from '~/lib/utils/cycle-calendar'
import { periodStats } from '~/lib/utils/health'
import { cn } from '~/lib/utils/shadcn'

type TProperties = {
  periods: THealthEntryOf<'period'>[]
  stats: NonNullable<ReturnType<typeof periodStats>>
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

// A month at a time: logged periods behind, predictions ahead.
export const PeriodCalendar = ({ periods, stats, today }: TProperties) => {
  const { t, i18n } = useTranslation()
  const [month, setMonth] = useState(() => new Date())
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

  return (
    <section className="glass-surface grid justify-items-center gap-3 rounded-xl border p-4">
      <Calendar
        month={month}
        onMonthChange={setMonth}
        locale={i18n.language === 'id' ? indonesian : enUS}
        modifiers={modifiers}
        modifiersClassNames={dayClassName}
        labels={{
          labelGridcell: (date) => {
            const kind = kindOf(date)
            const label = dateFormat.format(date)
            return kind
              ? `${label}: ${t(`health.period.calendar.${kind}`)}`
              : label
          },
        }}
        classNames={{
          day: 'relative flex size-9 items-center justify-center rounded-md p-0 text-sm',
          today: 'underline decoration-2 underline-offset-4',
        }}
        className="p-0"
      />
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
