import { NoteProvider } from './context'
import { List } from './list.client'
export { NoteProvider, useNote } from './context'

export const NotesPage = () => {
  return (
    <NoteProvider>
      <List />
    </NoteProvider>
  )
}
