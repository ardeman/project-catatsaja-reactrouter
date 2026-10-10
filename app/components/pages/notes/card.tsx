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
import { Markdown } from '~/components/base/markdown'
import { auth } from '~/lib/configs/firebase'
import { useUserData } from '~/lib/hooks/use-get-user'
import { getDateLabel } from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'

import { useNote } from './context'
import { TCardProperties } from './type'

export const Card = (properties: TCardProperties) => {
  const { note, className } = properties
  const { t, i18n } = useTranslation()
  const { handleDeleteNote, handlePinNote, handleShareNote, handleUnlinkNote } =
    useNote()
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
        'group/card relative mb-4 w-full overflow-hidden pb-9 focus-within:ring-2 focus-within:ring-ring sm:w-80 sm:pb-0',
      )}
    >
      <Action
        className="absolute right-1 bottom-1 left-1 z-20"
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
        <CardTitle className="text-xl">
          {/* Covers the whole card; the action buttons sit above it. */}
          <Link
            to={`/notes/${note.id}`}
            className="outline-hidden after:absolute after:inset-0 after:z-10"
          >
            {note.title || (
              <span className="sr-only">{t('notes.untitled')}</span>
            )}
          </Link>
        </CardTitle>
      </CardHeader>
      {note.content && (
        // Long notes fade out at the height limit (24rem): a mask on the
        // text, so the card's own surface shows, as on the other cards.
        <CardContent className="max-h-96 overflow-hidden [mask-image:linear-gradient(to_bottom,black_21rem,transparent_24rem)] sm:pb-8">
          <Markdown className="text-sm wrap-break-word whitespace-pre-wrap">
            {note.content}
          </Markdown>
        </CardContent>
      )}
    </UICard>
  )
}
