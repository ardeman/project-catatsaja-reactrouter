import { TStatus } from '~/lib/constants/health'
import { THealthSex } from '~/lib/types/health'

// Child growth against the WHO Child Growth Standards (birth to 5 years),
// with WHO's own method (WHO Anthro): z-scores from the LMS values at the
// child's age in days. The tables load only when a child's growth is
// shown.

export type TGrowthIndicator =
  'weightForAge' | 'lengthForAge' | 'headForAge' | 'bmiForAge'

type TTable = readonly (readonly [number, number, number, number])[]

export type TGrowthStandards = Record<
  TGrowthIndicator,
  Record<THealthSex, TTable>
>

export const loadGrowthStandards = async (): Promise<TGrowthStandards> => {
  const module = await import('~/lib/constants/who-growth-standards')
  return module.whoGrowthStandards
}

// The standards cover birth to 1,856 days.
export const growthMaxDay = 1856

// L, M and S at an age in days, interpolated between the table's days.
export const lmsAt = (table: TTable, day: number) => {
  if (day < 0 || day > growthMaxDay) return
  let low = 0
  let high = table.length - 1
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2)
    if (table[middle][0] <= day) low = middle
    else high = middle
  }
  const a = table[low]
  const b = table[high]
  if (a[0] === day) return { L: a[1], M: a[2], S: a[3] }
  if (b[0] === day) return { L: b[1], M: b[2], S: b[3] }
  const f = (day - a[0]) / (b[0] - a[0])
  return {
    L: a[1] + (b[1] - a[1]) * f,
    M: a[2] + (b[2] - a[2]) * f,
    S: a[3] + (b[3] - a[3]) * f,
  }
}

type TLms = { L: number; M: number; S: number }

// The measurement at a z-score: the reference curves.
export const valueAtZ = ({ L, M, S }: TLms, z: number) =>
  L === 0 ? M * Math.exp(S * z) : M * (1 + L * S * z) ** (1 / L)

const rawZ = (value: number, { L, M, S }: TLms) =>
  L === 0 ? Math.log(value / M) / S : ((value / M) ** L - 1) / (L * S)

// WHO restricts weight-based z-scores beyond ±3, measuring from the third
// SD line in steps of the distance between the second and third.
const zScore = (indicator: TGrowthIndicator, value: number, lms: TLms) => {
  const z = rawZ(value, lms)
  const restricted = indicator === 'weightForAge' || indicator === 'bmiForAge'
  if (!restricted || Math.abs(z) <= 3) return z
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
  const t = 1 / (1 + 0.231_641_9 * Math.abs(z))
  const density = Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI)
  const tail =
    density *
    t *
    (0.319_381_53 +
      t *
        (-0.356_563_782 +
          t * (1.781_477_937 + t * (-1.821_255_978 + t * 1.330_274_429))))
  return (z >= 0 ? 1 - tail : tail) * 100
}

// Status by z-score, with the categories of Kemenkes PMK No. 2/2020 (the
// WHO cut-offs).
const classifyGrowth = (indicator: TGrowthIndicator, z: number): TStatus => {
  switch (indicator) {
    case 'weightForAge': {
      if (z < -3) return { key: 'childSeverelyUnderweight', tone: 'serious' }
      if (z < -2) return { key: 'childUnderweight', tone: 'warning' }
      if (z <= 1) return { key: 'normal', tone: 'good' }
      return { key: 'childRiskOverweight', tone: 'warning' }
    }
    case 'lengthForAge': {
      if (z < -3) return { key: 'severelyStunted', tone: 'serious' }
      if (z < -2) return { key: 'stunted', tone: 'warning' }
      if (z <= 3) return { key: 'normal', tone: 'good' }
      return { key: 'tall', tone: 'warning' }
    }
    case 'headForAge': {
      if (z < -2) return { key: 'small', tone: 'warning' }
      if (z <= 2) return { key: 'normal', tone: 'good' }
      return { key: 'large', tone: 'warning' }
    }
    case 'bmiForAge': {
      if (z < -3) return { key: 'severelyWasted', tone: 'serious' }
      if (z < -2) return { key: 'wasted', tone: 'warning' }
      if (z <= 1) return { key: 'normal', tone: 'good' }
      if (z <= 2) return { key: 'childRiskOverweight', tone: 'warning' }
      if (z <= 3) return { key: 'childOverweight', tone: 'serious' }
      return { key: 'childObese', tone: 'serious' }
    }
  }
}

export const assessGrowth = ({
  standards,
  indicator,
  sex,
  day,
  value,
}: {
  standards: TGrowthStandards
  indicator: TGrowthIndicator
  sex: THealthSex
  day: number
  value: number
}) => {
  const lms = lmsAt(standards[indicator][sex], day)
  if (!lms || !(value > 0)) return
  const z = zScore(indicator, value, lms)
  return { z, percentile: percentile(z), status: classifyGrowth(indicator, z) }
}
