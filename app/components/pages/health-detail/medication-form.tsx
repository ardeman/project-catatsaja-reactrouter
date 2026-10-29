import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X } from 'lucide-react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { DatePicker } from '~/components/base/date-picker'
import { Input } from '~/components/base/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/base/select'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { THealthMedication, TMedicationCourse } from '~/lib/types/health'
import { today } from '~/lib/utils/finance'
import { newHealthEntryId } from '~/lib/utils/health'
import {
  medicationSchema,
  TMedicationFormValues,
} from '~/lib/validations/health'

import { TMedicationFormProperties } from './type'

const courses = ['ongoing', 'days', 'doses', 'until'] as const

const toValues = (medication?: THealthMedication): TMedicationFormValues => {
  const course = medication?.course
  return {
    name: medication?.name ?? '',
    dose: medication?.dose ?? '',
    note: medication?.note ?? '',
    times: medication?.times ?? ['08:00'],
    everyDays: String(medication?.everyDays ?? 1),
    start: medication?.start ?? today(),
    course: course?.kind ?? 'days',
    until: course?.kind === 'until' ? course.date : '',
    count:
      course?.kind === 'days'
        ? String(course.days)
        : course?.kind === 'doses'
          ? String(course.doses)
          : '5',
  }
}

const toCourse = (values: TMedicationFormValues): TMedicationCourse => {
  switch (values.course) {
    case 'ongoing': {
      return { kind: 'ongoing' }
    }
    case 'until': {
      return { kind: 'until', date: values.until }
    }
    case 'days': {
      return { kind: 'days', days: Number(values.count) }
    }
    case 'doses': {
      return { kind: 'doses', doses: Number(values.count) }
    }
  }
}

// Adds or edits a medicine: what, how much, at which times, how often and
// for how long. An ongoing one can be stopped here.
export const MedicationForm = ({
  medication,
  onSave,
  onClose,
}: TMedicationFormProperties) => {
  const { t } = useTranslation(['common', 'zod'])
  const formMethods = useForm<TMedicationFormValues>({
    resolver: zodResolver(medicationSchema(t)),
    defaultValues: toValues(medication),
  })
  const {
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = formMethods
  const [times, course] = useWatch({ control, name: ['times', 'course'] })

  const save = (values: TMedicationFormValues, stopped?: string) => {
    const times = [
      ...new Set(values.times.filter((time) => /^\d{2}:\d{2}$/.test(time))),
    ].toSorted((a, b) => a.localeCompare(b))
    const next: THealthMedication = {
      id: medication?.id ?? newHealthEntryId(),
      name: values.name.trim(),
      times,
      everyDays: Number(values.everyDays),
      start: values.start,
      course: toCourse(values),
    }
    const dose = values.dose.trim()
    const note = values.note.trim()
    if (dose) next.dose = dose
    if (note) next.note = note
    const lastDay = stopped ?? medication?.stopped
    if (lastDay) next.stopped = lastDay
    onSave(next)
    onClose()
  }

  const onSubmit = handleSubmit((values) => save(values))
  // Stops it today: today's doses still count, none after.
  const handleStop = handleSubmit((values) => save(values, today()))

  const lengthLabel = t(
    course === 'doses'
      ? 'health.medications.form.doses'
      : 'health.medications.form.days',
  )

  return (
    <section
      aria-label={t(
        medication ? 'health.medications.edit' : 'health.medications.add',
      )}
      className="motion-enter @container rounded-lg border p-3 [&_[role=combobox]]:h-8 [&_input]:h-8 [&_label]:text-xs [&_label]:leading-tight"
    >
      <FormProvider {...formMethods}>
        <form
          onSubmit={onSubmit}
          className="grid gap-3"
        >
          <div className="grid gap-2.5 @xs:grid-cols-2">
            <Input
              name="name"
              label={t('health.medications.form.name')}
              autoComplete="off"
              required
            />
            <Input
              name="dose"
              label={t('health.medications.form.dose')}
              placeholder={t('health.medications.form.dosePlaceholder')}
              autoComplete="off"
            />
          </div>

          <div className="grid gap-1">
            <Label>{t('health.medications.form.times')}</Label>
            <div className="flex flex-wrap items-center gap-2">
              {times.map((_, index) => (
                <div
                  // Times have no id of their own; their place is stable
                  // while the form is open.

                  key={index}
                  className="flex items-center gap-1"
                >
                  <Input
                    name={`times.${index}`}
                    type="time"
                    label={t('health.medications.form.timeNumber', {
                      count: index + 1,
                    })}
                    labelClassName="sr-only"
                    className="w-28"
                  />
                  {times.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={t('health.medications.form.removeTime')}
                      title={t('health.medications.form.removeTime')}
                      onClick={() =>
                        setValue(
                          'times',
                          getValues('times').filter(
                            (__, place) => place !== index,
                          ),
                          { shouldDirty: true },
                        )
                      }
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() =>
                  setValue('times', [...getValues('times'), ''], {
                    shouldDirty: true,
                  })
                }
              >
                <Plus className="size-4" />
                {t('health.medications.form.addTime')}
              </Button>
            </div>
            {errors.times?.message && (
              <p
                role="alert"
                className="text-sm text-destructive-text"
              >
                {errors.times.message}
              </p>
            )}
          </div>

          <div className="grid gap-2.5 @xs:grid-cols-2">
            <Input
              name="everyDays"
              type="number"
              inputMode="numeric"
              min={1}
              max={365}
              label={t('health.medications.form.everyDays')}
            />
            <DatePicker
              name="start"
              label={t('health.medications.form.start')}
              required
            />
          </div>

          <div className="grid gap-2.5 @xs:grid-cols-2">
            <div className="grid gap-1">
              <Label>{t('health.medications.form.course')}</Label>
              <Select
                value={course}
                onValueChange={(next) => {
                  if (next)
                    setValue(
                      'course',
                      next as TMedicationFormValues['course'],
                      {
                        shouldDirty: true,
                      },
                    )
                }}
              >
                <SelectTrigger aria-label={t('health.medications.form.course')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((value) => (
                    <SelectItem
                      key={value}
                      value={value}
                    >
                      {t(`health.medications.courses.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(course === 'days' || course === 'doses') && (
              <Input
                name="count"
                type="number"
                inputMode="numeric"
                min={1}
                label={lengthLabel}
              />
            )}
            {course === 'until' && (
              <DatePicker
                name="until"
                label={t('health.medications.form.until')}
                required
              />
            )}
          </div>

          <Input
            name="note"
            label={t('health.medications.form.note')}
            placeholder={t('health.medications.form.notePlaceholder')}
            autoComplete="off"
          />

          <div className="flex flex-wrap items-center gap-2">
            {medication && !medication.stopped && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive-text"
                onClick={() => void handleStop()}
              >
                {t('health.medications.stop')}
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
