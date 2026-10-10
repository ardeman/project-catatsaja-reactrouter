import { useId, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'

import { Action } from '~/components/base/action'
import { DatePicker } from '~/components/base/date-picker'
import { SaveStatus, TSaveStatus } from '~/components/base/save-status'
import { Segmented } from '~/components/base/segmented'
import { Textarea } from '~/components/base/textarea'
import { useHealthLog } from '~/components/pages/health'
import { auth } from '~/lib/configs/firebase'
import { useAutosave } from '~/lib/hooks/use-autosave'
import { useCreateHealthLog } from '~/lib/hooks/use-create-health-log'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useUpdateHealthLog } from '~/lib/hooks/use-update-health-log'
import { THealthEntry, THealthKind, THealthLogForm } from '~/lib/types/health'
import { today } from '~/lib/utils/finance'
import { ageInYears } from '~/lib/utils/health'
import { getDateLabel } from '~/lib/utils/parser'

import { BodySection } from './body-section'
import { CaloriesSection } from './calories-section'
import { LabSection } from './lab-section'
import { Overview } from './overview'
import { PeriodSection } from './period-section'
import { TFormProperties } from './type'

type TTab = 'overview' | THealthKind

const sameJson = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b)

// The target as stored: a whole number, or null when cleared.
const toTarget = (value: unknown) => {
  const target = Math.round(Number(value))
  return target > 0 ? target : null
}

export const Form = (properties: TFormProperties) => {
  const { healthLog } = properties
  const formId = useId()
  const { t, i18n } = useTranslation()
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

  const formMethods = useForm<THealthLogForm>({
    values: {
      name: selectedHealthLog?.name ?? '',
      birthDate: selectedHealthLog?.birthDate ?? '',
      sex: selectedHealthLog?.sex ?? 'female',
      calorieTarget: selectedHealthLog?.calorieTarget ?? null,
      content: selectedHealthLog?.content ?? [],
    },
    // Changes saved elsewhere must not overwrite what is being typed.
    resetOptions: { keepDirtyValues: true },
  })
  const {
    watch,
    getValues,
    setValue,
    formState: { isDirty },
  } = formMethods
  const values = watch()
  const isCreating = useRef(false)
  const [saveStatus, setSaveStatus] = useState<TSaveStatus>('idle')
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
      if (data.birthDate !== (selectedHealthLog.birthDate ?? ''))
        changes.birthDate = data.birthDate
      if (data.sex !== selectedHealthLog.sex) changes.sex = data.sex
      if (data.calorieTarget !== (selectedHealthLog.calorieTarget ?? null))
        changes.calorieTarget = data.calorieTarget
      if (!sameJson(data.content, selectedHealthLog.content ?? []))
        changes.content = data.content
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
    ],
    saveWhenIdle: !!selectedHealthLog,
  })

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
  const showPeriod =
    values.sex === 'female' &&
    (!values.birthDate || ageInYears(values.birthDate, today()) >= 8)
  const tabs: TTab[] = [
    'overview',
    'body',
    'glucose',
    'uricAcid',
    'cholesterol',
    'calories',
    ...(showPeriod ? (['period'] as const) : []),
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
              handleShare={() => handleShareHealthLog({ healthLog })}
              handleUnlink={() => handleUnlinkHealthLog({ healthLog })}
              sharedCount={sharedCount}
              handleBack={handleBackHealthLog}
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
            className="flex flex-wrap items-end gap-3 [&_input]:h-8 [&_label]:text-xs"
          >
            <div className="w-44">
              <DatePicker
                name="birthDate"
                label={t('health.form.birthDate')}
              />
            </div>
            <div className="grid gap-1">
              <span className="text-xs font-medium">
                {t('health.form.sex.label')}
              </span>
              <Segmented
                label={t('health.form.sex.label')}
                value={values.sex}
                options={[
                  { value: 'female', label: t('health.form.sex.female') },
                  { value: 'male', label: t('health.form.sex.male') },
                ]}
                onChange={(sex) => setValue('sex', sex, { shouldDirty: true })}
              />
            </div>
          </fieldset>
        </form>

        <div className="-mx-4 overflow-x-auto px-4">
          <Segmented
            label={t('health.sections')}
            value={tab}
            options={tabs.map((value) => ({
              value,
              label:
                value === 'overview'
                  ? t('health.overview')
                  : t(`health.kinds.${value}`),
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
