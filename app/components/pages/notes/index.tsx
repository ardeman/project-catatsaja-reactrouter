import { useTranslation } from 'react-i18next'

import { useScreenGuide } from '~/components/base/screen-guide'
import { useDocumentTitle } from '~/lib/hooks/use-document-title'

import { NoteProvider } from './context'
import { List } from './list.client'
export { NoteProvider, useNote } from './context'

export const NotesPage = () => {
  const { t } = useTranslation()
  useDocumentTitle(t('navigation.notes'))
  useScreenGuide('notes')
  return (
    <NoteProvider>
      <List />
    </NoteProvider>
  )
}
