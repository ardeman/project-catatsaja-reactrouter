import type { TStatus } from '~/lib/constants/health'
import type { THealthSex } from '~/lib/types/health'

// Child growth with WHO's own method (WHO Anthro and AnthroPlus): z-scores
// from the LMS values at the child's age. Birth to 5 years against the WHO
// Child Growth Standards (2006, by day); from 5 to 19 years against the WHO
// Growth Reference for school-age children and adolescents (2007, by
// month), which WHO built to join the standards at 5. The tables load only
// when a child's growth is shown (`useGrowthTables`). Pure logic with type
// imports only, so it can be tested on its own
// (tests/growth-reference.test.mjs).

export type TGrowthIndicator =
  'weightForAge' | 'lengthForAge' | 'headForAge' | 'bmiForAge'

type TTable = readonly (readonly [number, number, number, number])[]

export type TGrowthStandards = Record<
  TGrowthIndicator,
  Record<THealthSex, TTable>
>

// Head circumference stops at 5 years; weight-for-age is in it to 10
// years only (WHO publishes none past 10).
export type TGrowthReference = Record<
  Exclude<TGrowthIndicator, 'headForAge'>,
  Record<THealthSex, TTable>
>

// The tables loaded so far (each one only once a child of that age is
// shown).
export type TGrowthTables = {
  standards?: TGrowthStandards
  reference?: TGrowthReference
}

// WHO's average month, for ages in months.
export const DAYS_PER_MONTH = 30.4375

// The standards cover birth to 1,856 days; the reference then runs from
// 61 months to 228 (19 years), and weight-for-age to 120 (10 years).
export const growthMaxDay = 1856
const referenceMaxDay = 228 * DAYS_PER_MONTH
const weightMaxDay = 120 * DAYS_PER_MONTH

export type TGrowthSource = 'standards' | 'reference'

// Which WHO tables apply at an age in days.
export const growthSourceOn = (day: number): TGrowthSource | undefined => {
  if (!(day >= 0)) return
  if (day <= growthMaxDay) return 'standards'
  if (day <= referenceMaxDay) return 'reference'
}

// The last day an indicator has WHO values for.
export const growthLastDay = (indicator: TGrowthIndicator) => {
  if (indicator === 'headForAge') return growthMaxDay
  return indicator === 'weightForAge' ? weightMaxDay : referenceMaxDay
}

export type TLms = { L: number; M: number; S: number }

// L, M and S at an age in the table's unit (days or months), interpolated
// between its rows; nothing outside the table.
const lmsAt = (table: TTable, age: number): TLms | undefined => {
  const first = table[0]
  const last = table.at(-1)
  if (!first || !last || age < first[0] || age > last[0]) return
  let low = 0
  let high = table.length - 1
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2)
    if (table[middle][0] <= age) low = middle
    else high = middle
  }
  const a = table[low]
  if (a[0] === age) return { L: a[1], M: a[2], S: a[3] }
  const b = table[high]
  if (b[0] === age) return { L: b[1], M: b[2], S: b[3] }
  const f = (age - a[0]) / (b[0] - a[0])
  return {
    L: a[1] + (b[1] - a[1]) * f,
    M: a[2] + (b[2] - a[2]) * f,
    S: a[3] + (b[3] - a[3]) * f,
  }
}

// L, M and S for an indicator at an age in days, from whichever WHO table
// applies then (undefined while it hasn't loaded, or where WHO has none).
export const growthLms = ({
  tables,
  indicator,
  sex,
  day,
}: {
  tables: TGrowthTables
  indicator: TGrowthIndicator
  sex: THealthSex
  day: number
}) => {
  if (day > growthLastDay(indicator)) return
  const source = growthSourceOn(day)
  if (source === 'standards') {
    const table = tables.standards?.[indicator][sex]
    return table && lmsAt(table, day)
  }
  if (source !== 'reference' || indicator === 'headForAge') return
  const table = tables.reference?.[indicator][sex]
  return table && lmsAt(table, day / DAYS_PER_MONTH)
}

// The measurement at a z-score: the reference curves.
export const valueAtZ = ({ L, M, S }: TLms, z: number) =>
  M * (L === 0 ? Math.exp(S * z) : (1 + L * S * z) ** (1 / L))

