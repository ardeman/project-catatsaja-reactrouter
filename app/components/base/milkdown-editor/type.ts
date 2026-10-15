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
}

export type TEditorFormat =
  | 'bold'
  | 'italic'
  | 'code'
  | 'strikethrough'
  | 'link'
  | 'formula'
  | 'heading'
  | 'subheading'
  | 'bullets'
  | 'numbers'
  | 'text'

export type TFormattingMenuProperties = {
  children: ReactNode
  readOnly: boolean
}
