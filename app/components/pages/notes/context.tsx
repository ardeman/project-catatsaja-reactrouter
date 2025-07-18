import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useState,
} from 'react'
import { useNavigate, useLocation } from 'react-router'

import { useDeleteNote } from '~/lib/hooks/use-delete-note'
import { usePinNote } from '~/lib/hooks/use-pin-note'
import { useUnlinkNote } from '~/lib/hooks/use-unlink-note'
import { TNoteResponse } from '~/lib/types/note'

import { THandleModifyNote, THandlePinNote, TNoteConfirmation } from './type'

type NoteContextValue = {
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
  handleConfirm: () => Promise<void>
  handleDeleteNote: (properties: THandleModifyNote) => void
  handleUnlinkNote: (properties: THandleModifyNote) => void
  handlePinNote: (properties: THandlePinNote) => void
  handleShareNote: (properties: THandleModifyNote) => void
  handleOpenNote: (note: TNoteResponse) => void
  handleBackNote: () => void
  handleCreateNote: () => void
}

const NoteContext = createContext<NoteContextValue | undefined>(undefined)

const NoteProvider = (properties: PropsWithChildren) => {
  const { children } = properties
  const [openConfirmation, setOpenConfirmation] = useState<boolean>(false)
  const [openShare, setOpenShare] = useState<boolean>(false)
  const [selectedNote, setSelectedNote] = useState<TNoteResponse>()
  const [selectedConfirmation, setSelectedConfirmation] =
    useState<TNoteConfirmation>()
  const { mutate: mutatePinNote } = usePinNote()
  const { mutate: mutateDeleteNote } = useDeleteNote()
  const { mutate: mutateUnlinkNote } = useUnlinkNote()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleConfirm = async () => {
    setOpenConfirmation(false)
    if (!selectedConfirmation?.detail || !selectedConfirmation.kind) return
    if (selectedConfirmation.kind === 'delete') {
      await mutateDeleteNote(selectedConfirmation.detail)
      if (pathname.startsWith('/notes/') && pathname !== '/notes/create') {
        navigate('/notes', { replace: true })
      }
    }
    if (selectedConfirmation.kind === 'unlink') {
      mutateUnlinkNote(selectedConfirmation.detail)
    }
  }

  const handleDeleteNote = (properties_: THandleModifyNote) => {
    const { note } = properties_
    setOpenConfirmation(true)
    setSelectedConfirmation({
      kind: 'delete',
      detail: note,
    })
  }

  const handleUnlinkNote = (properties_: THandleModifyNote) => {
    const { note } = properties_
    setOpenConfirmation(true)
    setSelectedConfirmation({
      kind: 'unlink',
      detail: note,
    })
  }

  const handlePinNote = (properties_: THandlePinNote) => {
    const { note, isPinned } = properties_
    mutatePinNote({ note, isPinned })
  }

  const handleShareNote = (properties_: THandleModifyNote) => {
    const { note } = properties_
    setOpenShare(true)
    setSelectedNote(note)
  }

  const handleCreateNote = () => {
    navigate('/notes/create')
  }

  const handleOpenNote = (note: TNoteResponse) => {
    navigate(`/notes/${note.id}`)
  }

  const handleBackNote = () => {
    navigate('/notes')
  }

  return (
    <NoteContext.Provider
      value={{
        openConfirmation,
        setOpenConfirmation,
        openShare,
        setOpenShare,
        selectedNote,
        setSelectedNote,
        selectedConfirmation,
        setSelectedConfirmation,
        handleConfirm,
        handleDeleteNote,
        handleUnlinkNote,
        handlePinNote,
        handleShareNote,
        handleOpenNote,
        handleBackNote,
        handleCreateNote,
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
