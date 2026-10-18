import { useId, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'

import { Action } from '~/components/base/action'
import { Button } from '~/components/base/button'
import { DatePicker } from '~/components/base/date-picker'
import { SaveStatus, TSaveStatus } from '~/components/base/save-status'
import { Segmented } from '~/components/base/segmented'
import { SexIcon } from '~/components/base/sex-icon'
import { Textarea } from '~/components/base/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/base/tooltip'
import { useHealthLog } from '~/components/pages/health'
import { Label } from '~/components/ui/label'
import { auth } from '~/lib/configs/firebase'
import { useAutosave } from '~/lib/hooks/use-autosave'
import { useCreateHealthLog } from '~/lib/hooks/use-create-health-log'
import { useDocumentTitle } from '~/lib/hooks/use-document-title'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useStoredValues } from '~/lib/hooks/use-stored-values'
import { useUndoHistory } from '~/lib/hooks/use-undo-history'
import { useUpdateArchive } from '~/lib/hooks/use-update-archive'
import { useUpdateHealthLog } from '~/lib/hooks/use-update-health-log'
import { THealthEntry, THealthKind, THealthLogForm } from '~/lib/types/health'
import { today } from '~/lib/utils/finance'
import { ageInYears } from '~/lib/utils/health'
import { isSameJson, mergeById } from '~/lib/utils/merge-stored'
import { getDateLabel } from '~/lib/utils/parser'

import { BodySection } from './body-section'
import { CaloriesSection } from './calories-section'
import { LabSection } from './lab-section'
import { Medications } from './medications'
import { Overview } from './overview'
import { PeriodSection } from './period-section'
import { Reminders } from './reminders'
import { TFormProperties } from './type'

type TTab = 'overview' | THealthKind

// Logged periods or sex, or a period reminder: the log's sex can't change
// while it has any.
const hasSexData = (log: Pick<THealthLogForm, 'content' | 'reminders'>) =>
  log.content.some(
    (entry) => entry.kind === 'period' || entry.kind === 'intimacy',
  ) || (log.reminders ?? []).some((reminder) => reminder.kind === 'period')

// The target as stored: a whole number, or null when cleared.
const toTarget = (value: unknown) => {
  const target = Math.round(Number(value))
  return target > 0 ? target : null
}

