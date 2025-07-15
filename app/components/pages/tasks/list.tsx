import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { useGetTasks } from '~/lib/hooks/use-get-tasks'
import { cn } from '~/lib/utils/shadcn'

import { Card } from './card'
import { useTask } from './context'

export const List = () => {
  const { t } = useTranslation()
  const { handleCreateTask } = useTask()
  const { data: tasksData } = useGetTasks()
  const pinnedTasks = tasksData?.filter((task) => task.isPinned)
  const regularTasks = tasksData?.filter((task) => !task.isPinned)

  return (
    <main className="flex flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-8">
      <Button
        containerClassName="flex justify-center md:static md:transform-none fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
        className="w-full max-w-md"
        onClick={handleCreateTask}
      >
        {t('tasks.add')}
      </Button>
      <div className={cn('justify-left grid grid-cols-2')}>
        {pinnedTasks
          ?.sort(
            (a, b) =>
              (b.updatedAt?.seconds || b.createdAt?.seconds || 0) -
              (a.updatedAt?.seconds || a.createdAt?.seconds || 0),
          )
          ?.map((task) => (
            <Card
              task={task}
              key={task.id}
            />
          ))}
      </div>
      <div className={cn('grid grid-cols-2 justify-center pb-9 md:pb-0')}>
        {regularTasks
          ?.sort(
            (a, b) =>
              (b.updatedAt?.seconds || b.createdAt?.seconds || 0) -
              (a.updatedAt?.seconds || a.createdAt?.seconds || 0),
          )
          ?.map((task) => (
            <Card
              task={task}
              key={task.id}
            />
          ))}
      </div>
    </main>
  )
}
