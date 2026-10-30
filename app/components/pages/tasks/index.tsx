import { useTranslation } from 'react-i18next'

import { useScreenGuide } from '~/components/base/screen-guide'
import { useDocumentTitle } from '~/lib/hooks/use-document-title'

import { TaskProvider } from './context'
import { List } from './list'
export { TaskProvider, useTask } from './context'

export const TaskPage = () => {
  const { t } = useTranslation()
  useDocumentTitle(t('navigation.tasks'))
  useScreenGuide('tasks')
  return (
    <TaskProvider>
      <List />
    </TaskProvider>
  )
}
