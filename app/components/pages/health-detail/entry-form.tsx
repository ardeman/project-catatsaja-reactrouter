import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { DatePicker } from '~/components/base/date-picker'
import { Input } from '~/components/base/input'
import { NumberInput } from '~/components/base/number-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/base/select'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import {
  fromDisplayUnit,
  labUnitLabel,
  TLabMeasure,
  toDisplayUnit,
} from '~/lib/constants/health'
import {
  TGlucoseContext,
  THealthEntry,
  THealthKind,
  TLabUnits,
} from '~/lib/types/health'
import { today } from '~/lib/utils/finance'
import { compactEntry, newHealthEntryId } from '~/lib/utils/health'
import {
  healthEntrySchema,
  THealthEntryFormValues,
} from '~/lib/validations/health'

type TProperties = {
  kind: THealthKind
  // The entry being edited; a new one when undefined.
  entry?: THealthEntry
  units: TLabUnits
  onSave: (entry: THealthEntry) => void
  onDelete: (id: string) => void
  onClose: () => void
}

const glucoseContexts: TGlucoseContext[] = [
  'fasting',
  'beforeMeal',
  'afterMeal',
  'random',
  'bedtime',
]
const meals = ['breakfast', 'lunch', 'dinner', 'snack'] as const
const flows = ['light', 'medium', 'heavy'] as const

const nowTime = () => new Date().toTimeString().slice(0, 5)

// A stored lab value (mg/dL) as the form shows it.
const shown = (
  value: number | undefined,
  measure: TLabMeasure,
  units: TLabUnits,
) => (value === undefined ? '' : String(toDisplayUnit(value, measure, units)))

const number = (text: string) => (text === '' ? undefined : Number(text))

const toValues = (
  kind: THealthKind,
  entry: THealthEntry | undefined,
  units: TLabUnits,
): THealthEntryFormValues => {
  const base = {
    date: entry?.date ?? today(),
    time:
      entry?.time ??
      (kind === 'glucose' || kind === 'calories' ? nowTime() : ''),
    note: entry?.note ?? '',
    weight: '',
    height: '',
    head: '',
    value: '',
    total: '',
    ldl: '',
    hdl: '',
    triglycerides: '',
    kcal: '',
    context: 'fasting',
    meal: 'breakfast',
    end: '',
    flow: '',
  }
  if (!entry) return base
  switch (entry.kind) {
    case 'body': {
      return {
        ...base,
        weight: entry.weight === undefined ? '' : String(entry.weight),
        height: entry.height === undefined ? '' : String(entry.height),
        head: entry.head === undefined ? '' : String(entry.head),
      }
    }
    case 'glucose': {
      return {
        ...base,
        value: shown(entry.value, 'glucose', units),
        context: entry.context,
      }
    }
    case 'uricAcid': {
      return { ...base, value: shown(entry.value, 'uricAcid', units) }
    }
    case 'cholesterol': {
      return {
        ...base,
        total: shown(entry.total, 'cholesterol', units),
        ldl: shown(entry.ldl, 'cholesterol', units),
        hdl: shown(entry.hdl, 'cholesterol', units),
        triglycerides: shown(entry.triglycerides, 'triglycerides', units),
      }
    }
    case 'calories': {
      return { ...base, kcal: String(entry.kcal), meal: entry.meal }
    }
    case 'period': {
      return { ...base, end: entry.end ?? '', flow: entry.flow ?? '' }
    }
  }
}

// The form's text back to a stored entry (lab values in mg/dL).
const toEntry = (
  kind: THealthKind,
  id: string,
  values: THealthEntryFormValues,
  units: TLabUnits,
): THealthEntry => {
  const base = {
    id,
    date: values.date,
    time: values.time || undefined,
    note: values.note.trim() || undefined,
  }
  const lab = (text: string, measure: TLabMeasure) => {
    const value = number(text)
    return value === undefined
      ? undefined
      : Number(fromDisplayUnit(value, measure, units).toPrecision(6))
  }
  switch (kind) {
    case 'body': {
      return compactEntry({
        ...base,
        kind,
        weight: number(values.weight),
        height: number(values.height),
        head: number(values.head),
      })
    }
    case 'glucose': {
      return compactEntry({
        ...base,
        kind,
        value: lab(values.value, 'glucose') ?? 0,
        context: values.context as TGlucoseContext,
      })
    }
    case 'uricAcid': {
      return compactEntry({
        ...base,
        kind,
        value: lab(values.value, 'uricAcid') ?? 0,
      })
    }
    case 'cholesterol': {
      return compactEntry({
        ...base,
        kind,
        total: lab(values.total, 'cholesterol'),
        ldl: lab(values.ldl, 'cholesterol'),
        hdl: lab(values.hdl, 'cholesterol'),
        triglycerides: lab(values.triglycerides, 'triglycerides'),
      })
    }
    case 'calories': {
      return compactEntry({
        ...base,
        kind,
        kcal: number(values.kcal) ?? 0,
        meal: values.meal as (typeof meals)[number],
      })
    }
    case 'period': {
      return compactEntry({
        ...base,
        kind,
        end: values.end || undefined,
        flow: (values.flow || undefined) as (typeof flows)[number] | undefined,
      })
    }
  }
}

