import { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

import { LoadingScreen } from '~/components/base/loading-screen'
import { Modal } from '~/components/base/modal'
import { Share } from '~/components/base/share'
import { useNote } from '~/components/pages/notes'
import { useGetNotes } from '~/lib/hooks/use-get-notes'
import { useShareNote } from '~/lib/hooks/use-share-note'
import { toast } from '~/lib/hooks/use-toast'
import {
  THandleDeletePermission,
  THandleSetPermission,
} from '~/lib/types/common'
import { TNotePermissionRequest } from '~/lib/types/note'

import { Form } from './form'

export const Content = () => {
  const { note } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
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

  useEffect(() => {
    if (notes && note !== 'create' && !current) {
      toast({
        variant: 'destructive',
        description: t('notes.toast.notFound'),
      })
      navigate('/notes/create', { replace: true })
    }
  }, [notes, note, current, navigate, t])

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

  if (!notes)
    return (
      <LoadingScreen
        isLoading
        classname="min-h-fit flex-1"
      />
    )

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
