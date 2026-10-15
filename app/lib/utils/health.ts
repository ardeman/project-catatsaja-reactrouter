import { classifyBmi } from '~/lib/constants/health'
import {
  TBmiStandard,
  THealthEntry,
  THealthEntryOf,
  THealthKind,
  THealthSex,
} from '~/lib/types/health'
import {
  assessGrowth,
  growthSourceOn,
  TGrowthIndicator,
  TGrowthTables,
} from '~/lib/utils/growth'

const DAY = 86_400_000

const toTime = (date: string) => Date.parse(`${date}T00:00:00Z`)

const toDate = (time: number) => new Date(time).toISOString().slice(0, 10)

const addDays = (date: string, days: number) =>
  toDate(toTime(date) + days * DAY)

export const daysBetween = (from: string, to: string) =>
  Math.round((toTime(to) - toTime(from)) / DAY)

export const newHealthEntryId = () => crypto.randomUUID()

// Full years between the birth date and `on` (today by default).
export const ageInYears = (birthDate: string, on: string) => {
  const [birthYear, birthMonth, birthDay] = birthDate.split('-').map(Number)
  const [year, month, day] = on.split('-').map(Number)
  const hasHadBirthday =
    month > birthMonth || (month === birthMonth && day >= birthDay)
  return year - birthYear - (hasHadBirthday ? 0 : 1)
}

// Entries of one kind, newest first (by date, then time, then the order
// they were added).
export const entriesOf = <TKind extends THealthKind>(
  entries: THealthEntry[],
  kind: TKind,
) =>
  entries
    .map((entry, index) => ({ entry, index }))
    .filter(
      (item): item is { entry: THealthEntryOf<TKind>; index: number } =>
        item.entry.kind === kind,
    )
    .toSorted(
      (a, b) =>
        b.entry.date.localeCompare(a.entry.date) ||
        (b.entry.time ?? '').localeCompare(a.entry.time ?? '') ||
        b.index - a.index,
    )
    .map(({ entry }) => entry)

// The latest height at or before a date (BMI needs one; adults rarely
// remeasure it).
export const heightOn = (entries: THealthEntry[], date: string) =>
  entriesOf(entries, 'body').find(
    (entry) => entry.height !== undefined && entry.date <= date,
  )?.height

export const bmi = (weightKg: number, heightCm: number) =>
  weightKg / (heightCm / 100) ** 2

// Mifflin-St Jeor resting energy, times 1.375 for light activity: a
// starting point for an adult's daily calories.
export const suggestedCalories = ({
  weight,
  height,
  age,
  sex,
}: {
  weight: number
  height: number
  age: number
  sex: THealthSex
}) =>
  Math.round(
    (10 * weight + 6.25 * height - 5 * age + (sex === 'male' ? 5 : -161)) *
      1.375,
  )

// kcal per day, newest day first.
export const caloriesByDay = (entries: THealthEntry[]) => {
  const totals = new Map<string, number>()
  for (const entry of entriesOf(entries, 'calories'))
    totals.set(entry.date, (totals.get(entry.date) ?? 0) + entry.kcal)
  return [...totals]
}

