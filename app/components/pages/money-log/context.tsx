import {
  createContext,
  Dispatch,
  PropsWithChildren,
  RefObject,
  SetStateAction,
  useContext,
  useRef,
  useState,
} from 'react'

import { TMoneyLogResponse } from '~/lib/types/money-log'

import { TMoneyLogConfirmation } from './type'

type MoneyLogContextValue = {
  openForm: boolean
  setOpenForm: Dispatch<SetStateAction<boolean>>
  openConfirmation: boolean
  setOpenConfirmation: Dispatch<SetStateAction<boolean>>
  openShare: boolean
  setOpenShare: Dispatch<SetStateAction<boolean>>
  selectedMoneyLog: TMoneyLogResponse | undefined
  setSelectedMoneyLog: Dispatch<SetStateAction<TMoneyLogResponse | undefined>>
  selectedConfirmation: TMoneyLogConfirmation | undefined
  setSelectedConfirmation: Dispatch<
    SetStateAction<TMoneyLogConfirmation | undefined>
  >
  formRef: RefObject<{ submit: () => void } | null>
  handleCreateMoneyLog: () => void
  handleEditMoneyLog: (log: TMoneyLogResponse) => void
  handleFormClose: () => void
  handleConfirm: () => void
  // handleDeleteLog: (props: THandleModifyMoneyLog) => void
  // handleUnlinkLog: (props: THandleModifyMoneyLog) => void
  // handlePinLog: (props: THandlePinMoneyLog) => void
  // handleShareLog: (props: THandleModifyMoneyLog) => void
}

const MoneyLogContext = createContext<MoneyLogContextValue | undefined>(
  undefined,
)

const MoneyLogProvider = (properties: PropsWithChildren) => {
  const { children } = properties
  const [openForm, setOpenForm] = useState<boolean>(false)
  const [openConfirmation, setOpenConfirmation] = useState<boolean>(false)
  const [openShare, setOpenShare] = useState<boolean>(false)
  const [selectedMoneyLog, setSelectedMoneyLog] = useState<TMoneyLogResponse>()
  const [selectedConfirmation, setSelectedConfirmation] =
    useState<TMoneyLogConfirmation>()
  // const { mutate: mutatePinLog } = usePinLog()
  // const { mutate: mutateDeleteLog } = useDeleteLog()
  // const { mutate: mutateUnlinkLog } = useUnlinkLog()
  const formReference = useRef<{ submit: () => void } | null>(null)

  const handleCreateMoneyLog = () => {
    setOpenForm(true)
    setSelectedMoneyLog(undefined)
  }

  const handleEditMoneyLog = (log: TMoneyLogResponse) => {
    setOpenForm(true)
    setSelectedMoneyLog(log)
  }

  const handleFormClose = () => {
    setOpenForm(false)
    setSelectedMoneyLog(undefined)
  }

  const handleConfirm = () => {
    setOpenConfirmation(false)
    setSelectedMoneyLog(undefined)
  }

  // const handleDeleteLog = (props: THandleModifyLog) => {
  //   setOpenConfirmation(true)
  //   setSelectedConfirmation(props)
  // }

  // const handleUnlinkLog = (props: THandleModifyLog) => {
  //   setOpenConfirmation(true)
  //   setSelectedConfirmation(props)
  // }

  // const handlePinLog = (props: THandlePinLog) => {
  //   mutatePinLog(props)
  // }

  // const handleShareLog = (props: THandleModifyLog) => {
  //   setOpenShare(true)
  //   setSelectedMoneyLog(props)
  // }

  return (
    <MoneyLogContext.Provider
      value={{
        openForm,
        setOpenForm,
        openConfirmation,
        setOpenConfirmation,
        openShare,
        setOpenShare,
        selectedMoneyLog,
        setSelectedMoneyLog,
        selectedConfirmation,
        setSelectedConfirmation,
        formRef: formReference,
        handleCreateMoneyLog,
        handleEditMoneyLog,
        handleFormClose,
        handleConfirm,
        // handleDeleteLog,
        // handleUnlinkLog,
        // handlePinLog,
        // handleShareLog,
      }}
    >
      {children}
    </MoneyLogContext.Provider>
  )
}

const useMoneyLog = () => {
  const context = useContext(MoneyLogContext)
  if (!context) {
    throw new Error('useMoneyLog must be used within a MoneyLogProvider')
  }
  return context
}

export { MoneyLogProvider, useMoneyLog }
