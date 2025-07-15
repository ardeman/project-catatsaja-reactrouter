import { useTranslation } from 'react-i18next'

import { Action } from '~/components/base/action'
import {
  Card as UICard,
  CardDescription,
  CardHeader,
  CardTitle,
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
  const {
    handleDeleteTask,
    handlePinTask,
    handleShareTask,
    handleUnlinkTask,
    handleOpenTask,
  } = useTask()
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
  const sharedCount = new Set(
    [
      ...(task.permissions?.read || []),
      ...(task.permissions?.write || []),
    ].filter((uid) => uid !== auth?.currentUser?.uid),
  ).size

  return (
    <UICard
      className={cn(className, 'group/card relative mb-4 w-full sm:max-w-xs')}
      onClick={() => handleOpenTask(task)}
    >
      <Action
        className="absolute bottom-1 left-1 right-1"
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
        {task.title && <CardTitle className="text-xl">{task.title}</CardTitle>}
      </CardHeader>
    </UICard>
  )
}
