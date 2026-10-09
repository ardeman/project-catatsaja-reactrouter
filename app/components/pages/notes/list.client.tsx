import { StickyNote } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'

import { Collection } from '~/components/base/collection'
import { Modal } from '~/components/base/modal'
import { Share } from '~/components/base/share'
import { useGetNotes } from '~/lib/hooks/use-get-notes'
import { useShareNote } from '~/lib/hooks/use-share-note'
import {
  THandleDeletePermission,
  THandleSetPermission,
} from '~/lib/types/common'
import { TNotePermissionRequest } from '~/lib/types/note'
import { toPlainText } from '~/lib/utils/parser'

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
  const { data: notesData, isLoading } = useGetNotes()
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

  return (
    <>
      <Collection
        items={notesData}
        isLoading={isLoading}
        layout="masonry"
        icon={StickyNote}
        emptyTitle={t('notes.empty.title')}
        emptyDescription={t('notes.empty.description')}
        createLabel={t('notes.add')}
        onCreate={handleCreateNote}
        getSearchText={(note) => `${note.title} ${toPlainText(note.content)}`}
        renderCard={(note, className) => (
          <Card
            note={note}
            key={note.id}
            className={className}
          />
        )}
      />
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
          <p className="line-clamp-3 text-muted-foreground">
            {toPlainText(selectedConfirmation.detail.content)}
          </p>
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
    </>
  )
}
