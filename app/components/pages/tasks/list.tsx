import { ListTodo } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'

import { Collection } from '~/components/base/collection'
import { Modal } from '~/components/base/modal'
import { Share } from '~/components/base/share'
import { useGetTasks } from '~/lib/hooks/use-get-tasks'
import { useShareTask } from '~/lib/hooks/use-share-task'
import {
  THandleDeletePermission,
  THandleSetPermission,
} from '~/lib/types/common'
import { TTaskPermissionRequest } from '~/lib/types/task'

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
  const { data: tasksData, isLoading } = useGetTasks()
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
    <>
      <Collection
        items={tasksData}
        isLoading={isLoading}
        layout="masonry"
        icon={ListTodo}
        emptyTitle={t('tasks.empty.title')}
        emptyDescription={t('tasks.empty.description')}
        createLabel={t('tasks.add')}
        onCreate={handleCreateTask}
        getSearchText={(task) =>
          [task.title, ...(task.content || []).map((item) => item.item)].join(
            ' ',
          )
        }
        renderCard={(task, className) => (
          <Card
            task={task}
            key={task.id}
            className={className}
          />
        )}
      />
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
          path={`/tasks/${selectedTask?.id}`}
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
    </>
  )
}
