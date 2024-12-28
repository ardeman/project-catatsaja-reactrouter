import Masonry from 'masonry-layout'
import { useEffect, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Button, Modal, Share } from '~/components/base'
import { useGetNotes, useShareNote } from '~/lib/hooks'
import {
  THandleDeletePermission,
  THandleSetPermission,
  TNotePermissionRequest,
} from '~/lib/types'

import { Card } from './card'
import { useNote } from './context'
import { Form } from './form'

export const Wrapper = () => {
  const { t } = useTranslation()
  const {
    openForm,
    setOpenForm,
    openConfirmation,
    setOpenConfirmation,
    openShare,
    setOpenShare,
    selectedConfirmation,
    handleFormClose,
    handleCreateNote,
    handleConfirm,
    formRef,
    selectedNote,
  } = useNote()
  const { data: notesData } = useGetNotes()
  const masonryRefPinned = useRef(null)
  const masonryRefRegular = useRef(null)
  const pinnedNotes = notesData?.filter((note) => note.isPinned)
  const regularNotes = notesData?.filter((note) => !note.isPinned)
  const { mutate: mutateShare } = useShareNote()

  const handleShare = (params: THandleSetPermission) => {
    const data = {
      ...params,
      note: notesData?.find((note) => note.id === selectedNote?.id),
    } as TNotePermissionRequest
    mutateShare(data)
  }

  const handleUnshare = (params: Pick<THandleDeletePermission, 'uid'>) => {
    const data = {
      ...params,
      permission: 'delete',
      note: notesData?.find((note) => note.id === selectedNote?.id),
    } as TNotePermissionRequest
    mutateShare(data)
  }

  useEffect(() => {
    if (masonryRefPinned?.current) {
      new Masonry(masonryRefPinned.current, {
        itemSelector: '.masonry-item-pinned',
        gutter: 16,
        horizontalOrder: true,
        fitWidth: true,
      })
    }
    if (masonryRefRegular?.current) {
      new Masonry(masonryRefRegular.current, {
        itemSelector: '.masonry-item-regular',
        gutter: 16,
        horizontalOrder: true,
        fitWidth: true,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notesData])

  return (
    <main className="flex flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-8">
      <Button
        containerClassName="flex justify-center md:static md:transform-none fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
        className="w-full max-w-md"
        onClick={handleCreateNote}
      >
        {t('notes.add')}
      </Button>
      <div className="flex justify-center">
        <div
          ref={masonryRefPinned}
          className="masonry-grid mx-auto max-w-screen-2xl"
        >
          {pinnedNotes
            ?.sort(
              (a, b) =>
                (b.updatedAt?.seconds || b.createdAt?.seconds) -
                (a.updatedAt?.seconds || a.createdAt?.seconds),
            )
            .map((note) => (
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
          ref={masonryRefRegular}
          className="masonry-grid mx-auto max-w-screen-2xl"
        >
          {regularNotes
            ?.sort(
              (a, b) =>
                (b.updatedAt?.seconds || b.createdAt?.seconds) -
                (a.updatedAt?.seconds || a.createdAt?.seconds),
            )
            .map((note) => (
              <Card
                note={note}
                key={note.id}
                className="masonry-item-regular"
              />
            ))}
        </div>
      </div>

      <Modal
        open={openForm}
        setOpen={setOpenForm}
        onClose={handleFormClose}
      >
        <Form
          ref={formRef}
          notes={notesData}
        />
      </Modal>

      <Modal
        open={openConfirmation}
        setOpen={setOpenConfirmation}
        handleConfirm={handleConfirm}
        variant="destructive"
        title={
          <Trans
            i18nKey={`form.${selectedConfirmation?.kind}`}
            values={{ item: t('navigation.notes') }}
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
            values={{ item: t('navigation.notes') }}
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
    </main>
  )
}
