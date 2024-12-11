import {
  Card as UICard,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui'
import { useUserData } from '~/lib/hooks'
import { cn, formatDate, getDateLabel } from '~/lib/utils'

import { Action } from './action'
import { useNote } from './context'
import { TCardProps } from './type'

export const Card = (props: TCardProps) => {
  const { note } = props
  const { handleEditNote } = useNote()
  const { data: userData } = useUserData()
  const isPinned = note.isPinned
  const canWrite = note.permissions?.write?.includes(userData?.uid)
  const isOwner = note.owner === userData?.uid
  const isEditable = isOwner || canWrite
  const dateLabel = getDateLabel(note.updatedAt?.seconds)
  const date = formatDate(note.updatedAt?.seconds || note.createdAt.seconds)

  return (
    <UICard
      className={cn(
        isPinned ? 'masonry-item-pinned' : 'masonry-item-regular',
        'group/card relative mb-4 w-full sm:max-w-xs',
      )}
      onClick={() => isEditable && handleEditNote(note)}
    >
      <Action
        className="absolute bottom-1 left-1 right-1"
        note={note}
        isOwner={isOwner}
        isEditable={isEditable}
        isPinned={isPinned}
      />
      <CardHeader className="pb-4">
        <CardDescription className="flex justify-between text-xs">
          <span>
            {dateLabel} {date}
          </span>
          <span>{isEditable ? !isOwner && 'Shared' : 'Read-only'}</span>
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
