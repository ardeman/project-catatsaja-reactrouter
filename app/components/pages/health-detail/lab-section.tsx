import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Segmented } from '~/components/base/segmented'
import {
  classifyCholesterol,
  classifyGlucose,
  classifyUricAcid,
  labUnitLabel,
  TLabMeasure,
  toDisplayUnit,
  TStatus,
  uricAcidRange,
} from '~/lib/constants/health'
import { TGlucoseContext } from '~/lib/types/health'
import { today } from '~/lib/utils/finance'
import { ageInYears, entriesOf } from '~/lib/utils/health'

import { EntryList } from './entry-list'
import { MetricChart } from './metric-chart'
import { TSectionProperties } from './type'

type TCholesterolMeasure = 'total' | 'ldl' | 'hdl' | 'triglycerides'

const contexts: ('all' | TGlucoseContext)[] = [
  'all',
  'fasting',
  'beforeMeal',
  'afterMeal',
  'random',
  'bedtime',
]
const cholesterolMeasures: TCholesterolMeasure[] = [
  'total',
  'ldl',
  'hdl',
  'triglycerides',
]

const toneRank = { good: 0, warning: 1, serious: 2 }

// Normal ranges (mg/dL) shaded on the charts.
const glucoseBand: Record<TGlucoseContext, { low: number; high: number }> = {
  fasting: { low: 70, high: 100 },
  beforeMeal: { low: 70, high: 100 },
  afterMeal: { low: 70, high: 140 },
  random: { low: 70, high: 140 },
  bedtime: { low: 70, high: 140 },
}

