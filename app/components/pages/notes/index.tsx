import { NoteProvider } from './context'
import { Wrapper } from './wrapper'

export const NotesPage = () => {
  return (
    <NoteProvider>
      <Wrapper />
    </NoteProvider>
  )
}
