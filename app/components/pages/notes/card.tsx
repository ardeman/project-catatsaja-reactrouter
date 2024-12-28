import { useTranslation } from 'react-i18next'

import { Action } from '~/components/base'
import {
  Card as UICard,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui'
import { useUserData } from '~/lib/hooks'
import { cn, getDateLabel } from '~/lib/utils'

import { useNote } from './context'
import { TCardProps } from './type'

export const Card = (props: TCardProps) => {
  const { note, className } = props
  const { t, i18n } = useTranslation()
  const {
    handleEditNote,
    handleDeleteNote,
    handlePinNote,
    handleShareNote,
    handleUnlinkNote,
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

  return (
    <UICard
      className={cn(className, 'group/card relative mb-4 w-full sm:max-w-xs')}
      onClick={() => isEditable && handleEditNote(note)}
    >
      <Action
        className="absolute bottom-1 left-1 right-1"
        isOwner={isOwner}
        isEditable={isEditable}
        isPinned={isPinned}
        handleDelete={() => handleDeleteNote({ note })}
        handlePin={() => handlePinNote({ note, isPinned: !isPinned })}
        handleShare={() => handleShareNote({ note })}
        handleUnlink={() => handleUnlinkNote({ note })}
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
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{note.content}</p>
        </CardContent>
      )}
    </UICard>
  )
}
