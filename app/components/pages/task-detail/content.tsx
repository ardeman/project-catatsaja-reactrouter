import { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'

import { LoadingScreen } from '~/components/base/loading-screen'
import { Modal } from '~/components/base/modal'
import { Share } from '~/components/base/share'
import { useTask } from '~/components/pages/tasks'
import { useAuthUser } from '~/lib/hooks/use-auth-user'
import { useGetTasks } from '~/lib/hooks/use-get-tasks'
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
  const { data: tasks } = useGetTasks()
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

  const current = tasks?.find((n) => n.id === task)

  useEffect(() => {
    if (current) setSelectedTask(current)
  }, [current, setSelectedTask])

  useEffect(() => {
    if (tasks && task !== 'create' && !current) {
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
    }
  }, [
    tasks,
    task,
    current,
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
      task: tasks?.find((n) => n.id === selectedTask?.id),
    } as TTaskPermissionRequest
    mutateShare(data)
  }

  const handleUnshare = (parameters: Pick<THandleDeletePermission, 'uid'>) => {
    const data = {
      ...parameters,
      permission: 'delete',
      task: tasks?.find((n) => n.id === selectedTask?.id),
    } as TTaskPermissionRequest
    mutateShare(data)
  }

  if (!tasks)
    return (
      <LoadingScreen
        isLoading
        classname="min-h-fit flex-1"
      />
    )

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Form tasks={tasks} />
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
            tasks?.find((n) => n.id === selectedTask?.id)?.permissions?.write ||
            []
          }
          read={
            tasks?.find((n) => n.id === selectedTask?.id)?.permissions?.read ||
            []
          }
          handleShare={handleShare}
          handleUnshare={handleUnshare}
        />
      </Modal>
    </div>
  )
}
