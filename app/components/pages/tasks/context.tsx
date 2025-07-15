import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useState,
} from 'react'
import { useLocation, useNavigate } from 'react-router'

import { useDeleteTask } from '~/lib/hooks/use-delete-task'
import { usePinTask } from '~/lib/hooks/use-pin-task'
import { useUnlinkTask } from '~/lib/hooks/use-unlink-task'
import { TTaskResponse } from '~/lib/types/task'

import { THandleModifyTask, THandlePinTask, TTaskConfirmation } from './type'

type TaskContextValue = {
  openConfirmation: boolean
  setOpenConfirmation: Dispatch<SetStateAction<boolean>>
  openShare: boolean
  setOpenShare: Dispatch<SetStateAction<boolean>>
  selectedTask: TTaskResponse | undefined
  setSelectedTask: Dispatch<SetStateAction<TTaskResponse | undefined>>
  selectedConfirmation: TTaskConfirmation | undefined
  setSelectedConfirmation: Dispatch<
    SetStateAction<TTaskConfirmation | undefined>
  >
  handleConfirm: () => Promise<void>
  handleDeleteTask: (properties: THandleModifyTask) => void
  handleUnlinkTask: (properties: THandleModifyTask) => void
  handlePinTask: (properties: THandlePinTask) => void
  handleShareTask: (properties: THandleModifyTask) => void
  handleOpenTask: (task: TTaskResponse) => void
  handleBackTask: () => void
  handleCreateTask: () => void
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined)

const TaskProvider = (properties: PropsWithChildren) => {
  const { children } = properties
  const [openConfirmation, setOpenConfirmation] = useState<boolean>(false)
  const [openShare, setOpenShare] = useState<boolean>(false)
  const [selectedTask, setSelectedTask] = useState<TTaskResponse>()
  const [selectedConfirmation, setSelectedConfirmation] =
    useState<TTaskConfirmation>()
  const { mutate: mutatePinTask } = usePinTask()
  const { mutate: mutateDeleteTask } = useDeleteTask()
  const { mutate: mutateUnlinkTask } = useUnlinkTask()
  const navigate = useNavigate()
  const location = useLocation()

  const handleConfirm = async () => {
    setOpenConfirmation(false)
    if (!selectedConfirmation?.detail || !selectedConfirmation.kind) return
    if (selectedConfirmation.kind === 'delete') {
      await mutateDeleteTask(selectedConfirmation.detail)
      if (
        location.pathname.startsWith('/tasks/') &&
        location.pathname !== '/tasks/create'
      ) {
        navigate('/tasks')
      }
    }
    if (selectedConfirmation.kind === 'unlink') {
      mutateUnlinkTask(selectedConfirmation.detail)
    }
  }

  const handleDeleteTask = (properties_: THandleModifyTask) => {
    const { task } = properties_
    setOpenConfirmation(true)
    setSelectedConfirmation({
      kind: 'delete',
      detail: task,
    })
  }

  const handleUnlinkTask = (properties_: THandleModifyTask) => {
    const { task } = properties_
    setOpenConfirmation(true)
    setSelectedConfirmation({
      kind: 'unlink',
      detail: task,
    })
  }

  const handlePinTask = (properties_: THandlePinTask) => {
    const { task, isPinned } = properties_
    mutatePinTask({ task, isPinned })
  }

  const handleShareTask = (properties_: THandleModifyTask) => {
    const { task } = properties_
    setOpenShare(true)
    setSelectedTask(task)
  }

  const handleCreateTask = () => {
    navigate('/tasks/create')
  }

  const handleOpenTask = (task: TTaskResponse) => {
    navigate(`/tasks/${task.id}`)
  }

  const handleBackTask = () => {
    navigate('/tasks')
  }

  return (
    <TaskContext.Provider
      value={{
        openConfirmation,
        setOpenConfirmation,
        openShare,
        setOpenShare,
        selectedTask,
        setSelectedTask,
        selectedConfirmation,
        setSelectedConfirmation,
        handleConfirm,
        handleDeleteTask,
        handleUnlinkTask,
        handlePinTask,
        handleShareTask,
        handleOpenTask,
        handleBackTask,
        handleCreateTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}

const useTask = () => {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider')
  }
  return context
}

export { TaskProvider, useTask }
