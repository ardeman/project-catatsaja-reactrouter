import { TFunction } from 'i18next'
import { z } from 'zod'

import { THealthKind } from '~/lib/types/health'

// The entry form holds text (number fields give "72.5"); each kind requires
// its own fields. Numbers must be positive.
const NUMBER_FIELDS = [
  'weight',
  'height',
  'head',
  'value',
  'total',
  'ldl',
  'hdl',
  'triglycerides',
  'kcal',
] as const

type TNumberField = (typeof NUMBER_FIELDS)[number]

// Fields of which at least one is needed; a single field is required.
const required: Record<THealthKind, TNumberField[]> = {
  body: ['weight', 'height', 'head'],
  glucose: ['value'],
  uricAcid: ['value'],
  cholesterol: ['total', 'ldl', 'hdl', 'triglycerides'],
  calories: ['kcal'],
  period: [],
}

export const healthEntrySchema = (t: TFunction, kind: THealthKind) =>
  z
    .object({
      date: z
        .string()
        .min(1, { error: t('zod:errors.invalid_type_received_null') }),
      time: z.string(),
      note: z.string(),
      context: z.string(),
      meal: z.string(),
      end: z.string(),
      flow: z.string(),
      weight: z.string(),
      height: z.string(),
      head: z.string(),
      value: z.string(),
      total: z.string(),
      ldl: z.string(),
      hdl: z.string(),
      triglycerides: z.string(),
      kcal: z.string(),
    })
    .superRefine((values, context) => {
      const fields: Record<string, string> = values
      for (const field of NUMBER_FIELDS) {
        const text = fields[field]
        if (text === '') continue
        if (!(Number(text) > 0))
          context.addIssue({
            code: 'custom',
            path: [field],
            message: t('zod:errors.too_small.number.not_inclusive', {
              minimum: 0,
            }),
          })
      }
      const needed = required[kind]
      if (needed.length > 0 && needed.every((field) => fields[field] === ''))
        context.addIssue({
          code: 'custom',
          path: [needed[0]],
          message: t(
            needed.length === 1
              ? 'zod:errors.invalid_type_received_null'
              : 'health.form.atLeastOne',
          ),
        })
      if (kind === 'period' && values.end && values.end < values.date)
        context.addIssue({
          code: 'custom',
          path: ['end'],
          message: t('health.form.endBeforeStart'),
        })
    })

export type THealthEntryFormValues = z.infer<
  ReturnType<typeof healthEntrySchema>
>

const COURSES = ['ongoing', 'until', 'days', 'doses'] as const

// A medicine: its name, at least one time a day, and how long it is taken.
// Counts are typed as text and must be whole numbers from 1.
export const medicationSchema = (t: TFunction) =>
  z
    .object({
      name: z
        .string()
        .trim()
        .min(1, { error: t('zod:errors.invalid_type_received_null') }),
      dose: z.string(),
      note: z.string(),
      times: z
        .array(z.string())
        .refine((times) => times.some((time) => /^\d{2}:\d{2}$/.test(time)), {
          error: t('health.medications.form.timeNeeded'),
        }),
      everyDays: z.string(),
      start: z
        .string()
        .min(1, { error: t('zod:errors.invalid_type_received_null') }),
      course: z.enum(COURSES),
      until: z.string(),
      count: z.string(),
    })
    .superRefine((values, context) => {
      const atLeastOne = (field: 'everyDays' | 'count') => {
        const count = Number(values[field])
        if (!Number.isSafeInteger(count) || count < 1)
          context.addIssue({
            code: 'custom',
            path: [field],
            message: t('zod:errors.too_small.number.inclusive', {
              minimum: 1,
            }),
          })
      }
      atLeastOne('everyDays')
      if (values.course === 'days' || values.course === 'doses')
        atLeastOne('count')
      if (values.course === 'until' && !values.until)
        context.addIssue({
          code: 'custom',
          path: ['until'],
          message: t('zod:errors.invalid_type_received_null'),
        })
      if (
        values.course === 'until' &&
        values.until &&
        values.until < values.start
      )
        context.addIssue({
          code: 'custom',
          path: ['until'],
          message: t('health.form.endBeforeStart'),
        })
    })

export type TMedicationFormValues = z.infer<ReturnType<typeof medicationSchema>>
