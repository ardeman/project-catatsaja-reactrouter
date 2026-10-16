import { useTranslation } from 'react-i18next'

import { cycleWindows } from '~/lib/utils/cycle-calendar'
import { today } from '~/lib/utils/finance'
import { daysBetween, entriesOf, periodStats } from '~/lib/utils/health'
import { cn } from '~/lib/utils/shadcn'

import { EntryList } from './entry-list'
import { cycleDayClassName, PeriodCalendar } from './period-calendar'
import { TSectionProperties } from './type'

// Logged periods and what they suggest: the next period and the days it
// could fall on, the fertile window, ovulation and the average cycle, also
// on a calendar, where a period is logged by tapping its days, with the
// summary and the logged periods in one card beside it. Estimates, said as such.
export const PeriodSection = (properties: TSectionProperties) => {
  const { log, isReadOnly, onSaveEntry, onDeleteEntry } = properties
  const { t, i18n } = useTranslation()
  const now = today()
  const entries = entriesOf(log.content, 'period')
  const stats = periodStats(log.content, now)
  const dayFormat = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
  const date = (value: string) =>
    dayFormat.format(new Date(`${value}T00:00:00Z`))
  // Ranges without weekdays, and the month once when it doesn't change
  // ("Nov 7 – 12"), so each fits on one line.
  const rangeFormat = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
  const range = ([from, to]: readonly [string, string]) =>
    from === to
      ? date(from)
      : rangeFormat.formatRange(
          new Date(`${from}T00:00:00Z`),
          new Date(`${to}T00:00:00Z`),
        )
  const windows = stats && cycleWindows(stats, stats.nextStart)
  // The cycle bar spans the average cycle, or longer when it runs late.
  const barDays = stats ? Math.max(stats.cycleLength, stats.cycleDay) : 1
  const percent = (days: number) =>
    Math.min(100, Math.max(0, (days / barDays) * 100))
  // Fertile days as days of the current cycle (today is stats.cycleDay).
  const fertileFrom =
    stats && windows
      ? stats.cycleDay + daysBetween(now, windows.fertile[0]) - 1
      : 0
  const fertileTo =
    stats && windows
      ? stats.cycleDay + daysBetween(now, windows.fertile[1]) - 1
      : 0
  const calendar = (
    <PeriodCalendar
      periods={entries}
      stats={stats}
      today={now}
      isReadOnly={isReadOnly}
      units={properties.units}
      onSaveEntry={onSaveEntry}
      onDeleteEntry={onDeleteEntry}
    />
  )

  return (
    <EntryList
      {...properties}
      kind="period"
      entries={entries}
      addLabel={t('health.add.period')}
      beside={(!!stats || !isReadOnly) && calendar}
      emptyLabel={t('health.empty.period')}
      renderRow={(entry) => ({
        primary: entry.end
          ? t('health.period.lasted', {
              count: daysBetween(entry.date, entry.end) + 1,
            })
          : t('health.period.ongoing'),
        secondary: entry.flow ? t(`health.flow.${entry.flow}`) : undefined,
      })}
    >
      {stats && windows && (
        <section className="grid gap-3 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">
                {t('health.period.next')}
              </p>
              <p className="text-lg font-semibold">{date(stats.nextStart)}</p>
            </div>
            <p className="text-right text-sm text-muted-foreground">
              {stats.daysUntilNext >= 0
                ? t('health.period.inDays', { count: stats.daysUntilNext })
                : t('health.period.late', { count: -stats.daysUntilNext })}
            </p>
          </div>
          {/* Today in the cycle, with the fertile window marked. */}
          <div className="grid gap-1">
            <div
              aria-hidden="true"
              className="relative h-2 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="absolute inset-y-0 bg-(--cat-3)/35"
                style={{
                  left: `${percent(fertileFrom)}%`,
                  width: `${percent(fertileTo - fertileFrom + 1)}%`,
                }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-(--cat-5)/70"
                style={{ width: `${percent(stats.cycleDay)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('health.period.cycleDayOf', {
                day: stats.cycleDay,
                count: stats.cycleLength,
              })}
            </p>
          </div>
          <dl className="grid gap-1.5 border-t pt-3 text-sm">
            {(
              [
                ['predicted', windows.predicted],
                ['possible', windows.possible],
                ['fertile', windows.fertile],
                ['ovulation', windows.ovulation],
              ] as const
            ).map(([kind, window]) => (
              <div
                key={kind}
                className="flex items-center gap-2"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-3 shrink-0 rounded',
                    cycleDayClassName[kind],
                  )}
                />
                <dt className="min-w-0 flex-1 text-muted-foreground">
                  {t(`health.period.${kind}`)}
                </dt>
                <dd className="text-right font-medium tabular-nums">
                  {range(window)}
                </dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muted-foreground">
            {t('health.period.averageCycle')}:{' '}
            {t('health.period.days', { count: stats.cycleLength })} ·{' '}
            {t('health.period.averagePeriod')}:{' '}
            {t('health.period.days', { count: stats.periodLength })}.{' '}
            {stats.cycleCount === 0
              ? t('health.period.notEnough')
              : t('health.period.basedOn', { count: stats.cycleCount })}{' '}
            {t('health.period.disclaimer')}
          </p>
        </section>
      )}
    </EntryList>
  )
}
