import { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

import { LoadingScreen } from '~/components/base/loading-screen'
import { Modal } from '~/components/base/modal'
import { Share } from '~/components/base/share'
import { useTask } from '~/components/pages/tasks'
import { useAuthUser } from '~/lib/hooks/use-auth-user'
import { useGetTask } from '~/lib/hooks/use-get-task'
import { useLogout } from '~/lib/hooks/use-logout'
import { useShareTask } from '~/lib/hooks/use-share-task'
import { toast } from '~/lib/hooks/use-toast'
import {
  THandleDeletePermission,
  THandleSetPermission,
} from '~/lib/types/common'
import { TTaskPermissionRequest } from '~/lib/types/task'

import { Form } from './form'

export const Content = () => {
  const { task } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: taskData, isLoading: taskIsLoading } = useGetTask(
    task === 'create' ? undefined : task,
  )
  const { data: user, isLoading: userIsLoading } = useAuthUser()
  const { mutate: mutateLogout } = useLogout()
  const {
    setSelectedTask,
    openConfirmation,
    setOpenConfirmation,
    openShare,
    setOpenShare,
    selectedConfirmation,
    handleConfirm,
    selectedTask,
  } = useTask()
  const { mutate: mutateShare } = useShareTask()

  useEffect(() => {
    if (taskData) setSelectedTask(taskData)
  }, [taskData, setSelectedTask])

  useEffect(() => {
    if (taskIsLoading || task === 'create' || taskData) {
      return
    }

    if (!user && !userIsLoading) {
      mutateLogout()
      return
    }

    if (
      ['delete', 'unlink'].includes(selectedConfirmation?.kind || '') &&
      selectedConfirmation?.detail.id === task
    ) {
      navigate('/tasks', { replace: true })
      return
    }

    toast({
      variant: 'destructive',
      description: t('tasks.toast.notFound'),
    })
    navigate('/tasks/create', { replace: true })
  }, [
    taskData,
    taskIsLoading,
    task,
    navigate,
    t,
    user,
    userIsLoading,
    mutateLogout,
    selectedConfirmation,
  ])

  const handleShare = (parameters: THandleSetPermission) => {
    const data = {
      ...parameters,
      task: taskData,
    } as TTaskPermissionRequest
    mutateShare(data)
  }

  const handleUnshare = (parameters: Pick<THandleDeletePermission, 'uid'>) => {
    const data = {
      ...parameters,
      permission: 'delete',
      task: taskData,
    } as TTaskPermissionRequest
    mutateShare(data)
  }

  if (taskIsLoading)
    return (
      <LoadingScreen
        isLoading
        classname="min-h-fit flex-1"
      />
    )

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Form task={taskData} />
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
          write={taskData?.permissions?.write || []}
          read={taskData?.permissions?.read || []}
          handleShare={handleShare}
          handleUnshare={handleUnshare}
        />
      </Modal>
    </div>
  )
}
