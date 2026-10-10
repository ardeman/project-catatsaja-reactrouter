import {
  TBmiStandard,
  TGlucoseContext,
  THealthSex,
  TLabUnits,
} from '~/lib/types/health'

// Reference ranges for adults, as published by the sources named beside
// each. They describe ranges, not a diagnosis: the app says so wherever it
// shows them. Values are in mg/dL (BMI in kg/m²).

type TTone = 'good' | 'warning' | 'serious'

// A status: its translation key under health.status, and how it reads.
export type TStatus = { key: string; tone: TTone }

type TBand = { below: number; status: TStatus }

// The first band whose `below` the value is under; the last band covers
// everything above.
const classify = (value: number, bands: TBand[], last: TStatus): TStatus =>
  bands.find((band) => value < band.below)?.status ?? last

const good = (key: string): TStatus => ({ key, tone: 'good' })
const warning = (key: string): TStatus => ({ key, tone: 'warning' })
const serious = (key: string): TStatus => ({ key, tone: 'serious' })

// Adult BMI categories. Kemenkes (P2PTM, Indonesia's Ministry of Health),
// WHO international, and WHO Western Pacific (2000) for Asian adults.
// Kemenkes counts 25.0 and 27.0 as the upper end of normal and overweight.
const bmiStandards: Record<TBmiStandard, { bands: TBand[]; last: TStatus }> = {
  kemenkes: {
    bands: [
      { below: 17, status: serious('severelyUnderweight') },
      { below: 18.5, status: warning('underweight') },
      { below: 25.05, status: good('normal') },
      { below: 27.05, status: warning('overweight') },
    ],
    last: serious('obese'),
  },
  who: {
    bands: [
      { below: 18.5, status: warning('underweight') },
      { below: 25, status: good('normal') },
      { below: 30, status: warning('overweight') },
    ],
    last: serious('obese'),
  },
  asiaPacific: {
    bands: [
      { below: 18.5, status: warning('underweight') },
      { below: 23, status: good('normal') },
      { below: 25, status: warning('atRisk') },
      { below: 30, status: serious('obeseOne') },
    ],
    last: serious('obeseTwo'),
  },
}

export const classifyBmi = (bmi: number, standard: TBmiStandard) =>
  classify(bmi, bmiStandards[standard].bands, bmiStandards[standard].last)

// Blood glucose (American Diabetes Association). Under 70 is low and under
// 54 very low at any time; otherwise the thresholds depend on when it was
// measured.
export const classifyGlucose = (value: number, context: TGlucoseContext) => {
  if (value < 54) return serious('veryLow')
  if (value < 70) return warning('low')
  if (context === 'fasting' || context === 'beforeMeal')
    return classify(
      value,
      [
        { below: 100, status: good('normal') },
        { below: 126, status: warning('prediabetes') },
      ],
      serious('diabetes'),
    )
  if (context === 'afterMeal')
    return classify(
      value,
      [
        { below: 140, status: good('normal') },
        { below: 200, status: warning('prediabetes') },
      ],
      serious('diabetes'),
    )
  return classify(
    value,
    [
      { below: 140, status: good('normal') },
      { below: 200, status: warning('elevated') },
    ],
    serious('high'),
  )
}

// Uric acid, common adult lab ranges (labs differ a little).
export const uricAcidRange: Record<THealthSex, [number, number]> = {
  male: [3.4, 7],
  female: [2.4, 6],
}

export const classifyUricAcid = (value: number, sex: THealthSex) => {
  const [low, high] = uricAcidRange[sex]
  if (value < low) return warning('belowRange')
  if (value > high) return warning('high')
  return good('normal')
}

// Cholesterol (NCEP ATP III).
export const classifyCholesterol = {
  total: (value: number) =>
    classify(
      value,
      [
        { below: 200, status: good('desirable') },
        { below: 240, status: warning('borderline') },
      ],
      serious('high'),
    ),
  ldl: (value: number) =>
    classify(
      value,
      [
        { below: 100, status: good('optimal') },
        { below: 130, status: good('nearOptimal') },
        { below: 160, status: warning('borderline') },
        { below: 190, status: serious('high') },
      ],
      serious('veryHigh'),
    ),
  hdl: (value: number, sex: THealthSex) => {
    if (value < (sex === 'male' ? 40 : 50)) return warning('low')
    if (value >= 60) return good('protective')
    return good('normal')
  },
  triglycerides: (value: number) =>
    classify(
      value,
      [
        { below: 150, status: good('normal') },
        { below: 200, status: warning('borderline') },
        { below: 500, status: serious('high') },
      ],
      serious('veryHigh'),
    ),
}

// mg/dL → the SI unit: mmol/L for glucose and lipids, µmol/L for uric acid
// (the unit labs report it in).
export type TLabMeasure =
  'glucose' | 'cholesterol' | 'triglycerides' | 'uricAcid'

const siFactor: Record<TLabMeasure, number> = {
  glucose: 1 / 18.016,
  cholesterol: 1 / 38.67,
  triglycerides: 1 / 88.57,
  uricAcid: 59.48,
}

const decimals: Record<TLabUnits, Record<TLabMeasure, number>> = {
  conventional: { glucose: 0, cholesterol: 0, triglycerides: 0, uricAcid: 1 },
  si: { glucose: 1, cholesterol: 2, triglycerides: 2, uricAcid: 0 },
}

export const labUnitLabel = (measure: TLabMeasure, units: TLabUnits) => {
  if (units === 'conventional') return 'mg/dL'
  return measure === 'uricAcid' ? 'µmol/L' : 'mmol/L'
}

export const toDisplayUnit = (
  mgdl: number,
  measure: TLabMeasure,
  units: TLabUnits,
) => {
  const value = units === 'si' ? mgdl * siFactor[measure] : mgdl
  return Number(value.toFixed(decimals[units][measure]))
}

export const fromDisplayUnit = (
  value: number,
  measure: TLabMeasure,
  units: TLabUnits,
) => (units === 'si' ? value / siFactor[measure] : value)
