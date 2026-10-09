import { Circle, CircleCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Action } from '~/components/base/action'
import {
  Card as UICard,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from '~/components/ui/card'
import { auth } from '~/lib/configs/firebase'
import { useUserData } from '~/lib/hooks/use-get-user'
import { getDateLabel } from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'

import { useTask } from './context'
import { TCardProperties } from './type'

export const Card = (properties: TCardProperties) => {
  const { task, className } = properties
  const { t, i18n } = useTranslation()
  const { handleDeleteTask, handlePinTask, handleShareTask, handleUnlinkTask } =
    useTask()
  const { data: userData } = useUserData()
  const isPinned = task.isPinned
  const canWrite = task.permissions?.write?.includes(userData?.uid || '')
  const isOwner = task.owner === userData?.uid
  const isEditable = isOwner || canWrite
  const dateLabel = getDateLabel({
    updatedAt: task.updatedAt?.seconds,
    createdAt: task.createdAt.seconds,
    t,
    locale: i18n.language,
  })
  const preview = [
    ...(task.content || []).filter((item) => !item.checked),
    ...(task.content || []).filter((item) => item.checked),
  ].slice(0, 3)
  const sharedCount = new Set(
    [
      ...(task.permissions?.read || []),
      ...(task.permissions?.write || []),
    ].filter((uid) => uid !== auth?.currentUser?.uid),
  ).size

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
        handleDelete={() => handleDeleteTask({ task })}
        handlePin={() => handlePinTask({ task, isPinned: !isPinned })}
        handleShare={() => handleShareTask({ task })}
        handleUnlink={() => handleUnlinkTask({ task })}
        sharedCount={sharedCount}
      />
      <CardHeader className="pb-4">
        <CardDescription className="flex justify-between text-xs">
          <span>{dateLabel}</span>
          <span>
            {isEditable
              ? !isOwner && t('form.permissions.shared')
              : t('form.permissions.readOnly')}
          </span>
        </CardDescription>
        <CardTitle className="text-xl">
          {/* Covers the whole card; the action buttons sit above it. */}
          <Link
            to={`/tasks/${task.id}`}
            className="outline-hidden after:absolute after:inset-0 after:z-10"
          >
            {task.title || (
              <span className="sr-only">{t('tasks.untitled')}</span>
            )}
          </Link>
        </CardTitle>
      </CardHeader>
      {task.content && task.content.length > 0 && (
        <CardContent className="flex flex-col gap-1 sm:pb-8">
          {preview.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-sm"
            >
              {item.checked ? (
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <span
                className={cn(
                  'line-clamp-2 wrap-break-word',
                  item.checked && 'text-muted-foreground line-through',
                )}
              >
                {item.item}
              </span>
            </div>
          ))}
          {task.content.length > preview.length && (
            <div className="ml-6 text-xs text-muted-foreground">
              {t('tasks.more', {
                number: task.content.length - preview.length,
              })}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {t('tasks.progress', {
              done: task.content.filter((item) => item.checked).length,
              total: task.content.length,
            })}
          </div>
        </CardContent>
      )}
    </UICard>
  )
}
