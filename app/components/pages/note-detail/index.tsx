import { useEffect } from 'react'
import { useParams } from 'react-router'

import { LoadingSpinner } from '~/components/base/loading-spinner'
import { Form, NoteProvider, useNote } from '~/components/pages/notes'
import { useGetNotes } from '~/lib/hooks/use-get-notes'

const NoteContent = () => {
  const { note } = useParams()
  const { data: notes } = useGetNotes()
  const { setSelectedNote } = useNote()

  const current = notes?.find((n) => n.id === note)

  useEffect(() => {
    if (current) setSelectedNote(current)
  }, [current, setSelectedNote])

  if (!notes) return <LoadingSpinner classname="min-h-fit flex-1" />

  return (
    <main className="flex flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-8">
      <Form notes={notes} />
    </main>
  )
}

export const NoteDetailPage = () => (
  <NoteProvider>
    <NoteContent />
  </NoteProvider>
)
