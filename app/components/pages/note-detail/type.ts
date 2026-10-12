import { TNoteResponse } from '~/lib/types/note'

export type TFormProperties = {
  note?: TNoteResponse
}

export type TAiHelpersProperties = {
  // The note as it is on screen, including what was just typed.
  getNote: () => { title: string; content: string }
  isEditable: boolean
  // The helpers need something to work on.
  hasContent: boolean
  onApply: (note: { title: string; content: string }) => void
  // The icon bar's button style.
  triggerClassName: string
}
