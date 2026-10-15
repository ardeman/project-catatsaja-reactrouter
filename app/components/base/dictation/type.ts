import { Dispatch, SetStateAction } from 'react'

import { TDictationKind } from '~/lib/types/ai'

export type TProperties = {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  // Gets the checked transcript.
  onInsert: (text: string) => void
  // Says where the text goes, under the transcript.
  hint: string
  // Running text (the default) or one item per line.
  kind?: TDictationKind
}
