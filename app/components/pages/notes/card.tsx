import { useTranslation } from 'react-i18next'

import { Action } from '~/components/base/action'
import { Markdown } from '~/components/base/markdown'
import {
  Card as UICard,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { auth } from '~/lib/configs/firebase'
import { useUserData } from '~/lib/hooks/use-get-user'
import { getDateLabel } from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'

import { useNote } from './context'
import { TCardProperties } from './type'

export const Card = (properties: TCardProperties) => {
  const { note, className } = properties
  const { t, i18n } = useTranslation()
  const {
    handleDeleteNote,
    handlePinNote,
    handleShareNote,
    handleUnlinkNote,
    handleOpenNote,
  } = useNote()
  const { data: userData } = useUserData()
  const isPinned = note.isPinned
  const canWrite = note.permissions?.write?.includes(userData?.uid || '')
  const isOwner = note.owner === userData?.uid
  const isEditable = isOwner || canWrite
  const dateLabel = getDateLabel({
    updatedAt: note.updatedAt?.seconds,
    createdAt: note.createdAt.seconds,
    t,
    locale: i18n.language,
  })
  const sharedCount = new Set(
    [
      ...(note.permissions?.read || []),
      ...(note.permissions?.write || []),
    ].filter((uid) => uid !== auth?.currentUser?.uid),
  ).size

  return (
    <UICard
      className={cn(
        className,
        'group/card relative mb-4 w-full overflow-hidden sm:max-w-xs',
      )}
      onClick={() => handleOpenNote(note)}
    >
      <Action
        className="absolute bottom-1 left-1 right-1 z-20"
        isOwner={isOwner}
        isEditable={isEditable}
        isPinned={isPinned}
        handleDelete={() => handleDeleteNote({ note })}
        handlePin={() => handlePinNote({ note, isPinned: !isPinned })}
        handleShare={() => handleShareNote({ note })}
        handleUnlink={() => handleUnlinkNote({ note })}
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
        {note.title && <CardTitle className="text-xl">{note.title}</CardTitle>}
      </CardHeader>
      {note.content && (
        <CardContent className="max-h-96 overflow-hidden">
          <Markdown className="whitespace-pre-wrap break-words text-sm">
            {note.content}
          </Markdown>
          <div className="pointer-events-none absolute bottom-0 left-0 z-10 h-12 w-full bg-gradient-to-b from-transparent to-background" />
        </CardContent>
      )}
    </UICard>
  )
}