const rawZ = (value: number, { L, M, S }: TLms) =>
  L === 0 ? Math.log(value / M) / S : ((value / M) ** L - 1) / (L * S)

// WHO restricts weight-based z-scores beyond ±3 (in the standards and the
// 2007 reference alike), measuring from the third SD line in steps of the
// distance between the second and third.
const zScore = (indicator: TGrowthIndicator, value: number, lms: TLms) => {
  const z = rawZ(value, lms)
  const isRestricted = indicator === 'weightForAge' || indicator === 'bmiForAge'
  if (!isRestricted || Math.abs(z) <= 3) return z
  if (z > 3) {
    const sd3 = valueAtZ(lms, 3)
    return 3 + (value - sd3) / (sd3 - valueAtZ(lms, 2))
  }
  const sd3 = valueAtZ(lms, -3)
  return -3 + (value - sd3) / (valueAtZ(lms, -2) - sd3)
}

// The standard normal distribution (Abramowitz and Stegun 26.2.17, error
// below 7.5e-8), as a percentile.
const percentile = (z: number) => {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const density = Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI)
  const tail =
    density *
    t *
    (0.31938153 +
      t *
        (-0.356563782 +
          t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  return (z >= 0 ? 1 - tail : tail) * 100
}

// Status by z-score. Birth to 5: the categories of Kemenkes PMK No. 2/2020
// for 0–60 months (the WHO cut-offs). From 5: BMI-for-age as in PMK No.
// 2/2020 for 5–18 years (the WHO 2007 cut-offs: thinness below −2,
// overweight above +1, obesity above +2); height-for-age by the WHO
// cut-offs (stunted below −2, severely below −3), which PMK applies only
// to 0–60 months; weight-for-age (to 10 years) as for under-fives.
const classifyGrowth = (
  indicator: TGrowthIndicator,
  z: number,
  source: TGrowthSource,
): TStatus => {
  switch (indicator) {
    case 'weightForAge': {
      if (z < -3) return { key: 'childSeverelyUnderweight', tone: 'serious' }
      if (z < -2) return { key: 'childUnderweight', tone: 'warning' }
      return z <= 1
        ? { key: 'normal', tone: 'good' }
        : { key: 'childRiskOverweight', tone: 'warning' }
    }
    case 'lengthForAge': {
      if (z < -3) return { key: 'severelyStunted', tone: 'serious' }
      if (z < -2) return { key: 'stunted', tone: 'warning' }
      return z <= 3
        ? { key: 'normal', tone: 'good' }
        : { key: 'tall', tone: 'warning' }
    }
    case 'headForAge': {
      if (z < -2) return { key: 'small', tone: 'warning' }
      return z <= 2
        ? { key: 'normal', tone: 'good' }
        : { key: 'large', tone: 'warning' }
    }
    case 'bmiForAge': {
      if (source === 'reference') {
        if (z < -3) return { key: 'severelyThin', tone: 'serious' }
        if (z < -2) return { key: 'thin', tone: 'warning' }
        if (z <= 1) return { key: 'normal', tone: 'good' }
        return z <= 2
          ? { key: 'childOverweight', tone: 'warning' }
          : { key: 'childObese', tone: 'serious' }
      }
      if (z < -3) return { key: 'severelyWasted', tone: 'serious' }
      if (z < -2) return { key: 'wasted', tone: 'warning' }
      if (z <= 1) return { key: 'normal', tone: 'good' }
      if (z <= 2) return { key: 'childRiskOverweight', tone: 'warning' }
      return { key: z <= 3 ? 'childOverweight' : 'childObese', tone: 'serious' }
    }
  }
}

export const assessGrowth = ({
  tables,
  indicator,
  sex,
  day,
  value,
}: {
  tables: TGrowthTables
  indicator: TGrowthIndicator
  sex: THealthSex
  day: number
  value: number
}) => {
  const lms = growthLms({ tables, indicator, sex, day })
  const source = growthSourceOn(day)
  if (!lms || !source || !(value > 0)) return
  const z = zScore(indicator, value, lms)
  return {
    z,
    percentile: percentile(z),
    status: classifyGrowth(indicator, z, source),
    source,
  }
}
