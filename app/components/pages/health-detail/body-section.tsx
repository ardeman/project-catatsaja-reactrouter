import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Segmented } from '~/components/base/segmented'
import { Button } from '~/components/ui/button'
import { useGrowthTables } from '~/lib/hooks/use-growth-tables'
import { THealthEntryOf } from '~/lib/types/health'
import { today } from '~/lib/utils/finance'
import {
  growthLastDay,
  growthMaxDay,
  growthSourceOn,
  TGrowthIndicator,
} from '~/lib/utils/growth'
import {
  assessBody,
  bmi,
  daysBetween,
  entriesOf,
  heightOn,
} from '~/lib/utils/health'

import { EntryList } from './entry-list'
import { GrowthChart } from './growth-chart'
import { MetricChart } from './metric-chart'
import { TEntryMetric, TSectionProperties } from './type'

// Signed change from the older measurement, for the comparison column.
// Unchanged values stay blank so the eye can find what moved.
const metricChange = (
  current: number | undefined,
  previous: number | undefined,
  format: (value: number) => string,
  unit?: string,
): Pick<TEntryMetric, 'change' | 'changeDirection'> => {
  if (current === undefined || previous === undefined) return {}
  const delta = current - previous
  if (Math.abs(delta) < 0.05) return {}
  const amount = `${delta > 0 ? '+' : '−'}${format(Math.abs(delta))}`
  return {
    change: unit ? `${amount} ${unit}` : amount,
    changeDirection: delta > 0 ? 'up' : 'down',
  }
}

const indicators: TGrowthIndicator[] = [
  'weightForAge',
  'lengthForAge',
  'headForAge',
  'bmiForAge',
]

