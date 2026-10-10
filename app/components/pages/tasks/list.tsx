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
  const sharedTask = tasksData?.find((item) => item.id === selectedTask?.id)

  const handleShare = (parameters: THandleSetPermission) => {
    if (!sharedTask) return
    mutateShare({ ...parameters, task: sharedTask })
  }

  const handleUnshare = (parameters: Pick<THandleDeletePermission, 'uid'>) => {
    if (!sharedTask) return
    mutateShare({ ...parameters, permission: 'delete', task: sharedTask })
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
          write={sharedTask?.permissions?.write || []}
          read={sharedTask?.permissions?.read || []}
          handleShare={handleShare}
          handleUnshare={handleUnshare}
        />
      </Modal>
    </>
  )
}