export const Form = (properties: TFormProperties) => {
  const { healthLog } = properties
  const formId = useId()
  const { t, i18n } = useTranslation()
  const { mutate: archive } = useUpdateArchive()
  const {
    selectedHealthLog,
    handleDeleteHealthLog,
    handlePinHealthLog,
    handleShareHealthLog,
    handleUnlinkHealthLog,
    handleBackHealthLog,
  } = useHealthLog()
  const { data: userData } = useUserData()
  const navigate = useNavigate()
  const [searchParameters, setSearchParameters] = useSearchParams()
  const { mutate: mutateCreate, isPending: isCreatePending } =
    useCreateHealthLog()
  const { mutate: mutateUpdate } = useUpdateHealthLog()
  const isPinned = healthLog?.isPinned
  const canWrite = healthLog?.permissions?.write.includes(userData?.uid || '')
  const isOwner = healthLog?.owner === userData?.uid
  const isEditable = isOwner || canWrite
  const isReadOnly = !!healthLog && !isEditable
  const sharedCount = new Set(
    [
      ...(healthLog?.permissions?.read || []),
      ...(healthLog?.permissions?.write || []),
    ].filter((uid) => uid !== auth?.currentUser?.uid),
  ).size
  const dateLabel = healthLog
    ? getDateLabel({
        updatedAt: healthLog.updatedAt?.seconds,
        createdAt: healthLog.createdAt.seconds,
        t,
        locale: i18n.language,
      })
    : ''

  const storedValues: THealthLogForm = {
    name: selectedHealthLog?.name ?? '',
    birthDate: selectedHealthLog?.birthDate ?? '',
    sex: selectedHealthLog?.sex ?? 'female',
    calorieTarget: selectedHealthLog?.calorieTarget ?? null,
    content: selectedHealthLog?.content ?? [],
    reminders: selectedHealthLog?.reminders ?? [],
    medications: selectedHealthLog?.medications ?? [],
    doseLog: selectedHealthLog?.doseLog ?? [],
  }
  const formMethods = useForm<THealthLogForm>({
    defaultValues: storedValues,
  })
  // Measurements, reminders, medicines and doses merge one by one, so ones
  // added or deleted on two devices at once are all kept.
  useStoredValues({
    form: formMethods,
    stored: storedValues,
    merge: {
      content: mergeById,
      reminders: mergeById,
      medications: mergeById,
      doseLog: mergeById,
    },
  })
  const {
    watch,
    getValues,
    setValue,
    formState: { isDirty },
  } = formMethods
  const values = watch()
  useDocumentTitle(values.name || t('navigation.health'))
  const isCreating = useRef(false)
  const [saveStatus, setSaveStatus] = useState<TSaveStatus>('idle')
  // Changing a birth date already set waits for a confirmation, so a stray
  // tap or typing can't move ages, growth charts and ranges by accident.
  // A ref for `save`, which may run from an older render; state to re-render.
  const confirmedBirthDateReference = useRef<string>(undefined)
  const [confirmedBirthDate, setConfirmedBirthDate] = useState<string>()
  const storedBirthDate = selectedHealthLog?.birthDate ?? ''
  // Fixed while the log holds data that depends on it (periods).
  const lockedSex = hasSexData(values) ? selectedHealthLog?.sex : undefined
  const [isSexHintOpen, setIsSexHintOpen] = useState(false)
  const isBirthDatePending =
    !!storedBirthDate &&
    values.birthDate !== storedBirthDate &&
    values.birthDate !== confirmedBirthDate
  const units = userData?.labUnits ?? 'conventional'
  const bmiStandard = userData?.bmiStandard ?? 'kemenkes'

  // Writes only what differs from the stored log, so it is safe to call at
  // any time (autosave, leaving the page, the Save button).
  const save = async () => {
    if (isReadOnly) return
    const data = {
      ...getValues(),
      calorieTarget: toTarget(getValues('calorieTarget')),
    }
    if (selectedHealthLog) {
      const changes: Partial<THealthLogForm> = {}
      if (data.name !== (selectedHealthLog.name ?? '')) changes.name = data.name
      if (
        data.birthDate !== (selectedHealthLog.birthDate ?? '') &&
        (!selectedHealthLog.birthDate ||
          data.birthDate === confirmedBirthDateReference.current)
      )
        changes.birthDate = data.birthDate
      if (!hasSexData(data) && data.sex !== selectedHealthLog.sex)
        changes.sex = data.sex
      if (data.calorieTarget !== (selectedHealthLog.calorieTarget ?? null))
        changes.calorieTarget = data.calorieTarget
      if (!isSameJson(data.content, selectedHealthLog.content ?? []))
        changes.content = data.content
      if (!isSameJson(data.reminders ?? [], selectedHealthLog.reminders ?? []))
        changes.reminders = data.reminders ?? []
      if (
        !isSameJson(data.medications ?? [], selectedHealthLog.medications ?? [])
      )
        changes.medications = data.medications ?? []
      if (!isSameJson(data.doseLog ?? [], selectedHealthLog.doseLog ?? []))
        changes.doseLog = data.doseLog ?? []
      if (Object.keys(changes).length === 0) return
      setSaveStatus('saving')
      const isSaved = await mutateUpdate({
        id: selectedHealthLog.id,
        ...changes,
      })
      setSaveStatus(isSaved ? 'saved' : 'error')
      return
    }
    if (isCreating.current || (!data.name && data.content.length === 0)) return
    isCreating.current = true
    const reference = await mutateCreate(data)
    // Stays set after success: the page switches to the new log and this
    // form unmounts, which must not create it a second time.
    if (!reference) isCreating.current = false
    return reference
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    const reference = await save()
    if (reference) navigate(`/health/${reference.id}`, { replace: true })
  }

  useAutosave({
    save,
    watch: [
      values.name,
      values.birthDate,
      values.sex,
      String(values.calorieTarget ?? ''),
      JSON.stringify(values.content),
      JSON.stringify(values.reminders ?? []),
      JSON.stringify(values.medications ?? []),
      JSON.stringify(values.doseLog ?? []),
    ],
    saveWhenIdle: !!selectedHealthLog,
  })

  const birthDateFormat = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
  })
  const formatBirthDate = (date: string) =>
    birthDateFormat.format(new Date(`${date}T00:00:00`))

  // Undo and redo over the whole log (details, entries, reminders,
  // medicines and doses), in steps (a pause in changes, or each entry
  // saved).
  const current = {
    name: values.name,
    birthDate: values.birthDate,
    sex: values.sex,
    calorieTarget: values.calorieTarget,
    content: values.content,
    reminders: values.reminders ?? [],
    medications: values.medications ?? [],
    doseLog: values.doseLog ?? [],
  }
  const stored = {
    name: selectedHealthLog?.name ?? '',
    birthDate: selectedHealthLog?.birthDate ?? '',
    sex: selectedHealthLog?.sex ?? 'female',
    calorieTarget: selectedHealthLog?.calorieTarget ?? null,
    content: selectedHealthLog?.content ?? [],
    reminders: selectedHealthLog?.reminders ?? [],
    medications: selectedHealthLog?.medications ?? [],
    doseLog: selectedHealthLog?.doseLog ?? [],
  }
  const undoHistory = useUndoHistory({
    key: selectedHealthLog?.id ?? 'create',
    // As text, so the value only changes when the log does (`watch()` gives
    // a new object every render).
    value: JSON.stringify(current),
    stored: JSON.stringify(stored),
  })
  const restore = (next?: string) => {
    if (!next) return
    const log = JSON.parse(next) as typeof current
    for (const field of [
      'name',
      'birthDate',
      'sex',
      'calorieTarget',
      'content',
      'reminders',
      'medications',
      'doseLog',
    ] as const)
      setValue(field, log[field], { shouldDirty: true })
  }
  const historyActions = isReadOnly
    ? {}
    : {
        handleUndo: () => restore(undoHistory.undo()),
        handleRedo: () => restore(undoHistory.redo()),
        canUndo: undoHistory.canUndo,
        canRedo: undoHistory.canRedo,
      }

  const handleSaveEntry = (entry: THealthEntry) => {
    const current = getValues('content')
    setValue(
      'content',
      current.some((item) => item.id === entry.id)
        ? current.map((item) => (item.id === entry.id ? entry : item))
        : [...current, entry],
      { shouldDirty: true },
    )
  }

  const handleDeleteEntry = (id: string) => {
    setValue(
      'content',
      getValues('content').filter((item) => item.id !== id),
      { shouldDirty: true },
    )
  }

  // Sections, kept in the address so Back and reloading keep them. Period
  // tracking shows for women and girls from 8.
  const shouldShowPeriod =
    values.sex === 'female' &&
    (!values.birthDate || ageInYears(values.birthDate, today()) >= 8)
  const tabs: TTab[] = [
    'overview',
    'body',
    'glucose',
    'uricAcid',
    'cholesterol',
    'calories',
    ...(shouldShowPeriod ? (['period'] as const) : []),
  ]
  const requested = searchParameters.get('section') as TTab | null
  const tab: TTab =
    requested && tabs.includes(requested) ? requested : 'overview'
  const openTab = (next: TTab) =>
    setSearchParameters(
      (current) => {
        if (next === 'overview') current.delete('section')
        else current.set('section', next)
        return current
      },
      { replace: true },
    )

  const labKind = (['glucose', 'uricAcid', 'cholesterol'] as const).find(
    (kind) => kind === tab,
  )

  const sectionProperties = {
    log: values,
    isReadOnly,
    units,
    bmiStandard,
    onSaveEntry: handleSaveEntry,
    onDeleteEntry: handleDeleteEntry,
  }

  const sexOptions = (
    <Segmented
      label={t('health.form.sex.label')}
      value={lockedSex ?? values.sex}
      className="h-8"
      options={(['female', 'male'] as const)
        .filter((sex) => !lockedSex || sex === lockedSex)
        .map((sex) => ({
          value: sex,
          label: t(`health.form.sex.${sex}`),
          icon: <SexIcon sex={sex} />,
        }))}
      onChange={(sex) => {
        if (!lockedSex) setValue('sex', sex, { shouldDirty: true })
      }}
    />
  )

  return (
    <FormProvider {...formMethods}>
      <div className="group/form is-shown mx-auto w-full max-w-3xl space-y-6">
        <div className="sticky top-20 z-40 flex justify-center md:top-24">
          {healthLog ? (
            <Action
              className="w-full"
              buttonClassName="glass-surface"
              isOwner={isOwner}
              isEditable={isEditable}
              isPinned={isPinned}
              handleDelete={() => handleDeleteHealthLog({ healthLog })}
              handlePin={() =>
                handlePinHealthLog({ healthLog, isPinned: !isPinned })
              }
              isArchived={healthLog.isArchived}
              handleArchive={() =>
                archive('healthLogs', healthLog.id, !healthLog.isArchived)
              }
              handleShare={() => handleShareHealthLog({ healthLog })}
              handleUnlink={() => handleUnlinkHealthLog({ healthLog })}
              sharedCount={sharedCount}
              handleBack={handleBackHealthLog}
              {...historyActions}
            />
          ) : (
            <Action
              className="w-full"
              buttonClassName="glass-surface"
              isLoading={isCreatePending}
              isCreate={true}
              formId={formId}
              handleBack={handleBackHealthLog}
              disabled={!isDirty}
              {...historyActions}
            />
          )}
        </div>

        <form
          id={formId}
          onSubmit={handleCreate}
          className="grid gap-3"
        >
          <Textarea
            name="name"
            placeholder={t('health.form.name')}
            inputClassName="border-none ring-0 text-xl md:text-xl font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none p-0 focus-visible:shadow-none focus:outline-hidden resize-none min-h-0"
            autoFocus={!healthLog} // eslint-disable-line jsx-a11y/no-autofocus -- new logs only
            rows={1}
            readOnly={isReadOnly}
          />
          <fieldset
            disabled={isReadOnly}
            className="flex flex-wrap items-start gap-3 [&_button[aria-haspopup=dialog]]:h-8 [&_input]:h-8 [&_label]:block [&_label]:text-xs"
          >
            <div className="w-44">
              <DatePicker
                name="birthDate"
                label={t('health.form.birthDate')}
              />
            </div>
            {/* A label like the date's, and the same 32px height, so the two
                line up. ♀ and ♂ in their colours (as on the card). */}
            <div className="grid gap-1">
              <Label>{t('health.form.sex.label')}</Label>
              {/* Only its own while periods are logged. */}
              {lockedSex ? (
                <TooltipProvider>
                  <Tooltip
                    open={isSexHintOpen}
                    onOpenChange={setIsSexHintOpen}
                  >
                    <TooltipTrigger asChild>
                      {/* Opens on tap as well as on hover and focus. */}
                      <div
                        className="cursor-help"
                        onClickCapture={() => setIsSexHintOpen(true)}
                      >
                        {sexOptions}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t('health.form.sex.locked')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                sexOptions
              )}
            </div>
          </fieldset>
          {isBirthDatePending && (
            <div
              role="alert"
              className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm"
            >
              <p className="min-w-0 flex-1">
                {values.birthDate
                  ? t('health.form.birthDateConfirm', {
                      from: formatBirthDate(storedBirthDate),
                      to: formatBirthDate(values.birthDate),
                    })
                  : t('health.form.birthDateClear', {
                      from: formatBirthDate(storedBirthDate),
                    })}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-8"
                  onClick={() =>
                    setValue('birthDate', storedBirthDate, {
                      shouldDirty: true,
                    })
                  }
                >
                  {t('health.form.birthDateKeep')}
                </Button>
                <Button
                  type="button"
                  className="h-8"
                  onClick={() => {
                    confirmedBirthDateReference.current = values.birthDate
                    setConfirmedBirthDate(values.birthDate)
                    void save()
                  }}
                >
                  {t('health.form.birthDateChange')}
                </Button>
              </div>
            </div>
          )}
        </form>

        <Reminders
          log={values}
          isReadOnly={isReadOnly}
          showPeriod={shouldShowPeriod}
          onChange={(reminders) =>
            setValue('reminders', reminders, { shouldDirty: true })
          }
          onOpen={openTab}
        />

        <Medications
          log={values}
          isReadOnly={isReadOnly}
          onChangeMedications={(medications) =>
            setValue('medications', medications, { shouldDirty: true })
          }
          onChangeDoses={(doses) =>
            setValue('doseLog', doses, { shouldDirty: true })
          }
        />

        <div className="-mx-4 overflow-x-auto px-4">
          <Segmented
            label={t('health.sections')}
            value={tab}
            options={tabs.map((value) => ({
              value,
              label: t(
                value === 'overview'
                  ? 'health.overview'
                  : `health.kinds.${value}`,
              ),
            }))}
            onChange={openTab}
          />
        </div>

        {tab === 'overview' && (
          <Overview
            {...sectionProperties}
            onOpen={openTab}
          />
        )}
        {tab === 'body' && <BodySection {...sectionProperties} />}
        {labKind && (
          <LabSection
            {...sectionProperties}
            key={labKind}
            kind={labKind}
          />
        )}
        {tab === 'calories' && <CaloriesSection {...sectionProperties} />}
        {tab === 'period' && <PeriodSection {...sectionProperties} />}
      </div>
      <span className="flex justify-center gap-2 text-xs text-muted-foreground">
        <span>
          {dateLabel}{' '}
          {healthLog &&
            (isEditable
              ? !isOwner && `(${t('form.permissions.shared')})`
              : `(${t('form.permissions.readOnly')})`)}
        </span>
        <SaveStatus status={saveStatus} />
      </span>
    </FormProvider>
  )
}
