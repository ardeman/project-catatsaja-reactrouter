// Tests for child growth from 5 to 19 years (WHO Growth Reference 2007) and
// its join with the birth-to-5 standards:
//   pnpm test:unit
// Plain Node (it runs the TypeScript directly): no emulators, no browser.
// Expected values are printed in WHO's own tables for 5 to 19 years
// (https://www.who.int/tools/growth-reference-data-for-5to19-years).

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { whoGrowthReference } from '../app/lib/constants/who-growth-reference.ts'
import { whoGrowthStandards } from '../app/lib/constants/who-growth-standards.ts'
import {
  assessGrowth,
  DAYS_PER_MONTH,
  growthLastDay,
  growthLms,
  growthSourceOn,
  valueAtZ,
} from '../app/lib/utils/growth.ts'

const tables = { standards: whoGrowthStandards, reference: whoGrowthReference }

// An age in whole months, in days (WHO's average month).
const months = (count) => count * DAYS_PER_MONTH

const assess = (indicator, sex, day, value) =>
  assessGrowth({ tables, indicator, sex, day, value })

const near = (actual, expected, tolerance, message) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message}: ${actual} is not within ${tolerance} of ${expected}`,
  )

describe('WHO 2007 reference values', () => {
  test('medians match the published tables', () => {
    // [indicator, sex, months, WHO median (z-score tables, M column)]
    const medians = [
      ['bmiForAge', 'male', 120, 16.4433],
      ['bmiForAge', 'female', 120, 16.6133],
      ['lengthForAge', 'male', 180, 168.958],
      ['lengthForAge', 'female', 180, 161.6692],
      ['weightForAge', 'male', 120, 31.1586],
      ['weightForAge', 'female', 61, 18.2579],
    ]
    for (const [indicator, sex, age, median] of medians) {
      const lms = growthLms({ tables, indicator, sex, day: months(age) })
      assert.ok(lms, `${indicator} ${sex} ${age}`)
      near(lms.M, median, 1e-9, `${indicator} ${sex} ${age} median`)
      near(assess(indicator, sex, months(age), median).z, 0, 1e-9, 'z at M')
      near(
        assess(indicator, sex, months(age), median).percentile,
        50,
        1e-6,
        'P50',
      )
    }
  })

  test('SD lines match the simplified field tables (one decimal)', () => {
    // BMI-for-age, boys, 10:0 years: −3 to +3 SD.
    const boysBmi10 = [12.8, 13.7, 14.9, 16.4, 18.5, 21.4, 26.1]
    // Height-for-age, girls, 15:0 years.
    const girlsHeight15 = [141, 147.9, 154.8, 161.7, 168.5, 175.4, 182.3]
    for (const [indicator, sex, age, printed] of [
      ['bmiForAge', 'male', 120, boysBmi10],
      ['lengthForAge', 'female', 180, girlsHeight15],
    ]) {
      const lms = growthLms({ tables, indicator, sex, day: months(age) })
      for (const [step, value] of printed.entries())
        near(valueAtZ(lms, step - 3), value, 0.05, `${indicator} ${step - 3}`)
    }
  })

  test('z-scores and percentiles at published SD values', () => {
    // Values from WHO's expanded z-score tables (3 decimals).
    near(assess('bmiForAge', 'male', months(120), 21.4).z, 2, 0.001, 'BMI +2')
    near(
      assess('lengthForAge', 'female', months(180), 147.911).z,
      -2,
      0.001,
      'height −2',
    )
    near(
      assess('weightForAge', 'female', months(120), 23.274).z,
      -2,
      0.001,
      'weight −2',
    )
    near(
      assess('lengthForAge', 'male', months(180), 153.35).percentile,
      2.275,
      0.01,
      'P at −2 SD',
    )
    near(
      assess('bmiForAge', 'female', months(180), 23.514).percentile,
      84.13,
      0.01,
      'P at +1 SD',
    )
  })

  test('weight-based z-scores are restricted beyond ±3 SD', () => {
    const day = months(120)
    const lms = growthLms({ tables, indicator: 'bmiForAge', sex: 'male', day })
    const sd2 = valueAtZ(lms, 2)
    const sd3 = valueAtZ(lms, 3)
    // One SD-step (+2 to +3) past +3 is +4, whatever the curve's skew.
    near(assess('bmiForAge', 'male', day, sd3 + (sd3 - sd2)).z, 4, 1e-9, '+4')
  })
})

describe('ages and joins', () => {
  test('the reference takes over from the standards after 5 years', () => {
    assert.equal(growthSourceOn(-1), undefined)
    assert.equal(growthSourceOn(0), 'standards')
    assert.equal(growthSourceOn(1856), 'standards')
    assert.equal(growthSourceOn(1857), 'reference')
    assert.equal(growthSourceOn(Math.floor(months(228))), 'reference')
    assert.equal(growthSourceOn(Math.floor(months(228)) + 1), undefined)
    // The two meet closely at 5 years: the median BMI and height either
    // side of the switch differ by little.
    for (const [indicator, tolerance] of [
      ['bmiForAge', 0.05],
      ['lengthForAge', 0.5],
    ]) {
      const before = growthLms({ tables, indicator, sex: 'female', day: 1856 })
      const after = growthLms({ tables, indicator, sex: 'female', day: 1857 })
      near(after.M, before.M, tolerance, `${indicator} at 5 years`)
    }
  })

  test('each indicator stops where WHO stops', () => {
    // Head circumference to 5 years, weight-for-age to 10, the rest to 19.
    assert.equal(
      assess('headForAge', 'male', 1857, 52),
      undefined,
      'head after 5',
    )
    assert.ok(assess('weightForAge', 'male', growthLastDay('weightForAge'), 30))
    assert.equal(
      assess('weightForAge', 'male', growthLastDay('weightForAge') + 0.5, 30),
      undefined,
      'weight after 10',
    )
    assert.ok(assess('bmiForAge', 'male', growthLastDay('bmiForAge'), 22))
    assert.equal(
      assess('bmiForAge', 'male', growthLastDay('bmiForAge') + 0.25, 22),
      undefined,
      'BMI after 19',
    )
  })

  test('a table that has not loaded gives nothing', () => {
    assert.equal(
      assessGrowth({
        tables: { standards: whoGrowthStandards },
        indicator: 'bmiForAge',
        sex: 'male',
        day: months(96),
        value: 16,
      }),
      undefined,
    )
  })
})

describe('status', () => {
  const bmiAt = (z, age = 96, sex = 'female') =>
    valueAtZ(
      growthLms({ tables, indicator: 'bmiForAge', sex, day: months(age) }),
      z,
    )
  const bmiStatus = (z, age) =>
    assess('bmiForAge', 'female', months(age ?? 96), bmiAt(z, age)).status.key

  test('BMI-for-age from 5 uses the PMK No. 2/2020 5–18 categories', () => {
    assert.equal(bmiStatus(-3.5), 'severelyThin')
    assert.equal(bmiStatus(-2.5), 'thin')
    assert.equal(bmiStatus(0), 'goodNutrition')
    assert.equal(bmiStatus(0.99), 'goodNutrition')
    assert.equal(bmiStatus(1.5), 'childOverweight')
    assert.equal(bmiStatus(2.5), 'childObese')
  })

  test('under 5 keeps the 0–60 month categories', () => {
    assert.equal(bmiStatus(0, 48), 'goodNutrition')
    assert.equal(bmiStatus(1.5, 48), 'riskOfOverNutrition')
    assert.equal(bmiStatus(2.5, 48), 'childOverweight')
    assert.equal(bmiStatus(3.5, 48), 'childObese')
    assert.equal(bmiStatus(-2.5, 48), 'wasted')
  })

  test('weight-for-age has a status to 5 years, then only a percentile', () => {
    const weightAt = (z, age) =>
      valueAtZ(
        growthLms({
          tables,
          indicator: 'weightForAge',
          sex: 'male',
          day: months(age),
        }),
        z,
      )
    const under5 = assess(
      'weightForAge',
      'male',
      months(48),
      weightAt(-2.5, 48),
    )
    assert.equal(under5.status.key, 'childUnderweight')
    const at8 = assess('weightForAge', 'male', months(96), weightAt(-2.5, 96))
    assert.equal(at8.status, undefined)
    assert.ok(at8.percentile > 0 && at8.percentile < 1)
  })

  test('height-for-age by the WHO cut-offs', () => {
    const day = months(144)
    const lms = growthLms({
      tables,
      indicator: 'lengthForAge',
      sex: 'male',
      day,
    })
    const status = (z) =>
      assess('lengthForAge', 'male', day, valueAtZ(lms, z)).status.key
    assert.equal(status(-3.5), 'severelyStunted')
    assert.equal(status(-2.5), 'stunted')
    assert.equal(status(2.9), 'normal')
    assert.equal(status(3.5), 'tall')
  })
})
