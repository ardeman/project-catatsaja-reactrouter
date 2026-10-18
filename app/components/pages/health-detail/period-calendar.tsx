import { useState } from 'react'
import { enUS, id as indonesian } from 'react-day-picker/locale'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { Segmented } from '~/components/base/segmented'
import { Calendar } from '~/components/ui/calendar'
import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
import { THealthEntryOf } from '~/lib/types/health'
import {
  cycleCalendar,
  intimacyDays,
  periodTap,
  TCycleDay,
  TIntimacyDay,
} from '~/lib/utils/cycle-calendar'
import { periodStats } from '~/lib/utils/health'
import { cn } from '~/lib/utils/shadcn'

import { HealthEntryForm } from './entry-form'
import { TSectionProperties } from './type'

type TProperties = Pick<
  TSectionProperties,
  'isReadOnly' | 'units' | 'onSaveEntry' | 'onDeleteEntry'
> & {
  periods: THealthEntryOf<'period'>[]
  // Sex logged on the calendar, shown as a dot on its day.
  intimacy: THealthEntryOf<'intimacy'>[]
  // None before the first period: only logged days, no predictions.
  stats: ReturnType<typeof periodStats>
  today: string
}

// Period days in the colour of the period, fertile days and ovulation in
// another; predictions outlined or lighter than what was logged.
const cycleDayClassName: Record<TCycleDay, string> = {
  period: 'bg-(--cat-5)/35 font-semibold',
  predicted: 'border-2 border-dashed border-(--cat-5)',
  possible: 'bg-(--cat-5)/10',
  fertile: 'bg-(--cat-3)/15',
  ovulation: 'bg-(--cat-3)/35 font-semibold ring-2 ring-(--cat-3) ring-inset',
}

const legend: TCycleDay[] = [
  'period',
  'predicted',
  'possible',
  'fertile',
  'ovulation',
]

// A dot under the day: hollow when protected, filled when not, so the two
// differ by shape as well as colour.
const dot =
  "after:absolute after:bottom-0.5 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:border after:border-(--cat-7) after:content-['']"
const intimacyDayClassName: Record<TIntimacyDay, string> = {
  protected: dot,
  unprotected: cn(dot, 'after:bg-(--cat-7)'),
}

const intimacyLegend: TIntimacyDay[] = ['protected', 'unprotected']

type TMode = 'period' | 'intimacy'

const toValue = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')

