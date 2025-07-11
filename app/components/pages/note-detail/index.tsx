import { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useParams } from 'react-router'

import { LoadingSpinner } from '~/components/base/loading-spinner'
import { Modal } from '~/components/base/modal'
import { Share } from '~/components/base/share'
import { Form, NoteProvider, useNote } from '~/components/pages/notes'
import { useGetNotes } from '~/lib/hooks/use-get-notes'
import { useShareNote } from '~/lib/hooks/use-share-note'
import {
  THandleDeletePermission,
  THandleSetPermission,
} from '~/lib/types/common'
import { TNotePermissionRequest } from '~/lib/types/note'

const NoteContent = () => {
  const { note } = useParams()
  const { t } = useTranslation()
  const { data: notes } = useGetNotes()
  const {
    setSelectedNote,
    openConfirmation,
    setOpenConfirmation,
    openShare,
    setOpenShare,
    selectedConfirmation,
    handleConfirm,
    selectedNote,
  } = useNote()
  const { mutate: mutateShare } = useShareNote()

  const current = notes?.find((n) => n.id === note)

  useEffect(() => {
    if (current) setSelectedNote(current)
  }, [current, setSelectedNote])

  const handleShare = (parameters: THandleSetPermission) => {
    const data = {
      ...parameters,
      note: notes?.find((n) => n.id === selectedNote?.id),
    } as TNotePermissionRequest
    mutateShare(data)
  }

  const handleUnshare = (parameters: Pick<THandleDeletePermission, 'uid'>) => {
    const data = {
      ...parameters,
      permission: 'delete',
      note: notes?.find((n) => n.id === selectedNote?.id),
    } as TNotePermissionRequest
    mutateShare(data)
  }

  if (!notes) return <LoadingSpinner classname="min-h-fit flex-1" />

  return (
    <main className="flex flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-8">
      <Form notes={notes} />
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
            notes?.find((n) => n.id === selectedNote?.id)?.permissions?.write ||
            []
          }
          read={
            notes?.find((n) => n.id === selectedNote?.id)?.permissions?.read ||
            []
          }
          handleShare={handleShare}
          handleUnshare={handleUnshare}
        />
      </Modal>
    </main>
  )
}

export const NoteDetailPage = () => (
  <NoteProvider>
    <NoteContent />
  </NoteProvider>
)
