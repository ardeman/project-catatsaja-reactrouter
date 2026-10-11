import { TNoteResponse } from '~/lib/types/note'

export type TFormProperties = {
  note?: TNoteResponse
}

export type TAiHelpersProperties = {
  // The note as it is on screen, including what was just typed.
  getNote: () => { title: string; content: string }
  isEditable: boolean
  onApply: (note: { title: string; content: string }) => void
}