// Adds or edits one measurement of any kind. Lab values are typed in the
// person's units and saved in mg/dL.
export const HealthEntryForm = ({
  kind,
  entry,
  units,
  onSave,
  onDelete,
  onClose,
}: TProperties) => {
  const { t } = useTranslation(['common', 'zod'])
  const formMethods = useForm<THealthEntryFormValues>({
    resolver: zodResolver(healthEntrySchema(t, kind)),
    defaultValues: toValues(kind, entry, units),
  })
  const { handleSubmit, setValue, control } = formMethods
  const [context, meal, flow] = useWatch({
    control,
    name: ['context', 'meal', 'flow'],
  })
  const unit = (measure: TLabMeasure) => labUnitLabel(measure, units)
  const field = (name: string, label: string, digits?: number) => (
    <NumberInput
      name={name}
      label={label}
      allowMath
      fractionDigits={digits}
    />
  )

  const onSubmit = handleSubmit((values) => {
    onSave(toEntry(kind, entry?.id ?? newHealthEntryId(), values, units))
    onClose()
  })

  const choice = <TValue extends string>(
    name: 'context' | 'meal' | 'flow',
    value: string,
    options: readonly TValue[],
    labelKey: string,
    allowNone = false,
  ) => (
    <div className="grid gap-1">
      <Label>{t(`health.form.${name}`)}</Label>
      <Select
        value={value || 'none'}
        onValueChange={(next) =>
          setValue(name, next === 'none' ? '' : next, { shouldDirty: true })
        }
      >
        <SelectTrigger aria-label={t(`health.form.${name}`)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allowNone && (
            <SelectItem value="none">{t('health.form.notSet')}</SelectItem>
          )}
          {options.map((option) => (
            <SelectItem
              key={option}
              value={option}
            >
              {t(`${labelKey}.${option}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <section
      aria-label={t(entry ? 'health.form.edit' : 'health.form.add')}
      className="glass-surface motion-enter rounded-xl border p-3 sm:p-4 [&_[role=combobox]]:h-8 [&_input]:h-8 [&_label]:text-xs [&_label]:leading-tight"
    >
      <FormProvider {...formMethods}>
        <form
          onSubmit={onSubmit}
          className="grid gap-3"
        >
          <div className="grid grid-cols-2 gap-2.5">
            <DatePicker
              name="date"
              label={t(
                kind === 'period' ? 'health.form.start' : 'health.form.date',
              )}
              required
            />
            {kind === 'period' ? (
              <DatePicker
                name="end"
                label={t('health.form.end')}
              />
            ) : (
              <Input
                name="time"
                type="time"
                label={t('health.form.time')}
              />
            )}
          </div>

          {kind === 'body' && (
            <div className="grid grid-cols-3 gap-2.5">
              {field('weight', `${t('health.form.weight')} (kg)`, 2)}
              {field('height', `${t('health.form.height')} (cm)`, 1)}
              {field('head', `${t('health.form.head')} (cm)`, 1)}
            </div>
          )}
          {kind === 'glucose' && (
            <div className="grid grid-cols-2 gap-2.5">
              {field(
                'value',
                `${t('health.kinds.glucose')} (${unit('glucose')})`,
              )}
              {choice(
                'context',
                context,
                glucoseContexts,
                'health.glucoseContext',
              )}
            </div>
          )}
          {kind === 'uricAcid' &&
            field(
              'value',
              `${t('health.kinds.uricAcid')} (${unit('uricAcid')})`,
            )}
          {kind === 'cholesterol' && (
            <div className="grid grid-cols-2 gap-2.5">
              {field(
                'total',
                `${t('health.cholesterol.total')} (${unit('cholesterol')})`,
              )}
              {field(
                'ldl',
                `${t('health.cholesterol.ldl')} (${unit('cholesterol')})`,
              )}
              {field(
                'hdl',
                `${t('health.cholesterol.hdl')} (${unit('cholesterol')})`,
              )}
              {field(
                'triglycerides',
                `${t('health.cholesterol.triglycerides')} (${unit('triglycerides')})`,
              )}
            </div>
          )}
          {kind === 'calories' && (
            <div className="grid grid-cols-2 gap-2.5">
              {field('kcal', `${t('health.form.kcal')} (kcal)`, 0)}
              {choice('meal', meal, meals, 'health.meal')}
            </div>
          )}
          {kind === 'period' &&
            choice('flow', flow, flows, 'health.flow', true)}

          <Input
            name="note"
            label={t(
              kind === 'calories' ? 'health.form.food' : 'health.form.note',
            )}
            autoComplete="off"
          />

          <div className="flex flex-wrap items-center gap-2">
            {entry && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive-text"
                onClick={() => {
                  onDelete(entry.id)
                  onClose()
                }}
              >
                {t('health.form.delete')}
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                {t('form.cancel')}
              </Button>
              <Button type="submit">{t('actions.save')}</Button>
            </div>
          </div>
        </form>
      </FormProvider>
    </section>
  )
}
