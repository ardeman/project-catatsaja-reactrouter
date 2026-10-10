import { useTranslation } from 'react-i18next'

import { today } from '~/lib/utils/finance'
import { daysBetween, entriesOf, periodStats } from '~/lib/utils/health'

import { EntryList } from './entry-list'
import { TSectionProperties } from './type'

// Logged periods and what they suggest: the next period, the fertile
// window and the average cycle. Estimates, said as such.
export const PeriodSection = (properties: TSectionProperties) => {
  const { log } = properties
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

  return (
    <EntryList
      {...properties}
      kind="period"
      entries={entries}
      addLabel={t('health.add.period')}
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
      {stats && (
        <section className="glass-surface grid gap-3 rounded-xl border p-4">
          <dl className="grid grid-cols-2 gap-x-2 gap-y-3">
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">
                {t('health.period.next')}
              </dt>
              <dd className="text-lg font-semibold">
                {date(stats.nextStart)}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {stats.daysUntilNext >= 0
                    ? t('health.period.inDays', { count: stats.daysUntilNext })
                    : t('health.period.late', { count: -stats.daysUntilNext })}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t('health.period.cycleDay')}
              </dt>
              <dd className="font-medium">{stats.cycleDay}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t('health.period.fertile')}
              </dt>
              <dd className="font-medium">
                {date(stats.fertileStart)} – {date(stats.fertileEnd)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t('health.period.averageCycle')}
              </dt>
              <dd className="font-medium">
                {t('health.period.days', { count: stats.cycleLength })}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t('health.period.averagePeriod')}
              </dt>
              <dd className="font-medium">
                {t('health.period.days', { count: stats.periodLength })}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
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
