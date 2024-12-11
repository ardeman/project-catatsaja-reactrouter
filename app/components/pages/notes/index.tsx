import { NoteProvider } from './context'
import { Wrapper } from './wrapper.client'

export const NotesPage = () => {
  return (
    <NoteProvider>
      <Wrapper />
    </NoteProvider>
  )
}