// Glucose, uric acid or cholesterol: a chart with the normal range, and
// each result with its status. Ranges are for adults; children's results
// are listed without one.
export const LabSection = (
  properties: TSectionProperties & {
    kind: 'glucose' | 'uricAcid' | 'cholesterol'
  },
) => {
  const { kind, log, units } = properties
  const { t } = useTranslation()
  const [context, setContext] = useState<'all' | TGlucoseContext>('all')
  const [measure, setMeasure] = useState<TCholesterolMeasure>('total')
  const isAdult = !log.birthDate || ageInYears(log.birthDate, today()) >= 18
  const display = (value: number, which: TLabMeasure) =>
    `${toDisplayUnit(value, which, units)} ${labUnitLabel(which, units)}`
  const band = (
    range: { low?: number; high?: number },
    which: TLabMeasure,
  ) => ({
    low:
      range.low === undefined
        ? undefined
        : toDisplayUnit(range.low, which, units),
    high:
      range.high === undefined
        ? undefined
        : toDisplayUnit(range.high, which, units),
  })

  if (kind === 'glucose') {
    const entries = entriesOf(log.content, 'glucose')
    const shown =
      context === 'all'
        ? entries
        : entries.filter((entry) => entry.context === context)
    return (
      <EntryList
        {...properties}
        kind="glucose"
        entries={entries}
        addLabel={t('health.add.glucose')}
        emptyLabel={t('health.empty.glucose')}
        renderRow={(entry) => ({
          primary: `${display(entry.value, 'glucose')} · ${t(`health.glucoseContext.${entry.context}`)}`,
          status: classifyGlucose(entry.value, entry.context),
        })}
      >
        {entries.length > 0 && (
          <section className="glass-surface grid gap-3 rounded-xl border p-4">
            <div className="-mx-1 overflow-x-auto px-1">
              <Segmented
                label={t('health.form.context')}
                value={context}
                options={contexts.map((value) => ({
                  value,
                  label:
                    value === 'all'
                      ? t('health.all')
                      : t(`health.glucoseContext.${value}`),
                }))}
                onChange={setContext}
              />
            </div>
            {shown.length > 0 ? (
              <MetricChart
                points={shown.toReversed().map((entry) => ({
                  date: entry.date,
                  time: entry.time,
                  value: toDisplayUnit(entry.value, 'glucose', units),
                }))}
                label={t('health.kinds.glucose')}
                format={(value) => `${value} ${labUnitLabel('glucose', units)}`}
                band={
                  context === 'all'
                    ? undefined
                    : band(glucoseBand[context], 'glucose')
                }
              />
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t('health.empty.filtered')}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t('health.ranges.glucose')}
            </p>
          </section>
        )}
      </EntryList>
    )
  }

  if (kind === 'uricAcid') {
    const entries = entriesOf(log.content, 'uricAcid')
    const [low, high] = uricAcidRange[log.sex]
    return (
      <EntryList
        {...properties}
        kind="uricAcid"
        entries={entries}
        addLabel={t('health.add.uricAcid')}
        emptyLabel={t('health.empty.uricAcid')}
        renderRow={(entry) => ({
          primary: display(entry.value, 'uricAcid'),
          status: isAdult ? classifyUricAcid(entry.value, log.sex) : undefined,
        })}
      >
        {entries.length > 0 && (
          <section className="glass-surface grid gap-3 rounded-xl border p-4">
            <MetricChart
              points={entries.toReversed().map((entry) => ({
                date: entry.date,
                time: entry.time,
                value: toDisplayUnit(entry.value, 'uricAcid', units),
              }))}
              label={t('health.kinds.uricAcid')}
              format={(value) => `${value} ${labUnitLabel('uricAcid', units)}`}
              band={isAdult ? band({ low, high }, 'uricAcid') : undefined}
            />
            <p className="text-xs text-muted-foreground">
              {t('health.ranges.uricAcid', {
                low: toDisplayUnit(low, 'uricAcid', units),
                high: toDisplayUnit(high, 'uricAcid', units),
                unit: labUnitLabel('uricAcid', units),
              })}
            </p>
          </section>
        )}
      </EntryList>
    )
  }

  const entries = entriesOf(log.content, 'cholesterol')
  const measureOf = (which: TCholesterolMeasure): TLabMeasure =>
    which === 'triglycerides' ? 'triglycerides' : 'cholesterol'
  const statusOf = (which: TCholesterolMeasure, value: number): TStatus =>
    which === 'hdl'
      ? classifyCholesterol.hdl(value, log.sex)
      : classifyCholesterol[which](value)
  const cholesterolBand: Record<
    TCholesterolMeasure,
    { low?: number; high?: number }
  > = {
    total: { high: 200 },
    ldl: { high: 100 },
    hdl: { low: log.sex === 'male' ? 40 : 50 },
    triglycerides: { high: 150 },
  }
  const shown = entries.filter((entry) => entry[measure] !== undefined)
  return (
    <EntryList
      {...properties}
      kind="cholesterol"
      entries={entries}
      addLabel={t('health.add.cholesterol')}
      emptyLabel={t('health.empty.cholesterol')}
      renderRow={(entry) => {
        const present = cholesterolMeasures.filter(
          (which) => entry[which] !== undefined,
        )
        const statuses = present.map((which) => ({
          which,
          status: statusOf(which, entry[which] ?? 0),
        }))
        const worst = statuses.toSorted(
          (a, b) => toneRank[b.status.tone] - toneRank[a.status.tone],
        )[0]
        return {
          primary: present
            .map(
              (which) =>
                `${t(`health.cholesterol.short.${which}`)} ${toDisplayUnit(entry[which] ?? 0, measureOf(which), units)}`,
            )
            .join(' · '),
          status: isAdult ? worst?.status : undefined,
          secondary: isAdult
            ? statuses
                .map(
                  ({ which, status }) =>
                    `${t(`health.cholesterol.short.${which}`)}: ${t(`health.status.${status.key}`)}`,
                )
                .join(' · ')
            : undefined,
        }
      }}
    >
      {entries.length > 0 && (
        <section className="glass-surface grid gap-3 rounded-xl border p-4">
          <div className="-mx-1 overflow-x-auto px-1">
            <Segmented
              label={t('health.kinds.cholesterol')}
              value={measure}
              options={cholesterolMeasures.map((value) => ({
                value,
                label: t(`health.cholesterol.short.${value}`),
              }))}
              onChange={setMeasure}
            />
          </div>
          {shown.length > 0 ? (
            <MetricChart
              points={shown.toReversed().map((entry) => ({
                date: entry.date,
                time: entry.time,
                value: toDisplayUnit(
                  entry[measure] ?? 0,
                  measureOf(measure),
                  units,
                ),
              }))}
              label={t(`health.cholesterol.${measure}`)}
              format={(value) =>
                `${value} ${labUnitLabel(measureOf(measure), units)}`
              }
              band={
                isAdult
                  ? band(cholesterolBand[measure], measureOf(measure))
                  : undefined
              }
            />
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t('health.empty.filtered')}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {t('health.ranges.cholesterol')}
          </p>
        </section>
      )}
    </EntryList>
  )
}
