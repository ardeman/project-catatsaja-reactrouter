import { Mars, Venus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Action } from '~/components/base/action'
import {
  Card as UICard,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/base/card'
import { HealthStatus } from '~/components/base/health-status'
import { auth } from '~/lib/configs/firebase'
import {
  classifyGlucose,
  labUnitLabel,
  toDisplayUnit,
} from '~/lib/constants/health'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useGrowthStandards } from '~/lib/hooks/use-growth-standards'
import { today } from '~/lib/utils/finance'
import {
  ageInYears,
  assessBody,
  entriesOf,
  isUnderFive,
  periodStats,
} from '~/lib/utils/health'
import { getDateLabel } from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'

import { useHealthLog } from './context'
import { TCardProperties } from './type'

// A person's log at a glance: age, the latest weight (with BMI or, for a
// young child, the WHO percentile), the latest glucose and the next period.
export const Card = (properties: TCardProperties) => {
  const { healthLog, className } = properties
  const { t, i18n } = useTranslation()
  const {
    handleDeleteHealthLog,
    handlePinHealthLog,
    handleShareHealthLog,
    handleUnlinkHealthLog,
  } = useHealthLog()
  const { data: userData } = useUserData()
  const isPinned = healthLog.isPinned
  const canWrite = healthLog.permissions?.write?.includes(userData?.uid || '')
  const isOwner = healthLog.owner === userData?.uid
  const isEditable = isOwner || canWrite
  const now = today()
  const entries = healthLog.content || []
  const dateLabel = getDateLabel({
    updatedAt: healthLog.updatedAt?.seconds,
    createdAt: healthLog.createdAt.seconds,
    t,
    locale: i18n.language,
  })
  const sharedCount = new Set(
    [
      ...(healthLog.permissions?.read || []),
      ...(healthLog.permissions?.write || []),
    ].filter((uid) => uid !== auth?.currentUser?.uid),
  ).size
  const units = userData?.labUnits ?? 'conventional'
  const latestBody = entriesOf(entries, 'body').find(
    (entry) => entry.weight !== undefined,
  )
  const standards = useGrowthStandards(
    !!latestBody && isUnderFive(healthLog.birthDate, latestBody.date),
  )
  const body =
    latestBody &&
    assessBody({
      entry: latestBody,
      entries,
      birthDate: healthLog.birthDate,
      sex: healthLog.sex,
      bmiStandard: userData?.bmiStandard ?? 'kemenkes',
      standards,
    })
  const glucose = entriesOf(entries, 'glucose')[0]
  const period =
    healthLog.sex === 'female' ? periodStats(entries, now) : undefined
  const age = healthLog.birthDate
    ? ageInYears(healthLog.birthDate, now)
    : undefined
  const SexIcon = healthLog.sex === 'female' ? Venus : Mars
  const number = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 1,
  })
  const shortDate = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })

  return (
    <UICard
      className={cn(
        className,
        'group/card relative mb-4 w-full overflow-hidden pb-9 focus-within:ring-2 focus-within:ring-ring sm:w-80 sm:pb-0',
      )}
    >
      <Action
        className="absolute right-1 bottom-1 left-1 z-20"
        isOwner={isOwner}
        isEditable={isEditable}
        isPinned={isPinned}
        handleDelete={() => handleDeleteHealthLog({ healthLog })}
        handlePin={() => handlePinHealthLog({ healthLog, isPinned: !isPinned })}
        handleShare={() => handleShareHealthLog({ healthLog })}
        handleUnlink={() => handleUnlinkHealthLog({ healthLog })}
        sharedCount={sharedCount}
      />
      <CardHeader className="pb-3">
        <CardDescription className="flex justify-between text-xs">
          <span>{dateLabel}</span>
          <span>
            {isEditable
              ? !isOwner && t('form.permissions.shared')
              : t('form.permissions.readOnly')}
          </span>
        </CardDescription>
        <CardTitle className="flex items-center gap-2 text-xl">
          {/* Covers the whole card; the action buttons sit above it. */}
          <Link
            to={`/health/${healthLog.id}`}
            className="min-w-0 truncate outline-hidden after:absolute after:inset-0 after:z-10"
          >
            {healthLog.name || t('health.untitled')}
          </Link>
          <SexIcon
            aria-label={t(`health.form.sex.${healthLog.sex}`)}
            className="size-4 shrink-0 text-muted-foreground"
          />
        </CardTitle>
        {age !== undefined && age >= 0 && (
          <p className="text-xs text-muted-foreground">
            {t('health.age', { count: age })}
          </p>
        )}
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:pb-8">
        {latestBody?.weight !== undefined && body && (
          <div className="grid gap-0.5">
            <p className="text-xs text-muted-foreground">
              {t('health.kinds.body')} ·{' '}
              {shortDate.format(new Date(`${latestBody.date}T00:00:00Z`))}
            </p>
            <p className="font-medium">
              {number.format(latestBody.weight)} kg
              {body.bmi !== undefined && ` · BMI ${number.format(body.bmi)}`}
            </p>
            {body.bmiStatus && <HealthStatus status={body.bmiStatus} />}
            {body.growth?.weightForAge && (
              <span className="flex flex-wrap items-center gap-x-2">
                <span className="text-xs text-muted-foreground">
                  {t('health.growth.percentile', {
                    value: Math.round(body.growth.weightForAge.percentile),
                  })}
                </span>
                <HealthStatus status={body.growth.weightForAge.status} />
              </span>
            )}
          </div>
        )}
        {glucose && (
          <div className="grid gap-0.5">
            <p className="text-xs text-muted-foreground">
              {t('health.kinds.glucose')} ·{' '}
              {t(`health.glucoseContext.${glucose.context}`)}
            </p>
            <p className="font-medium">
              {toDisplayUnit(glucose.value, 'glucose', units)}{' '}
              {labUnitLabel('glucose', units)}
            </p>
            <HealthStatus
              status={classifyGlucose(glucose.value, glucose.context)}
            />
          </div>
        )}
        {period && (
          <div className="grid gap-0.5">
            <p className="text-xs text-muted-foreground">
              {t('health.period.next')}
            </p>
            <p className="font-medium">
              {shortDate.format(new Date(`${period.nextStart}T00:00:00Z`))}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {period.daysUntilNext >= 0
                  ? t('health.period.inDays', { count: period.daysUntilNext })
                  : t('health.period.late', { count: -period.daysUntilNext })}
              </span>
            </p>
          </div>
        )}
        {entries.length === 0 && (
          <p className="text-xs text-muted-foreground">
            {t('health.noEntries')}
          </p>
        )}
      </CardContent>
    </UICard>
  )
}
