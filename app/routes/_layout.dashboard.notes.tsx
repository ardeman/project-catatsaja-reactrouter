import { type ClientLoaderFunctionArgs } from 'react-router'

import { fetchNotes } from '~/apis/firestore/note'
import { NotesPage } from '~/components/pages/notes'

export const clientLoader = async (_: ClientLoaderFunctionArgs) => {
  const notes = await fetchNotes()
  return { notes }
}

const Notes = () => <NotesPage />

export default Notes
