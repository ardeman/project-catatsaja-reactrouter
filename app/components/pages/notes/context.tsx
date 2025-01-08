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

import { useDeleteNote } from '~/lib/hooks/use-delete-note'
import { usePinNote } from '~/lib/hooks/use-pin-note'
import { useUnlinkNote } from '~/lib/hooks/use-unlink-note'
import { TNoteResponse } from '~/lib/types/note'

import { THandleModifyNote, THandlePinNote, TNoteConfirmation } from './type'

type NoteContextValue = {
  openForm: boolean
  setOpenForm: Dispatch<SetStateAction<boolean>>
  openConfirmation: boolean
  setOpenConfirmation: Dispatch<SetStateAction<boolean>>
  openShare: boolean
  setOpenShare: Dispatch<SetStateAction<boolean>>
  selectedNote: TNoteResponse | undefined
  setSelectedNote: Dispatch<SetStateAction<TNoteResponse | undefined>>
  selectedConfirmation: TNoteConfirmation | undefined
  setSelectedConfirmation: Dispatch<
    SetStateAction<TNoteConfirmation | undefined>
  >
  formRef: RefObject<{ submit: () => void } | null>
  handleCreateNote: () => void
  handleEditNote: (note: TNoteResponse) => void
  handleFormClose: () => void
  handleConfirm: () => void
  handleDeleteNote: (props: THandleModifyNote) => void
  handleUnlinkNote: (props: THandleModifyNote) => void
  handlePinNote: (props: THandlePinNote) => void
  handleShareNote: (props: THandleModifyNote) => void
}

const NoteContext = createContext<NoteContextValue | undefined>(undefined)

const NoteProvider = (props: PropsWithChildren) => {
  const { children } = props
  const [openForm, setOpenForm] = useState<boolean>(false)
  const [openConfirmation, setOpenConfirmation] = useState<boolean>(false)
  const [openShare, setOpenShare] = useState<boolean>(false)
  const [selectedNote, setSelectedNote] = useState<TNoteResponse>()
  const [selectedConfirmation, setSelectedConfirmation] =
    useState<TNoteConfirmation>()
  const { mutate: mutatePinNote } = usePinNote()
  const { mutate: mutateDeleteNote } = useDeleteNote()
  const { mutate: mutateUnlinkNote } = useUnlinkNote()
  const formRef = useRef<{ submit: () => void } | null>(null)

  const handleCreateNote = () => {
    setOpenForm(true)
    setSelectedNote(undefined)
  }

  const handleEditNote = (note: TNoteResponse) => {
    setOpenForm(true)
    setSelectedNote(note)
  }

  const handleFormClose = () => {
    setOpenForm(false)
    // Only submit the form if no `selectedNote` is present
    if (!selectedNote) {
      formRef.current?.submit() // Trigger the form submission through a ref
    }
  }

  const handleConfirm = () => {
    setOpenConfirmation(false)
    setOpenForm(false)
    if (!selectedConfirmation?.detail || !selectedConfirmation.kind) return
    if (selectedConfirmation?.kind === 'delete') {
      mutateDeleteNote(selectedConfirmation.detail)
    }
    if (selectedConfirmation?.kind === 'unlink') {
      mutateUnlinkNote(selectedConfirmation.detail)
    }
  }

  const handleDeleteNote = (props: THandleModifyNote) => {
    const { note } = props
    setOpenConfirmation(true)
    setSelectedConfirmation({
      kind: 'delete',
      detail: note,
    })
  }

  const handleUnlinkNote = (props: THandleModifyNote) => {
    const { note } = props
    setOpenConfirmation(true)
    setSelectedConfirmation({
      kind: 'unlink',
      detail: note,
    })
  }

  const handlePinNote = (props: THandlePinNote) => {
    const { note, isPinned } = props
    mutatePinNote({ note, isPinned })
  }

  const handleShareNote = (props: THandleModifyNote) => {
    const { note } = props
    setOpenShare(true)
    setSelectedNote(note)
  }

  return (
    <NoteContext.Provider
      value={{
        openForm,
        setOpenForm,
        openConfirmation,
        setOpenConfirmation,
        openShare,
        setOpenShare,
        selectedNote,
        setSelectedNote,
        selectedConfirmation,
        setSelectedConfirmation,
        formRef,
        handleFormClose,
        handleCreateNote,
        handleEditNote,
        handleConfirm,
        handleDeleteNote,
        handleUnlinkNote,
        handlePinNote,
        handleShareNote,
      }}
    >
      {children}
    </NoteContext.Provider>
  )
}

const useNote = () => {
  const context = useContext(NoteContext)
  if (context === undefined) {
    throw new Error('useNote must be used within a NoteProvider')
  }
  return context
}

export { NoteProvider, useNote }
