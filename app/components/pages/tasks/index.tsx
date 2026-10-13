import { useTranslation } from 'react-i18next'

import { useDocumentTitle } from '~/lib/hooks/use-document-title'

import { TaskProvider } from './context'
import { List } from './list'
export { TaskProvider, useTask } from './context'

export const TaskPage = () => {
  const { t } = useTranslation()
  useDocumentTitle(t('navigation.tasks'))
  return (
    <TaskProvider>
      <List />
    </TaskProvider>
  )
}