// Cycle estimates from the logged periods: the average of up to the last
// six cycles (start to start), 28 days until there are two periods; the
// average period length, 5 days until one has an end. Ovulation is taken
// as 14 days before the next period, the fertile window as the five days
// before it and the day after. The shortest and longest recent cycles say
// how far a period may stray from the estimate. Estimates only: cycles vary.
export const periodStats = (entries: THealthEntry[], today: string) => {
  const periods = entriesOf(entries, 'period').toReversed()
  if (periods.length === 0) return
  const cycles: number[] = []
  for (const [index, period] of periods.entries()) {
    if (index === 0) continue
    const length = daysBetween(periods[index - 1].date, period.date)
    // A gap this long is a missed log more likely than a cycle.
    if (length >= 15 && length <= 90) cycles.push(length)
  }
  const recent = cycles.slice(-6)
  const cycleLength =
    recent.length > 0
      ? Math.round(
          recent.reduce((sum, value) => sum + value, 0) / recent.length,
        )
      : 28
  const ended = periods
    .filter((period) => period.end)
    .map((period) => daysBetween(period.date, period.end ?? period.date) + 1)
    .slice(-6)
  const periodLength =
    ended.length > 0
      ? Math.round(ended.reduce((sum, value) => sum + value, 0) / ended.length)
      : 5
  const last = periods.at(-1) ?? periods[0]
  let nextStart = addDays(last.date, cycleLength)
  // Late beyond a whole cycle: keep predicting forward from today.
  while (daysBetween(nextStart, today) > cycleLength)
    nextStart = addDays(nextStart, cycleLength)
  const ovulation = addDays(nextStart, -14)
  return {
    last,
    cycleLength,
    periodLength,
    cycleCount: recent.length,
    shortestCycle: recent.length > 0 ? Math.min(...recent) : cycleLength,
    longestCycle: recent.length > 0 ? Math.max(...recent) : cycleLength,
    nextStart,
    ovulation,
    fertileStart: addDays(ovulation, -5),
    fertileEnd: addDays(ovulation, 1),
    // Positive: days until; negative: days late.
    daysUntilNext: daysBetween(today, nextStart),
    cycleDay: daysBetween(last.date, today) + 1,
  }
}

// Firestore refuses undefined values: drop empty fields before saving.
export const compactEntry = (entry: THealthEntry): THealthEntry =>
  Object.fromEntries(
    Object.entries(entry).filter(
      ([, value]) => value !== undefined && value !== '',
    ),
  ) as THealthEntry

// A body measurement judged for the person's age: adults by BMI category
// (the chosen standard), children up to 19 against the WHO growth tables
// (the standards to 5, the 2007 reference after). From 18 to 19 both show:
// the adult category, and the reference's percentiles.
export const assessBody = ({
  entry,
  entries,
  birthDate,
  sex,
  bmiStandard,
  tables,
}: {
  entry: THealthEntryOf<'body'>
  entries: THealthEntry[]
  birthDate: string
  sex: THealthSex
  bmiStandard: TBmiStandard
  tables?: TGrowthTables
}) => {
  const day = daysBetween(birthDate, entry.date)
  const isAdult = ageInYears(birthDate, entry.date) >= 18
  const height = entry.height ?? heightOn(entries, entry.date)
  const bmiValue =
    height && entry.weight ? bmi(entry.weight, height) : undefined
  const source = tables ? growthSourceOn(day) : undefined
  const measure = (indicator: TGrowthIndicator, value?: number) =>
    tables && value !== undefined
      ? assessGrowth({ tables, indicator, sex, day, value })
      : undefined
  const growth = source
    ? {
        weightForAge: measure('weightForAge', entry.weight),
        lengthForAge: measure('lengthForAge', entry.height),
        headForAge: measure('headForAge', entry.head),
        bmiForAge: measure('bmiForAge', bmiValue),
      }
    : undefined
  // The one to lead with: weight under 5, BMI from 5 (the index PMK No.
  // 2/2020 uses for 5–18 years).
  const order: TGrowthIndicator[] =
    source === 'reference'
      ? ['bmiForAge', 'lengthForAge', 'weightForAge']
      : ['weightForAge', 'lengthForAge']
  const leadIndicator = growth && order.find((indicator) => growth[indicator])
  const leadAssessment = leadIndicator && growth?.[leadIndicator]
  return {
    bmi: bmiValue,
    bmiStatus:
      isAdult && bmiValue !== undefined
        ? classifyBmi(bmiValue, bmiStandard)
        : undefined,
    growth,
    growthLead:
      leadIndicator && leadAssessment
        ? { indicator: leadIndicator, ...leadAssessment }
        : undefined,
  }
}
