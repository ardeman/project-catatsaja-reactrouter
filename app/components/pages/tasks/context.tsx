import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useState,
} from 'react'
import { useNavigate } from 'react-router'

type TaskContextValue = {
  openConfirmation: boolean
  setOpenConfirmation: Dispatch<SetStateAction<boolean>>
  openShare: boolean
  setOpenShare: Dispatch<SetStateAction<boolean>>
  // selectedTask: TTaskResponse | undefined
  // setSelectedTask: Dispatch<SetStateAction<TTaskResponse | undefined>>
  // selectedConfirmation: TTaskConfirmation | undefined
  // setSelectedConfirmation: Dispatch<
  //   SetStateAction<TTaskConfirmation | undefined>
  // >
  handleConfirm: () => Promise<void>
  // handleDeleteTask: (properties: THandleModifyTask) => void
  // handleUnlinkTask: (properties: THandleModifyTask) => void
  // handlePinTask: (properties: THandlePinTask) => void
  // handleShareTask: (properties: THandleModifyTask) => void
  // handleOpenTask: (task: TTaskResponse) => void
  handleBackTask: () => void
  handleCreateTask: () => void
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined)

const TaskProvider = (properties: PropsWithChildren) => {
  const { children } = properties
  const [openConfirmation, setOpenConfirmation] = useState<boolean>(false)
  const [openShare, setOpenShare] = useState<boolean>(false)
  const navigate = useNavigate()

  const handleConfirm = async () => {}

  const handleCreateTask = () => {
    navigate('/tasks/create')
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
        handleConfirm,
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