// A month at a time: logged periods behind, predictions ahead. Tapping a
// day opens the period it is part of, or a new one starting on it, and can
// make it the last day of the period before (longer or shorter). Without a
// logged last day, a period follows the expected length. A day up to today
// can log sex instead, protected or not.
export const PeriodCalendar = ({
  periods,
  intimacy,
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
  const [mode, setMode] = useState<TMode>('period')
  // The day's logged sex being edited; a new one when undefined.
  const [intimacyId, setIntimacyId] = useState<string>()
  const periodLength = stats?.periodLength ?? 5
  const tapOf = (date: Date) =>
    periodTap(periods, toValue(date), today, periodLength)
  const tap = selected && tapOf(selected)
  const byId = (id?: string) => periods.find((period) => period.id === id)
  const handleSelect = (date?: Date) => {
    setSelected(date)
    setMode('period')
    setIntimacyId(undefined)
    // The day after a period continues it unless unticked.
    const end = date && tapOf(date)?.end
    setIsEnd(!!end && (end.isEnd || end.isNext))
  }
  const close = () => setSelected(undefined)
  // From the week before the month to the end of the week after it, for
  // the days shown around it.
  const since = toValue(new Date(month.getFullYear(), month.getMonth(), -6))
  const until = toValue(new Date(month.getFullYear(), month.getMonth() + 1, 7))
  const days = cycleCalendar(periods, stats, today, until, since)
  const kindOf = (date: Date) => days.get(toValue(date))
  const sexDays = intimacyDays(intimacy)
  const sexOf = (date: Date) => sexDays.get(toValue(date))
  const modifiers = {
    ...Object.fromEntries(
      legend.map((kind) => [kind, (date: Date) => kindOf(date) === kind]),
    ),
    ...Object.fromEntries(
      intimacyLegend.map((kind) => [
        kind,
        (date: Date) => sexOf(date) === kind,
      ]),
    ),
  }
  const selectedDay = selected && toValue(selected)
  const sexThatDay = intimacy.filter((entry) => entry.date === selectedDay)
  const now = new Date()
  const isThisMonth =
    month.getFullYear() === now.getFullYear() &&
    month.getMonth() === now.getMonth()
  const dateFormat = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'full',
  })

  const calendarProperties = {
    month,
    onMonthChange: setMonth,
    locale: i18n.language === 'id' ? indonesian : enUS,
    modifiers,
    modifiersClassNames: { ...cycleDayClassName, ...intimacyDayClassName },
    labels: {
      labelGridcell: (date: Date) => {
        const marks = [kindOf(date), sexOf(date)]
          .filter(Boolean)
          .map((kind) =>
            t(
              kind === 'protected' || kind === 'unprotected'
                ? `health.intimacy.${kind}Sex`
                : `health.period.calendar.${kind}`,
            ),
          )
        const label = dateFormat.format(date)
        return marks.length > 0 ? `${label}: ${marks.join(', ')}` : label
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
      <Button
        type="button"
        variant="secondary"
        // Kept in place on this month, so the calendar doesn't move.
        className={cn('h-8', isThisMonth && 'invisible')}
        disabled={isThisMonth}
        onClick={() => setMonth(new Date())}
      >
        {t('datePicker.today')}
      </Button>
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
          {tap && (
            <Segmented
              label={t('health.intimacy.logWhat')}
              value={mode}
              options={[
                { value: 'period', label: t('health.kinds.period') },
                { value: 'intimacy', label: t('health.kinds.intimacy') },
              ]}
              onChange={setMode}
              className="justify-self-center"
            />
          )}
          {tap && mode === 'intimacy' ? (
            <>
              {sexThatDay.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {sexThatDay.map((entry) => (
                    <Button
                      key={entry.id}
                      type="button"
                      variant={
                        intimacyId === entry.id ? 'secondary' : 'outline'
                      }
                      className="h-7 px-2.5 text-xs"
                      onClick={() => setIntimacyId(entry.id)}
                    >
                      {t(
                        entry.protected
                          ? 'health.intimacy.protectedSex'
                          : 'health.intimacy.unprotectedSex',
                      )}
                      {entry.time && ` · ${entry.time}`}
                    </Button>
                  ))}
                  {intimacyId && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 px-2.5 text-xs"
                      onClick={() => setIntimacyId(undefined)}
                    >
                      {t('health.intimacy.addAnother')}
                    </Button>
                  )}
                </div>
              )}
              <HealthEntryForm
                key={`${selectedDay}-intimacy-${intimacyId ?? 'new'}`}
                kind="intimacy"
                entry={sexThatDay.find((entry) => entry.id === intimacyId)}
                defaults={{ date: selectedDay }}
                units={units}
                onSave={onSaveEntry}
                onDelete={onDeleteEntry}
                onClose={close}
              />
            </>
          ) : tap ? (
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
              className={cn('size-4 rounded', cycleDayClassName[kind])}
            />
            {t(`health.period.calendar.${kind}`)}
          </li>
        ))}
        {/* Only once sex is logged, so the legend stays short otherwise. */}
        {intimacy.length > 0 &&
          intimacyLegend.map((kind) => (
            <li
              key={kind}
              className="flex items-center gap-1.5"
            >
              <span
                aria-hidden
                className={cn('relative size-4', intimacyDayClassName[kind])}
              />
              {t(`health.intimacy.${kind}Sex`)}
            </li>
          ))}
      </ul>
    </section>
  )
}
