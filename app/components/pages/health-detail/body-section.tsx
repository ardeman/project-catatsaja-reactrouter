import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Segmented } from '~/components/base/segmented'
import { useGrowthStandards } from '~/lib/hooks/use-growth-standards'
import { today } from '~/lib/utils/finance'
import { TGrowthIndicator } from '~/lib/utils/growth'
import {
  assessBody,
  bmi,
  daysBetween,
  entriesOf,
  heightOn,
  isUnderFive,
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
// by the chosen standard. Children up to 5: growth against the WHO
// standards.
export const BodySection = (properties: TSectionProperties) => {
  const { log, bmiStandard } = properties
  const { t, i18n } = useTranslation()
  const [indicator, setIndicator] = useState<TGrowthIndicator>('weightForAge')
  const entries = entriesOf(log.content, 'body')
  const hasBirthDate = !!log.birthDate
  const isChild = hasBirthDate && isUnderFive(log.birthDate, today())
  const standards = useGrowthStandards(isChild)
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
    return entry.weight && height ? bmi(entry.weight, height) : undefined
  }
  const growthPoints = entries
    .toReversed()
    .map((entry) => ({
      day: daysBetween(log.birthDate, entry.date),
      value: valueFor(entry, indicator),
    }))
    .filter(
      (point): point is { day: number; value: number } =>
        point.value !== undefined && point.day >= 0 && point.day <= 1856,
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
          standards,
        })
        const measures = [
          entry.weight !== undefined && `${number.format(entry.weight)} kg`,
          entry.height !== undefined && `${number.format(entry.height)} cm`,
          entry.head !== undefined &&
            `${t('health.form.head')} ${number.format(entry.head)} cm`,
        ].filter(Boolean)
        const growth = assessment.growth
        const percentiles = growth
          ? (
              [
                ['weightForAge', growth.weightForAge],
                ['lengthForAge', growth.lengthForAge],
                ['headForAge', growth.headForAge],
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
          status:
            assessment.bmiStatus ??
            growth?.weightForAge?.status ??
            growth?.lengthForAge?.status,
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
              options={indicators.map((value) => ({
                value,
                label: t(`health.growth.short.${value}`),
              }))}
              onChange={setIndicator}
            />
          </div>
          {standards ? (
            <GrowthChart
              standards={standards}
              indicator={indicator}
              sex={log.sex}
              points={growthPoints}
              label={t(`health.growth.indicators.${indicator}`)}
              unit={units[indicator]}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('health.growth.loading')}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {t('health.growth.source')}
          </p>
        </section>
      )}
      {!isChild && weightPoints.length > 0 && (
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
