import { Trans, useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { Modal } from '~/components/base/modal'
import { Share } from '~/components/base/share'
import { useGetTasks } from '~/lib/hooks/use-get-tasks'
import { useShareTask } from '~/lib/hooks/use-share-task'
import {
  THandleDeletePermission,
  THandleSetPermission,
} from '~/lib/types/common'
import { TTaskPermissionRequest } from '~/lib/types/task'
import { cn } from '~/lib/utils/shadcn'

import { Card } from './card'
import { useTask } from './context'

export const List = () => {
  const { t } = useTranslation()
  const {
    handleCreateTask,
    openConfirmation,
    setOpenConfirmation,
    handleConfirm,
    selectedConfirmation,
    openShare,
    setOpenShare,
    selectedTask,
  } = useTask()
  const { data: tasksData } = useGetTasks()
  const pinnedTasks = tasksData?.filter((task) => task.isPinned)
  const regularTasks = tasksData?.filter((task) => !task.isPinned)
  const { mutate: mutateShare } = useShareTask()

  const handleShare = (parameters: THandleSetPermission) => {
    const data = {
      ...parameters,
      task: tasksData?.find((task) => task.id === selectedTask?.id),
    } as TTaskPermissionRequest
    mutateShare(data)
  }

  const handleUnshare = (parameters: Pick<THandleDeletePermission, 'uid'>) => {
    const data = {
      ...parameters,
      permission: 'delete',
      task: tasksData?.find((note) => note.id === selectedTask?.id),
    } as TTaskPermissionRequest
    mutateShare(data)
  }

  return (
    <main className="flex flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-8">
      <Button
        containerClassName="flex justify-center md:static md:transform-none fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
        className="w-full max-w-md"
        onClick={handleCreateTask}
      >
        {t('tasks.add')}
      </Button>
      <div
        className={cn(
          'justify-left grid gap-x-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6',
        )}
      >
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
      <div
        className={cn(
          'justify-left grid gap-x-4 pb-9 sm:grid-cols-2 md:pb-0 lg:grid-cols-4 xl:grid-cols-6',
        )}
      >
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

      <Modal
        open={openConfirmation}
        setOpen={setOpenConfirmation}
        handleConfirm={handleConfirm}
        variant="destructive"
        title={
          <Trans
            i18nKey={`form.${selectedConfirmation?.kind}`}
            values={{ item: t('tasks.title') }}
            components={{ span: <span className="text-primary" /> }}
          />
        }
      >
        {selectedConfirmation?.detail.title && (
          <p className="text-xl">{selectedConfirmation.detail.title}</p>
        )}
      </Modal>

      <Modal
        open={openShare}
        setOpen={setOpenShare}
        title={
          <Trans
            i18nKey="form.share"
            values={{ item: t('tasks.title') }}
            components={{ span: <span className="text-primary" /> }}
          />
        }
      >
        <Share
          write={
            tasksData?.find((task) => task.id === selectedTask?.id)?.permissions
              ?.write || []
          }
          read={
            tasksData?.find((note) => note.id === selectedTask?.id)?.permissions
              ?.read || []
          }
          handleShare={handleShare}
          handleUnshare={handleUnshare}
        />
      </Modal>
    </main>
  )
}
