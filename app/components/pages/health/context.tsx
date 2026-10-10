import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useState,
} from 'react'
import { useNavigate, useLocation } from 'react-router'

import { useDeleteHealthLog } from '~/lib/hooks/use-delete-health-log'
import { usePinHealthLog } from '~/lib/hooks/use-pin-health-log'
import { useUnlinkHealthLog } from '~/lib/hooks/use-unlink-health-log'
import { THealthLogResponse } from '~/lib/types/health'

import {
  THandleModifyHealthLog,
  THandlePinHealthLog,
  THealthLogConfirmation,
} from './type'

type HealthLogContextValue = {
  openConfirmation: boolean
  setOpenConfirmation: Dispatch<SetStateAction<boolean>>
  openShare: boolean
  setOpenShare: Dispatch<SetStateAction<boolean>>
  selectedHealthLog: THealthLogResponse | undefined
  setSelectedHealthLog: Dispatch<SetStateAction<THealthLogResponse | undefined>>
  selectedConfirmation: THealthLogConfirmation | undefined
  setSelectedConfirmation: Dispatch<
    SetStateAction<THealthLogConfirmation | undefined>
  >
  handleConfirm: () => Promise<void>
  handleDeleteHealthLog: (properties: THandleModifyHealthLog) => void
  handleUnlinkHealthLog: (properties: THandleModifyHealthLog) => void
  handlePinHealthLog: (properties: THandlePinHealthLog) => void
  handleShareHealthLog: (properties: THandleModifyHealthLog) => void
  handleBackHealthLog: () => void
  handleCreateHealthLog: () => void
}

const HealthLogContext = createContext<HealthLogContextValue | undefined>(
  undefined,
)

const HealthLogProvider = (properties: PropsWithChildren) => {
  const { children } = properties
  const [openConfirmation, setOpenConfirmation] = useState<boolean>(false)
  const [openShare, setOpenShare] = useState<boolean>(false)
  const [selectedHealthLog, setSelectedHealthLog] =
    useState<THealthLogResponse>()
  const [selectedConfirmation, setSelectedConfirmation] =
    useState<THealthLogConfirmation>()
  const { mutate: mutatePinHealthLog } = usePinHealthLog()
  const { mutate: mutateDeleteHealthLog } = useDeleteHealthLog()
  const { mutate: mutateUnlinkHealthLog } = useUnlinkHealthLog()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleConfirm = async () => {
    setOpenConfirmation(false)
    if (!selectedConfirmation?.detail || !selectedConfirmation.kind) return
    if (selectedConfirmation.kind === 'delete') {
      await mutateDeleteHealthLog(selectedConfirmation.detail)
      if (pathname.startsWith('/health/') && pathname !== '/health/create') {
        navigate('/health', { replace: true })
      }
    }
    if (selectedConfirmation.kind === 'unlink') {
      mutateUnlinkHealthLog(selectedConfirmation.detail)
    }
  }

  const handleDeleteHealthLog = (properties_: THandleModifyHealthLog) => {
    const { healthLog } = properties_
    setOpenConfirmation(true)
    setSelectedConfirmation({
      kind: 'delete',
      detail: healthLog,
    })
  }

  const handleUnlinkHealthLog = (properties_: THandleModifyHealthLog) => {
    const { healthLog } = properties_
    setOpenConfirmation(true)
    setSelectedConfirmation({
      kind: 'unlink',
      detail: healthLog,
    })
  }

  const handlePinHealthLog = (properties_: THandlePinHealthLog) => {
    const { healthLog, isPinned } = properties_
    mutatePinHealthLog({ healthLog, isPinned })
  }

  const handleShareHealthLog = (properties_: THandleModifyHealthLog) => {
    const { healthLog } = properties_
    setOpenShare(true)
    setSelectedHealthLog(healthLog)
  }

  const handleCreateHealthLog = () => {
    navigate('/health/create')
  }

  const handleBackHealthLog = () => {
    navigate('/health')
  }

  return (
    <HealthLogContext.Provider
      value={{
        openConfirmation,
        setOpenConfirmation,
        openShare,
        setOpenShare,
        selectedHealthLog,
        setSelectedHealthLog,
        selectedConfirmation,
        setSelectedConfirmation,
        handleConfirm,
        handleDeleteHealthLog,
        handleUnlinkHealthLog,
        handlePinHealthLog,
        handleShareHealthLog,
        handleBackHealthLog,
        handleCreateHealthLog,
      }}
    >
      {children}
    </HealthLogContext.Provider>
  )
}

const useHealthLog = () => {
  const context = useContext(HealthLogContext)
  if (context === undefined) {
    throw new Error('useHealthLog must be used within a HealthLogProvider')
  }
  return context
}

export { HealthLogProvider, useHealthLog }
