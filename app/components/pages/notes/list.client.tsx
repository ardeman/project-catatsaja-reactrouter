import Masonry from 'masonry-layout'
import { useEffect, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { Modal } from '~/components/base/modal'
import { Share } from '~/components/base/share'
import { useGetNotes } from '~/lib/hooks/use-get-notes'
import { useShareNote } from '~/lib/hooks/use-share-note'
import {
  THandleDeletePermission,
  THandleSetPermission,
} from '~/lib/types/common'
import { TNotePermissionRequest } from '~/lib/types/note'

import { Card } from './card'
import { useNote } from './context'

export const List = () => {
  const { t } = useTranslation()
  const {
    openConfirmation,
    setOpenConfirmation,
    openShare,
    setOpenShare,
    selectedConfirmation,
    handleConfirm,
    selectedNote,
    handleCreateNote,
  } = useNote()
  const { data: notesData } = useGetNotes()
  const masonryReferencePinned = useRef(null)
  const masonryReferenceRegular = useRef(null)
  const pinnedNotes = notesData?.filter((note) => note.isPinned)
  const regularNotes = notesData?.filter((note) => !note.isPinned)
  const { mutate: mutateShare } = useShareNote()

  const handleShare = (parameters: THandleSetPermission) => {
    const data = {
      ...parameters,
      note: notesData?.find((note) => note.id === selectedNote?.id),
    } as TNotePermissionRequest
    mutateShare(data)
  }

  const handleUnshare = (parameters: Pick<THandleDeletePermission, 'uid'>) => {
    const data = {
      ...parameters,
      permission: 'delete',
      note: notesData?.find((note) => note.id === selectedNote?.id),
    } as TNotePermissionRequest
    mutateShare(data)
  }

  useEffect(() => {
    if (masonryReferencePinned?.current) {
      const pinned = new Masonry(masonryReferencePinned.current, {
        itemSelector: '.masonry-item-pinned',
        gutter: 16,
        horizontalOrder: true,
        fitWidth: true,
      })
      if (pinned.layout) {
        pinned.layout()
      }
    }
    if (masonryReferenceRegular?.current) {
      const regular = new Masonry(masonryReferenceRegular.current, {
        itemSelector: '.masonry-item-regular',
        gutter: 16,
        horizontalOrder: true,
        fitWidth: true,
      })
      if (regular.layout) {
        regular.layout()
      }
    }
  }, [notesData])

  return (
    <div className="flex flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-8">
      <Button
        containerClassName="flex fixed bottom-4 md:top-16 z-50 sm:max-w-xs mx-auto left-0 right-0 w-full p-4 md:py-8 h-fit"
        className="w-full backdrop-blur supports-[backdrop-filter]:bg-primary/70 supports-[backdrop-filter]:hover:bg-primary"
        onClick={handleCreateNote}
      >
        {t('notes.add')}
      </Button>
      <div className="flex justify-center md:mt-16">
        <div
          ref={masonryReferencePinned}
          className="masonry-grid mx-auto max-w-screen-2xl"
        >
          {pinnedNotes
            ?.sort(
              (a, b) =>
                (b.updatedAt?.seconds || b.createdAt?.seconds || 0) -
                (a.updatedAt?.seconds || a.createdAt?.seconds || 0),
            )
            ?.map((note) => (
              <Card
                note={note}
                key={note.id}
                className="masonry-item-pinned"
              />
            ))}
        </div>
      </div>
      <div className="flex justify-center pb-9 md:pb-0">
        <div
          ref={masonryReferenceRegular}
          className="masonry-grid mx-auto max-w-screen-2xl"
        >
          {regularNotes
            ?.sort(
              (a, b) =>
                (b.updatedAt?.seconds || b.createdAt?.seconds || 0) -
                (a.updatedAt?.seconds || a.createdAt?.seconds || 0),
            )
            ?.map((note) => (
              <Card
                note={note}
                key={note.id}
                className="masonry-item-regular"
              />
            ))}
        </div>
      </div>

      <Modal
        open={openConfirmation}
        setOpen={setOpenConfirmation}
        handleConfirm={handleConfirm}
        variant="destructive"
        title={
          <Trans
            i18nKey={`form.${selectedConfirmation?.kind}`}
            values={{ item: t('notes.title') }}
            components={{ span: <span className="text-primary" /> }}
          />
        }
      >
        {selectedConfirmation?.detail.title && (
          <p className="text-xl">{selectedConfirmation.detail.title}</p>
        )}
        {selectedConfirmation?.detail.content && (
          <p>{selectedConfirmation.detail.content}</p>
        )}
      </Modal>

      <Modal
        open={openShare}
        setOpen={setOpenShare}
        title={
          <Trans
            i18nKey="form.share"
            values={{ item: t('notes.title') }}
            components={{ span: <span className="text-primary" /> }}
          />
        }
      >
        <Share
          write={
            notesData?.find((note) => note.id === selectedNote?.id)?.permissions
              ?.write || []
          }
          read={
            notesData?.find((note) => note.id === selectedNote?.id)?.permissions
              ?.read || []
          }
          handleShare={handleShare}
          handleUnshare={handleUnshare}
        />
      </Modal>
    </div>
  )
}
