import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router'

import { useCreateFinance } from '~/lib/hooks/use-create-finance'
import { useDeleteFinance } from '~/lib/hooks/use-delete-finance'
import { useLoadFinanceEntries } from '~/lib/hooks/use-load-finance-entries'
import { usePinFinance } from '~/lib/hooks/use-pin-finance'
import { useUnlinkFinance } from '~/lib/hooks/use-unlink-finance'
import { TFinanceResponse } from '~/lib/types/finance'
import { newEntryId, normalizeAccounts } from '~/lib/utils/finance'

import {
  THandleDuplicateFinance,
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
  handleDuplicateFinance: (
    properties: THandleDuplicateFinance,
  ) => Promise<{ id: string } | undefined>
  isDuplicatePending: boolean
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
  const { mutate: loadEntries } = useLoadFinanceEntries()
  const { mutate: mutateDeleteFinance } = useDeleteFinance()
  const { mutate: mutateUnlinkFinance } = useUnlinkFinance()
  const { mutate: mutateCreateFinance, isPending: isDuplicatePending } =
    useCreateFinance()
  const isDuplicating = useRef(false)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleConfirm = async () => {
    setOpenConfirmation(false)
    if (!selectedConfirmation?.detail || !selectedConfirmation.kind) return
    if (selectedConfirmation.kind === 'delete') {
      await mutateDeleteFinance(selectedConfirmation.detail)
      if (
        pathname !== '/finances/create' &&
        pathname.startsWith('/finances/')
      ) {
        navigate('/finances', { replace: true })
      }
    } else if (selectedConfirmation.kind === 'unlink') {
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

  // A new book of the person's own with the same content, not shared or
  // pinned. Ignores repeated presses while a copy is being made.
  const handleDuplicateFinance = async (
    properties_: THandleDuplicateFinance,
  ) => {
    if (isDuplicating.current) return
    isDuplicating.current = true
    try {
      // From the list, a book's entries are read from its months first.
      const source =
        'id' in properties_.finance && !properties_.finance.content
          ? await loadEntries(properties_.finance)
          : properties_.finance
      if (!source) return
      const { title, currency, content, accounts } = source
      return await mutateCreateFinance(
        {
          title: title ? t('finances.duplicateTitle', { title }) : '',
          currency,
          content: (content || []).map((entry) => ({
            ...entry,
            id: newEntryId(),
          })),
          accounts: normalizeAccounts(accounts).map((account) => ({
            ...account,
            id: crypto.randomUUID(),
          })),
        },
        t('finances.toast.duplicated'),
      )
    } finally {
      isDuplicating.current = false
    }
  }

  const handleCreateFinance = () => {
    navigate('/finances/create')
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
        handleDuplicateFinance,
        isDuplicatePending,
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
