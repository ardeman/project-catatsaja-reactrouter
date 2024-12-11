import Masonry from 'masonry-layout'
import { useEffect, useRef } from 'react'

import { Button, Modal } from '~/components/base'
import { useGetNotes } from '~/lib/hooks'

import { Card } from './card'
import { useNote } from './context'
import { Form } from './form'
import { Share } from './share'

export const Wrapper = () => {
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
  } = useNote()
  const { data: notesData } = useGetNotes()
  const masonryRefPinned = useRef(null)
  const masonryRefRegular = useRef(null)

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
        Add Note
      </Button>
      <div className="flex justify-center">
        <div
          ref={masonryRefPinned}
          className="masonry-grid mx-auto max-w-screen-2xl" // Sets max width to control masonry width
        >
          {notesData
            ?.filter((note) => note.isPinned)
            ?.sort(
              (a, b) =>
                (b.updatedAt?.seconds || b.createdAt?.seconds) -
                (a.updatedAt?.seconds || a.createdAt?.seconds),
            )
            .map((note) => (
              <Card
                note={note}
                key={note.id}
              />
            ))}
        </div>
      </div>
      <div className="flex justify-center">
        <div
          ref={masonryRefRegular}
          className="masonry-grid mx-auto max-w-screen-2xl" // Sets max width to control masonry width
        >
          {notesData
            ?.filter((note) => !note.isPinned)
            ?.sort(
              (a, b) =>
                (b.updatedAt?.seconds || b.createdAt?.seconds) -
                (a.updatedAt?.seconds || a.createdAt?.seconds),
            )
            .map((note) => (
              <Card
                note={note}
                key={note.id}
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
      >
        <strong>{selectedConfirmation?.kind} this note?</strong>
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
      >
        <Share />
      </Modal>
    </main>
  )
}
