import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Segmented } from '~/components/base/segmented'
import { Button } from '~/components/ui/button'
import { useGrowthTables } from '~/lib/hooks/use-growth-tables'
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
import { TSectionProperties } from './type'

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
        const measures = [
          entry.weight !== undefined && `${number.format(entry.weight)} kg`,
          entry.height !== undefined && `${number.format(entry.height)} cm`,
          entry.head !== undefined &&
            `${t('health.form.head')} ${number.format(entry.head)} cm`,
        ].filter(Boolean)
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
          primary: [
            ...measures,
            assessment.bmi !== undefined &&
              `BMI ${number.format(assessment.bmi)}`,
          ]
            .filter(Boolean)
            .join(' · '),
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
