import { useTranslation } from 'react-i18next'

import { HealthStatus } from '~/components/base/health-status'
import {
  classifyCholesterol,
  classifyGlucose,
  classifyUricAcid,
  labUnitLabel,
  toDisplayUnit,
  TStatus,
} from '~/lib/constants/health'
import { useGrowthStandards } from '~/lib/hooks/use-growth-standards'
import { THealthKind } from '~/lib/types/health'
import { today } from '~/lib/utils/finance'
import {
  ageInYears,
  assessBody,
  caloriesByDay,
  entriesOf,
  isUnderFive,
  periodStats,
} from '~/lib/utils/health'

import { TSectionProperties } from './type'

type TTile = {
  kind: THealthKind
  value: string
  detail?: string
  status?: TStatus
  date?: string
}

// The latest of each measurement, with its status; a tile opens its
// section.
export const Overview = (
  properties: TSectionProperties & { onOpen: (kind: THealthKind) => void },
) => {
  const { log, units, bmiStandard, onOpen } = properties
  const { t, i18n } = useTranslation()
  const now = today()
  const isAdult = !log.birthDate || ageInYears(log.birthDate, now) >= 18
  const number = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 1,
  })
  const dayFormat = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
  const body = entriesOf(log.content, 'body')[0]
  const standards = useGrowthStandards(
    !!body && !!log.birthDate && isUnderFive(log.birthDate, body.date),
  )
  const tiles: TTile[] = []

  if (body) {
    const assessment = assessBody({
      entry: body,
      entries: log.content,
      birthDate: log.birthDate,
      sex: log.sex,
      bmiStandard,
      standards,
    })
    tiles.push({
      kind: 'body',
      value: [
        body.weight !== undefined && `${number.format(body.weight)} kg`,
        body.height !== undefined && `${number.format(body.height)} cm`,
      ]
        .filter(Boolean)
        .join(' · '),
      detail:
        assessment.bmi === undefined
          ? undefined
          : `BMI ${number.format(assessment.bmi)}`,
      status: assessment.bmiStatus ?? assessment.growth?.weightForAge?.status,
      date: body.date,
    })
  }
  const glucose = entriesOf(log.content, 'glucose')[0]
  if (glucose)
    tiles.push({
      kind: 'glucose',
      value: `${toDisplayUnit(glucose.value, 'glucose', units)} ${labUnitLabel('glucose', units)}`,
      detail: t(`health.glucoseContext.${glucose.context}`),
      status: classifyGlucose(glucose.value, glucose.context),
      date: glucose.date,
    })
  const uric = entriesOf(log.content, 'uricAcid')[0]
  if (uric)
    tiles.push({
      kind: 'uricAcid',
      value: `${toDisplayUnit(uric.value, 'uricAcid', units)} ${labUnitLabel('uricAcid', units)}`,
      status: isAdult ? classifyUricAcid(uric.value, log.sex) : undefined,
      date: uric.date,
    })
  const lipids = entriesOf(log.content, 'cholesterol')[0]
  if (lipids) {
    const main = lipids.total ?? lipids.ldl
    tiles.push({
      kind: 'cholesterol',
      value:
        main === undefined
          ? '—'
          : `${toDisplayUnit(main, 'cholesterol', units)} ${labUnitLabel('cholesterol', units)}`,
      detail: t(
        `health.cholesterol.short.${lipids.total === undefined ? 'ldl' : 'total'}`,
      ),
      status:
        !isAdult || main === undefined
          ? undefined
          : lipids.total === undefined
            ? classifyCholesterol.ldl(main)
            : classifyCholesterol.total(main),
      date: lipids.date,
    })
  }
  const calories = caloriesByDay(log.content)[0]
  if (calories)
    tiles.push({
      kind: 'calories',
      value: `${number.format(calories[1])} kcal`,
      detail: log.calorieTarget
        ? t('health.calories.ofTarget', {
            amount: number.format(log.calorieTarget),
          })
        : undefined,
      date: calories[0],
    })
  const period =
    log.sex === 'female' ? periodStats(log.content, now) : undefined
  if (period)
    tiles.push({
      kind: 'period',
      value: dayFormat.format(new Date(`${period.nextStart}T00:00:00Z`)),
      detail:
        period.daysUntilNext >= 0
          ? t('health.period.inDays', { count: period.daysUntilNext })
          : t('health.period.late', { count: -period.daysUntilNext }),
    })

  if (tiles.length === 0)
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {t('health.empty.overview')}
      </p>
    )

  return (
    <div className="grid gap-3">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tiles.map((tile) => (
          <li key={tile.kind}>
            <button
              type="button"
              onClick={() => onOpen(tile.kind)}
              className="glass-surface motion-enter grid h-full w-full content-start gap-0.5 rounded-xl border p-3 text-left hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
            >
              <span className="text-xs text-muted-foreground">
                {tile.kind === 'period'
                  ? t('health.period.next')
                  : t(`health.kinds.${tile.kind}`)}
              </span>
              <span className="truncate font-semibold">{tile.value}</span>
              {tile.detail && (
                <span className="truncate text-xs text-muted-foreground">
                  {tile.detail}
                </span>
              )}
              {tile.status && <HealthStatus status={tile.status} />}
              {tile.date && (
                <span className="text-[11px] text-muted-foreground">
                  {dayFormat.format(new Date(`${tile.date}T00:00:00Z`))}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{t('health.disclaimer')}</p>
    </div>
  )
}
