import { ReactNode } from 'react'
import { FieldValues, Path } from 'react-hook-form'

export type TMilkdownEditorProperties<TFormValues extends FieldValues> = {
  name: Path<TFormValues>
  label?: string
  placeholder?: string
  previousName?: Path<TFormValues>
  readOnly?: boolean
  // The latest saved Markdown, shown when it changes elsewhere.
  value?: string
  // Receives a function that copies the editor's current text into the form.
  registerSync?: (sync: (() => void) | null) => void
  // Receives a function that applies a format at the editor's selection.
  registerFormat?: (format: TFormat | null) => void
  // Receives the formats at the cursor whenever they change.
  onActiveFormatsChange?: (formats: TEditorFormat[]) => void
}

export type TEditorFormat =
  | 'bold'
  | 'italic'
  | 'code'
  | 'strikethrough'
  | 'link'
  | 'heading'
  | 'subheading'
  | 'bullets'
  | 'numbers'
  | 'text'

type TFormat = (value: TEditorFormat) => void

export type TFormattingMenuProperties = {
  children: ReactNode
  readOnly: boolean
  active: TEditorFormat[]
  registerFormat?: (format: TFormat | null) => void
}

export type TFormattingBarProperties = {
  onFormat: TFormat
  active: TEditorFormat[]
  buttonClassName?: string
}
