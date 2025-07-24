import { useEffect, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

import { LoadingScreen } from '~/components/base/loading-screen'
import { Modal } from '~/components/base/modal'
import { Share } from '~/components/base/share'
import { useNote } from '~/components/pages/notes'
import { useAuthUser } from '~/lib/hooks/use-auth-user'
import { useGetNote } from '~/lib/hooks/use-get-note'
import { useLogout } from '~/lib/hooks/use-logout'
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
  const { data: noteData, isLoading: noteIsLoading } = useGetNote(
    note === 'create' ? undefined : note,
  )
  const { data: user, isLoading: userIsLoading } = useAuthUser()
  const { mutate: mutateLogout } = useLogout()
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

  useEffect(() => {
    if (noteData) setSelectedNote(noteData)
  }, [noteData, setSelectedNote])

  const previousLoading = useRef(noteIsLoading)

  useEffect(() => {
    const hasFinishedLoading = previousLoading.current && !noteIsLoading
    previousLoading.current = noteIsLoading
    if (!hasFinishedLoading) return

    if (note === 'create' || noteData) {
      return
    }

    if (!user && !userIsLoading) {
      mutateLogout()
      return
    }

    if (
      ['delete', 'unlink'].includes(selectedConfirmation?.kind || '') &&
      selectedConfirmation?.detail.id === note
    ) {
      navigate('/notes', { replace: true })
      return
    }

    toast({
      variant: 'destructive',
      description: t('notes.toast.notFound'),
    })
    navigate('/notes/create', { replace: true })
  }, [
    noteData,
    noteIsLoading,
    note,
    navigate,
    t,
    user,
    userIsLoading,
    mutateLogout,
    selectedConfirmation,
  ])

  const handleShare = (parameters: THandleSetPermission) => {
    const data = {
      ...parameters,
      note: noteData,
    } as TNotePermissionRequest
    mutateShare(data)
  }

  const handleUnshare = (parameters: Pick<THandleDeletePermission, 'uid'>) => {
    const data = {
      ...parameters,
      permission: 'delete',
      note: noteData,
    } as TNotePermissionRequest
    mutateShare(data)
  }

  if (noteIsLoading)
    return (
      <LoadingScreen
        isLoading
        classname="min-h-fit flex-1"
      />
    )

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Form note={noteData} />
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
          path={`/notes/${selectedNote?.id}`}
          write={noteData?.permissions?.write || []}
          read={noteData?.permissions?.read || []}
          handleShare={handleShare}
          handleUnshare={handleUnshare}
        />
      </Modal>
    </div>
  )
}