// Weight, height and head circumference. Adults: weight over time and BMI
// by the chosen standard. Children up to 19: growth against WHO's tables
// (the Child Growth Standards to 5, the 2007 reference from 5 to 19), and
// from 5 also weight over time.
export const BodySection = (properties: TSectionProperties) => {
  const { log, bmiStandard } = properties
  const { t, i18n } = useTranslation()
  const entries = entriesOf(log.content, 'body')
  const hasBirthDate = !!log.birthDate
  const ageDay = hasBirthDate ? daysBetween(log.birthDate, today()) : -1
  const source = growthSourceOn(ageDay)
  const isChild = source !== undefined
  const isPastWeightForAge = ageDay > growthLastDay('weightForAge')
  // The person's choice; until they make one, BMI past 10 (where WHO has no
  // weight-for-age), else weight. Worked out each render: the log, and so
  // the age, arrives after the first one.
  const [chosen, setIndicator] = useState<TGrowthIndicator>()
  const indicator =
    chosen ?? (isPastWeightForAge ? 'bmiForAge' : 'weightForAge')
  const entryDays = entries.map((entry) =>
    daysBetween(log.birthDate, entry.date),
  )
  const tables = useGrowthTables(isChild ? [ageDay, ...entryDays] : [])
  // Head circumference has WHO lines to 5 years only.
  const hasHead =
    ageDay <= growthMaxDay ||
    entries.some(
      (entry, position) =>
        entry.head !== undefined && entryDays[position] <= growthMaxDay,
    )
  // Past 10: earlier weights still show on their chart, with a note.
  const isWeightPastReference =
    indicator === 'weightForAge' && isPastWeightForAge
  const number = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 1,
  })

  // The value an indicator reads from an entry (BMI from the height then).
  const valueFor = (
    entry: (typeof entries)[number],
    which: TGrowthIndicator,
  ) => {
    if (which === 'weightForAge') return entry.weight
    if (which === 'lengthForAge') return entry.height
    if (which === 'headForAge') return entry.head
    const height = entry.height ?? heightOn(log.content, entry.date)
    return height && entry.weight ? bmi(entry.weight, height) : undefined
  }
  const growthPoints = entries
    .toReversed()
    .map((entry) => ({
      day: daysBetween(log.birthDate, entry.date),
      value: valueFor(entry, indicator),
    }))
    .filter(
      (point): point is { day: number; value: number } =>
        point.value !== undefined &&
        point.day >= 0 &&
        point.day <= growthLastDay(indicator),
    )
  const weightPoints = entries
    .toReversed()
    .filter((entry) => entry.weight !== undefined)
    .map((entry) => ({ date: entry.date, value: entry.weight ?? 0 }))
  const units: Record<TGrowthIndicator, string> = {
    weightForAge: 'kg',
    lengthForAge: 'cm',
    headForAge: 'cm',
    bmiForAge: 'kg/m²',
  }
  const format = (value: number) => number.format(value)
  // Columns that appear at least once, so every row shares the same grid.
  const showWeight = entries.some((entry) => entry.weight !== undefined)
  const showHeight = entries.some((entry) => entry.height !== undefined)
  const showHead = entries.some((entry) => entry.head !== undefined)
  const bodyBmi = (entry: THealthEntryOf<'body'>) => {
    const height = entry.height ?? heightOn(log.content, entry.date)
    return height && entry.weight ? bmi(entry.weight, height) : undefined
  }
  const showBmi = entries.some((entry) => bodyBmi(entry) !== undefined)

  return (
    <EntryList
      {...properties}
      kind="body"
      entries={entries}
      addLabel={t('health.add.body')}
      emptyLabel={t('health.empty.body')}
      renderRow={(entry) => {
        const assessment = assessBody({
          entry,
          entries: log.content,
          birthDate: log.birthDate,
          sex: log.sex,
          bmiStandard,
          tables,
        })
        // The next row is the older measurement (list is newest first).
        const previous = entries[entries.indexOf(entry) + 1]
        const previousBmi = previous ? bodyBmi(previous) : undefined
        const metrics: TEntryMetric[] = []
        if (showWeight) {
          metrics.push({
            key: 'weight',
            label: t('health.form.weight'),
            value:
              entry.weight === undefined
                ? undefined
                : `${format(entry.weight)} kg`,
            ...metricChange(entry.weight, previous?.weight, format, 'kg'),
          })
        }
        if (showHeight) {
          metrics.push({
            key: 'height',
            label: t('health.form.height'),
            value:
              entry.height === undefined
                ? undefined
                : `${format(entry.height)} cm`,
            ...metricChange(entry.height, previous?.height, format, 'cm'),
          })
        }
        if (showHead) {
          metrics.push({
            key: 'head',
            label: t('health.form.head'),
            value:
              entry.head === undefined ? undefined : `${format(entry.head)} cm`,
            ...metricChange(entry.head, previous?.head, format, 'cm'),
          })
        }
        if (showBmi) {
          metrics.push({
            key: 'bmi',
            label: t('health.growth.short.bmiForAge'),
            value:
              assessment.bmi === undefined ? undefined : format(assessment.bmi),
            ...metricChange(assessment.bmi, previousBmi, format),
          })
        }
        const growth = assessment.growth
        // BMI for age from 5, where it is the main index.
        const percentiles = growth
          ? (
              [
                ['weightForAge', growth.weightForAge],
                ['lengthForAge', growth.lengthForAge],
                ['headForAge', growth.headForAge],
                [
                  'bmiForAge',
                  growth.bmiForAge?.source === 'reference'
                    ? growth.bmiForAge
                    : undefined,
                ],
              ] as const
            )
              .filter(([, value]) => value)
              .map(
                ([key, value]) =>
                  `${t(`health.growth.short.${key}`)} P${Math.round(value?.percentile ?? 0)}`,
              )
              .join(' · ')
          : undefined
        return {
          metrics,
          status: assessment.bmiStatus ?? assessment.growthLead?.status,
          secondary: percentiles,
        }
      }}
    >
      {!hasBirthDate && (
        <p className="text-sm text-muted-foreground">
          {t('health.growth.needBirthDate')}
        </p>
      )}
      {isChild && (
        <section className="glass-surface grid gap-3 rounded-xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium">{t('health.growth.title')}</h2>
            <Segmented
              label={t('health.growth.title')}
              value={indicator}
              options={indicators
                .filter((value) => value !== 'headForAge' || hasHead)
                .map((value) => ({
                  value,
                  label: t(`health.growth.short.${value}`),
                }))}
              onChange={setIndicator}
            />
          </div>
          {(!isWeightPastReference || growthPoints.length > 0) &&
            (tables.isLoaded ? (
              <GrowthChart
                tables={tables}
                indicator={indicator}
                sex={log.sex}
                points={growthPoints}
                ageDay={ageDay}
                label={t(`health.growth.indicators.${indicator}`)}
                unit={units[indicator]}
              />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t('health.growth.loading')}
              </p>
            ))}
          {isWeightPastReference && (
            <div className="grid justify-items-center gap-2 py-4 text-center">
              <p className="max-w-sm text-sm text-muted-foreground">
                {t('health.growth.noWeightForAge')}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIndicator('bmiForAge')}
              >
                {t('health.growth.showBmiForAge')}
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {t(
              source === 'reference'
                ? 'health.growth.sourceReference'
                : 'health.growth.source',
            )}
          </p>
        </section>
      )}
      {source !== 'standards' && weightPoints.length > 0 && (
        <section className="glass-surface grid gap-3 rounded-xl border p-4">
          <h2 className="text-sm font-medium">{t('health.chart.weight')}</h2>
          <MetricChart
            points={weightPoints}
            label={t('health.chart.weight')}
            format={(value) => `${number.format(value)} kg`}
          />
        </section>
      )}
    </EntryList>
  )
}
