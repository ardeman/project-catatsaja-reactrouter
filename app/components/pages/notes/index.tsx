import { NoteProvider } from './context'
import { Wrapper } from './wrapper.client'
export { Form } from './form'
export { NoteProvider, useNote } from './context'

export const NotesPage = () => {
  return (
    <NoteProvider>
      <Wrapper />
    </NoteProvider>
  )
}
