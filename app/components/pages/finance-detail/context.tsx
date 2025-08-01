import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useState,
} from 'react'
import { useLocation, useNavigate } from 'react-router'

import { useDeleteFinance } from '~/lib/hooks/use-delete-finance'
import { usePinFinance } from '~/lib/hooks/use-pin-finance'
import { useUnlinkFinance } from '~/lib/hooks/use-unlink-finance'
import { TFinanceResponse } from '~/lib/types/finance'

import {
  THandleModifyFinance,
  THandlePinFinance,
  TFinanceConfirmation,
} from './type'

type FinanceContextValue = {
  openConfirmation: boolean
  setOpenConfirmation: Dispatch<SetStateAction<boolean>>
  openShare: boolean
  setOpenShare: Dispatch<SetStateAction<boolean>>
  selectedFinance: TFinanceResponse | undefined
  setSelectedFinance: Dispatch<SetStateAction<TFinanceResponse | undefined>>
  selectedConfirmation: TFinanceConfirmation | undefined
  setSelectedConfirmation: Dispatch<
    SetStateAction<TFinanceConfirmation | undefined>
  >
  handleConfirm: () => Promise<void>
  handleDeleteFinance: (properties: THandleModifyFinance) => void
  handleUnlinkFinance: (properties: THandleModifyFinance) => void
  handlePinFinance: (properties: THandlePinFinance) => void
  handleShareFinance: (properties: THandleModifyFinance) => void
  handleOpenFinance: (finance: TFinanceResponse) => void
  handleBackFinance: () => void
  handleCreateFinance: () => void
}

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined)

const FinanceProvider = (properties: PropsWithChildren) => {
  const { children } = properties
  const [openConfirmation, setOpenConfirmation] = useState<boolean>(false)
  const [openShare, setOpenShare] = useState<boolean>(false)
  const [selectedFinance, setSelectedFinance] = useState<TFinanceResponse>()
  const [selectedConfirmation, setSelectedConfirmation] =
    useState<TFinanceConfirmation>()
  const { mutate: mutatePinFinance } = usePinFinance()
  const { mutate: mutateDeleteFinance } = useDeleteFinance()
  const { mutate: mutateUnlinkFinance } = useUnlinkFinance()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleConfirm = async () => {
    setOpenConfirmation(false)
    if (!selectedConfirmation?.detail || !selectedConfirmation.kind) return
    if (selectedConfirmation.kind === 'delete') {
      await mutateDeleteFinance(selectedConfirmation.detail)
      if (
        pathname.startsWith('/finances/') &&
        pathname !== '/finances/create'
      ) {
        navigate('/finances', { replace: true })
      }
    }
    if (selectedConfirmation.kind === 'unlink') {
      mutateUnlinkFinance(selectedConfirmation.detail)
    }
  }

  const handleDeleteFinance = (properties_: THandleModifyFinance) => {
    const { finance } = properties_
    setOpenConfirmation(true)
    setSelectedConfirmation({
      kind: 'delete',
      detail: finance,
    })
  }

  const handleUnlinkFinance = (properties_: THandleModifyFinance) => {
    const { finance } = properties_
    setOpenConfirmation(true)
    setSelectedConfirmation({
      kind: 'unlink',
      detail: finance,
    })
  }

  const handlePinFinance = (properties_: THandlePinFinance) => {
    const { finance, isPinned } = properties_
    mutatePinFinance({ finance, isPinned })
  }

  const handleShareFinance = (properties_: THandleModifyFinance) => {
    const { finance } = properties_
    setOpenShare(true)
    setSelectedFinance(finance)
  }

  const handleCreateFinance = () => {
    navigate('/finances/create')
  }

  const handleOpenFinance = (finance: TFinanceResponse) => {
    navigate(`/finances/${finance.id}`)
  }

  const handleBackFinance = () => {
    navigate('/finances')
  }

  return (
    <FinanceContext.Provider
      value={{
        openConfirmation,
        setOpenConfirmation,
        openShare,
        setOpenShare,
        selectedFinance,
        setSelectedFinance,
        selectedConfirmation,
        setSelectedConfirmation,
        handleConfirm,
        handleDeleteFinance,
        handleUnlinkFinance,
        handlePinFinance,
        handleShareFinance,
        handleOpenFinance,
        handleBackFinance,
        handleCreateFinance,
      }}
    >
      {children}
    </FinanceContext.Provider>
  )
}

const useFinance = () => {
  const context = useContext(FinanceContext)
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider')
  }
  return context
}

export { FinanceProvider, useFinance }
