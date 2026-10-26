import { BellRing, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/base/select'
import { Button as UIButton } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { THealthReminder } from '~/lib/types/health'
import { today } from '~/lib/utils/finance'
import { newHealthEntryId, periodStats } from '~/lib/utils/health'
import {
  daysFrom,
  dueReminders,
  fertileWindow,
  isReminderFor,
  reminderStatus,
} from '~/lib/utils/health-reminders'

import { SectionInfo } from './section-info'
import { TRemindersProperties } from './type'

type TReminderKind = THealthReminder['kind']

const measurementKinds = [
  'body',
  'glucose',
  'uricAcid',
  'cholesterol',
  'calories',
] as const

// Reminders counted in days before something expected, not after a log.
const isAhead = (kind: TReminderKind) => kind === 'period' || kind === 'fertile'

// A log's reminders: the ones due now, with a way to log them, and the list
// to add to or remove from.
export const Reminders = (properties: TRemindersProperties) => {
  const { log, isOwner, isReadOnly, showPeriod, onChange, onOpen } = properties
  const { t, i18n } = useTranslation()
  const reminders = log.reminders ?? []
  const now = today()
  const nextPeriodStart = periodStats(log.content, now)?.nextStart
  const due = dueReminders({
    reminders: reminders.filter((reminder) => isReminderFor(reminder, isOwner)),
    entries: log.content,
    today: now,
    nextPeriodStart,
  })
  const [isAdding, setIsAdding] = useState(false)
  const [kind, setKind] = useState<TReminderKind>('body')
  const [days, setDays] = useState('7')
  const [time, setTime] = useState('')
  const [isShared, setIsShared] = useState(false)

  const formatDay = (date: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`))

  const kindLabel = (value: TReminderKind) =>
    t(value === 'fertile' ? 'health.period.fertile' : `health.kinds.${value}`)

  const describe = (reminder: THealthReminder) =>
    reminder.kind === 'period'
      ? t('health.reminders.periodBefore', { count: reminder.daysBefore })
      : reminder.kind === 'fertile'
        ? [
            t('health.reminders.fertileBefore', { count: reminder.daysBefore }),
            t(
              reminder.shared
                ? 'health.reminders.forShared'
                : 'health.reminders.forOwner',
            ),
          ].join(' · ')
        : [
            t('health.reminders.every', { count: reminder.everyDays }),
            reminder.time
              ? t('health.reminders.at', { time: reminder.time })
              : '',
          ]
            .filter(Boolean)
            .join(' ')

  const handleAdd = () => {
    const count = Math.max(isAhead(kind) ? 0 : 1, Math.round(Number(days) || 0))
    const reminder: THealthReminder =
      kind === 'period'
        ? { id: newHealthEntryId(), kind, daysBefore: count }
        : kind === 'fertile'
          ? {
              id: newHealthEntryId(),
              kind,
              daysBefore: count,
              ...(isShared && { shared: true }),
            }
          : {
              id: newHealthEntryId(),
              kind,
              everyDays: count,
              ...(time && { time }),
            }
    onChange([...reminders, reminder])
    setIsAdding(false)
    setTime('')
    setIsShared(false)
  }

  const kinds: TReminderKind[] = [
    ...measurementKinds,
    ...(showPeriod ? (['period'] as const) : []),
    // For the owner's own cycle, so only they set one up.
    ...(showPeriod && isOwner ? (['fertile'] as const) : []),
  ]

  return (
    <section
      aria-labelledby="health-reminders-title"
      className="glass-surface grid gap-3 rounded-xl border p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <h2
            id="health-reminders-title"
            className="text-base font-semibold"
          >
            {t('health.reminders.title')}
          </h2>
          <SectionInfo
            label={t('health.reminders.about')}
            text={t('health.reminders.hint')}
          />
        </div>
        {!isReadOnly && !isAdding && (
          <UIButton
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="size-4" />
            {t('health.reminders.add')}
          </UIButton>
        )}
      </div>

      {due.length > 0 && (
        <ul
          aria-label={t('health.reminders.dueNow')}
          className="grid gap-2"
        >
          {due.map(({ reminder, status }) => (
            <li
              key={reminder.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2"
            >
              <BellRing
                aria-hidden="true"
                className="size-4 shrink-0 text-foreground"
              />
              <span className="min-w-0 flex-1 text-sm">
                <span className="font-medium">
                  {t(`health.reminders.due.kind.${reminder.kind}`)}
                </span>{' '}
                <span className="text-muted-foreground">
                  {reminder.kind === 'period'
                    ? nextPeriodStart &&
                      t('health.reminders.due.expected', {
                        date: formatDay(nextPeriodStart),
                      })
                    : reminder.kind === 'fertile'
                      ? nextPeriodStart &&
                        t('health.reminders.due.fertileFrom', {
                          date: formatDay(fertileWindow(nextPeriodStart).start),
                        })
                      : status.lastDate
                        ? t('health.reminders.due.last', {
                            count: daysFrom(status.lastDate, now),
                          })
                        : t('health.reminders.due.never')}
                </span>
              </span>
              {!isReadOnly && reminder.kind !== 'fertile' && (
                <UIButton
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onOpen(reminder.kind)}
                >
                  {t('health.reminders.logNow')}
                </UIButton>
              )}
            </li>
          ))}
        </ul>
      )}

      {reminders.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground">
          {t('health.reminders.empty')}
        </p>
      )}

      {reminders.length > 0 && (
        <ul className="grid divide-y rounded-lg border">
          {reminders.map((reminder) => {
            const status = reminderStatus({
              reminder,
              entries: log.content,
              today: now,
              nextPeriodStart,
            })
            return (
              <li
                key={reminder.id}
                className="flex items-center gap-2 px-3 py-2"
              >
                <span className="grid min-w-0 flex-1">
                  <span className="truncate text-sm font-medium">
                    {kindLabel(reminder.kind)}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {[
                      describe(reminder),
                      status.dueDate && !status.isDue
                        ? t('health.reminders.next', {
                            date: formatDay(status.dueDate),
                          })
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                {!isReadOnly && (
                  <UIButton
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t('health.reminders.remove')}
                    title={t('health.reminders.remove')}
                    onClick={() =>
                      onChange(
                        reminders.filter((item) => item.id !== reminder.id),
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </UIButton>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {isAdding && (
        <div className="grid gap-3 rounded-lg border p-3 [&_label]:text-xs">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1">
              <Label>{t('health.reminders.kind')}</Label>
              <Select
                value={kind}
                onValueChange={(next) => {
                  if (!next) return
                  setKind(next as TReminderKind)
                  setDays(
                    next === 'period' ? '2' : next === 'fertile' ? '1' : '7',
                  )
                }}
              >
                <SelectTrigger aria-label={t('health.reminders.kind')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kinds.map((value) => (
                    <SelectItem
                      key={value}
                      value={value}
                    >
                      {kindLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="health-reminder-days">
                {t(
                  isAhead(kind)
                    ? 'health.reminders.daysBefore'
                    : 'health.reminders.everyDays',
                )}
              </Label>
              <Input
                id="health-reminder-days"
                type="number"
                inputMode="numeric"
                min={isAhead(kind) ? 0 : 1}
                max={365}
                value={days}
                onChange={(event) => setDays(event.target.value)}
              />
            </div>
            {!isAhead(kind) && (
              <div className="grid gap-1">
                <Label htmlFor="health-reminder-time">
                  {t('health.reminders.time')}
                </Label>
                <Input
                  id="health-reminder-time"
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                />
              </div>
            )}
          </div>
          {kind === 'fertile' && (
            <>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="health-reminder-shared"
                  checked={isShared}
                  onCheckedChange={(checked) => setIsShared(checked === true)}
                />
                <Label
                  htmlFor="health-reminder-shared"
                  className="text-sm leading-snug font-normal"
                >
                  {t('health.reminders.shareFertile')}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('health.period.disclaimer')}
              </p>
            </>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAdding(false)}
            >
              {t('form.cancel')}
            </Button>
            <Button onClick={handleAdd}>{t('health.reminders.save')}</Button>
          </div>
        </div>
      )}
    </section>
  )
}
