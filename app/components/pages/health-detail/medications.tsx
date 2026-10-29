import { Check, History, Pencil, Pill, Plus, Trash2, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button as UIButton } from '~/components/ui/button'
import { useClock } from '~/lib/hooks/use-clock'
import { THealthDose, THealthMedication } from '~/lib/types/health'
import {
  doseId,
  dosesLeft,
  dosesOn,
  expectedEnd,
  isFinished,
  nextDose,
  waitingDoses,
} from '~/lib/utils/medication-schedule'
import { cn } from '~/lib/utils/shadcn'

import { MedicationForm } from './medication-form'
import { SectionInfo } from './section-info'
import { TMedicationsProperties } from './type'

// The newest marks shown in a medicine's history; the rest stay stored.
const HISTORY_SHOWN = 30

// A log's medicines: doses waiting to be marked taken or skipped, today's
// doses, each medicine's course and history, and finished ones folded away.
export const Medications = (properties: TMedicationsProperties) => {
  const { log, isReadOnly, onChangeMedications, onChangeDoses } = properties
  const { t, i18n } = useTranslation()
  const { today, now } = useClock()
  const medications = log.medications ?? []
  const doses = log.doseLog ?? []
  // A medicine's id, 'new' for one being added.
  const [editing, setEditing] = useState<string>()
  const [historyOf, setHistoryOf] = useState<string>()

  const active = medications.filter(
    (medication) => !isFinished(medication, doses, today),
  )
  const finished = medications.filter((medication) =>
    isFinished(medication, doses, today),
  )
  const waiting = waitingDoses({ medications: active, doses, today, now })

  const formatDay = (date: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`))

  const dayLabel = (date: string) =>
    date === today ? t('health.medications.today') : formatDay(date)

  const mark = (
    medication: THealthMedication,
    date: string,
    time: string,
    status?: THealthDose['status'],
  ) => {
    const id = doseId(medication.id, date, time)
    const rest = doses.filter((dose) => dose.id !== id)
    onChangeDoses(
      status
        ? [...rest, { id, medicationId: medication.id, date, time, status }]
        : rest,
    )
  }

  const handleSave = (medication: THealthMedication) =>
    onChangeMedications(
      medications.some((item) => item.id === medication.id)
        ? medications.map((item) =>
            item.id === medication.id ? medication : item,
          )
        : [...medications, medication],
    )

  // Its history goes with it.
  const handleRemove = (medication: THealthMedication) => {
    onChangeMedications(medications.filter((item) => item.id !== medication.id))
    onChangeDoses(doses.filter((dose) => dose.medicationId !== medication.id))
  }

  const title = (medication: THealthMedication) =>
    [medication.name, medication.dose].filter(Boolean).join(' · ')

  const schedule = (medication: THealthMedication) =>
    [
      medication.times.join(', '),
      t('health.reminders.every', { count: medication.everyDays }),
    ].join(' · ')

  // How much of the course is left.
  const progress = (medication: THealthMedication) => {
    if (medication.stopped)
      return t('health.medications.stoppedOn', {
        date: formatDay(medication.stopped),
      })
    if (isFinished(medication, doses, today))
      return t('health.medications.done')
    if (medication.course.kind === 'ongoing')
      return t('health.medications.courses.ongoing')
    const left = dosesLeft(medication, doses, today) ?? 0
    const end = expectedEnd(medication, doses, today)
    return [
      t('health.medications.dosesLeft', { count: left }),
      end ? t('health.medications.until', { date: formatDay(end) }) : '',
    ]
      .filter(Boolean)
      .join(' · ')
  }

  const history = (medication: THealthMedication) => {
    const marks = doses
      .filter((dose) => dose.medicationId === medication.id)
      .toSorted((a, b) =>
        `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`),
      )
    const taken = marks.filter((dose) => dose.status === 'taken').length
    return (
      <div className="grid gap-1 border-t px-3 py-2">
        <p className="text-xs text-muted-foreground">
          {marks.length === 0
            ? t('health.medications.historyEmpty')
            : t('health.medications.historyCount', {
                taken,
                skipped: marks.length - taken,
              })}
        </p>
        {marks.length > 0 && (
          <ul
            aria-label={t('health.medications.history')}
            className="grid gap-0.5 text-sm"
          >
            {marks.slice(0, HISTORY_SHOWN).map((dose) => (
              <li
                key={dose.id}
                className="flex items-center gap-2"
              >
                <span className="min-w-0 flex-1 tabular-nums">
                  {dayLabel(dose.date)} {dose.time}
                </span>
                <span
                  className={cn(
                    dose.status === 'skipped' && 'text-muted-foreground',
                  )}
                >
                  {t(`health.medications.status.${dose.status}`)}
                </span>
                {!isReadOnly && (
                  <UIButton
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label={t('health.medications.unmark')}
                    title={t('health.medications.unmark')}
                    onClick={() => mark(medication, dose.date, dose.time)}
                  >
                    <Undo2 className="size-3.5" />
                  </UIButton>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  const row = (medication: THealthMedication, isActive: boolean) => {
    if (editing === medication.id)
      return (
        <li key={medication.id}>
          <MedicationForm
            medication={medication}
            onSave={handleSave}
            onClose={() => setEditing(undefined)}
          />
        </li>
      )
    const todays = isActive ? dosesOn(medication, doses, today) : []
    const next = isActive
      ? nextDose({ medication, doses, today, now })
      : undefined
    return (
      <li
        key={medication.id}
        className="rounded-lg border"
      >
        <div className="grid gap-0.5 px-3 pt-2">
          <span className="truncate text-sm font-medium">
            {title(medication)}
          </span>
          <span className="text-xs text-muted-foreground">
            {[
              schedule(medication),
              progress(medication),
              next && next.date !== today
                ? t('health.reminders.next', {
                    date: `${formatDay(next.date)} ${next.time}`,
                  })
                : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
          {medication.note && (
            <span className="text-xs text-muted-foreground">
              {medication.note}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 py-1 pr-1 pl-3">
          {todays.length > 0 && (
            <div
              role="group"
              aria-label={t('health.medications.todaysDoses', {
                name: medication.name,
              })}
              className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5"
            >
              <span className="text-xs text-muted-foreground">
                {t('health.medications.today')}
              </span>
              {todays.map((dose) => (
                <UIButton
                  key={dose.time}
                  type="button"
                  size="sm"
                  variant={dose.status === 'taken' ? 'default' : 'outline'}
                  className={cn(
                    'h-7 gap-1 px-2 tabular-nums',
                    dose.status === 'skipped' &&
                      'text-muted-foreground line-through',
                  )}
                  aria-pressed={dose.status === 'taken'}
                  aria-label={t('health.medications.doseAt', {
                    time: dose.time,
                    status: t(
                      dose.status
                        ? `health.medications.status.${dose.status}`
                        : 'health.medications.status.none',
                    ),
                  })}
                  title={t('health.medications.toggle')}
                  disabled={isReadOnly}
                  onClick={() =>
                    mark(
                      medication,
                      today,
                      dose.time,
                      dose.status ? undefined : 'taken',
                    )
                  }
                >
                  {dose.status === 'taken' && <Check className="size-3.5" />}
                  {dose.time}
                </UIButton>
              ))}
            </div>
          )}
          <div className="ml-auto flex shrink-0">
            <UIButton
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('health.medications.history')}
              title={t('health.medications.history')}
              aria-expanded={historyOf === medication.id}
              onClick={() =>
                setHistoryOf((current) =>
                  current === medication.id ? undefined : medication.id,
                )
              }
            >
              <History className="size-4" />
            </UIButton>
            {!isReadOnly && (
              <UIButton
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('health.medications.edit')}
                title={t('health.medications.edit')}
                onClick={() => setEditing(medication.id)}
              >
                <Pencil className="size-4" />
              </UIButton>
            )}
            {!isReadOnly && (
              <UIButton
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('health.medications.remove')}
                title={t('health.medications.remove')}
                onClick={() => handleRemove(medication)}
              >
                <Trash2 className="size-4" />
              </UIButton>
            )}
          </div>
        </div>
        {historyOf === medication.id && history(medication)}
      </li>
    )
  }

  return (
    <section
      aria-labelledby="health-medications-title"
      className="glass-surface grid gap-3 rounded-xl border p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <h2
            id="health-medications-title"
            className="text-base font-semibold"
          >
            {t('health.medications.title')}
          </h2>
          <SectionInfo
            label={t('health.medications.about')}
            text={t('health.medications.hint')}
          />
        </div>
        {!isReadOnly && editing !== 'new' && (
          <UIButton
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => setEditing('new')}
          >
            <Plus className="size-4" />
            {t('health.medications.add')}
          </UIButton>
        )}
      </div>

      {waiting.length > 0 && (
        <ul
          aria-label={t('health.medications.waiting')}
          className="grid gap-2"
        >
          {waiting.map(({ medication, date, time }) => (
            <li
              key={doseId(medication.id, date, time)}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2"
            >
              <Pill
                aria-hidden="true"
                className="size-4 shrink-0 text-foreground"
              />
              <span className="min-w-0 flex-1 text-sm">
                <span className="font-medium">{title(medication)}</span>{' '}
                <span className="text-muted-foreground">
                  {t('health.medications.dueAt', {
                    day: dayLabel(date),
                    time,
                  })}
                </span>
              </span>
              {!isReadOnly && (
                <div className="flex gap-2">
                  <UIButton
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => mark(medication, date, time, 'skipped')}
                  >
                    {t('health.medications.skip')}
                  </UIButton>
                  <UIButton
                    type="button"
                    size="sm"
                    onClick={() => mark(medication, date, time, 'taken')}
                  >
                    {t('health.medications.take')}
                  </UIButton>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {medications.length === 0 && editing !== 'new' && (
        <p className="text-sm text-muted-foreground">
          {t('health.medications.empty')}
        </p>
      )}

      {active.length > 0 && (
        <ul className="grid gap-2">
          {active.map((medication) => row(medication, true))}
        </ul>
      )}

      {editing === 'new' && (
        <MedicationForm
          onSave={handleSave}
          onClose={() => setEditing(undefined)}
        />
      )}

      {finished.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            {t('health.medications.finished', { count: finished.length })}
          </summary>
          <ul className="mt-2 grid gap-2">
            {finished.map((medication) => row(medication, false))}
          </ul>
        </details>
      )}
    </section>
  )
}
