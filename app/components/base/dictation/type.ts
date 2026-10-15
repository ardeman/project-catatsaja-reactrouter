import { Dispatch, SetStateAction } from 'react'

export type TProperties = {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  // Gets the checked transcript.
  onInsert: (text: string) => void
  // Says where the text goes, under the transcript.
  hint: string
}
