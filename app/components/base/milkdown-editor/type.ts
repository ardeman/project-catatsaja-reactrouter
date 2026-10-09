import { FieldValues, Path } from 'react-hook-form'

export type TMilkdownEditorProperties<TFormValues extends FieldValues> = {
  name: Path<TFormValues>
  placeholder?: string
  previousName?: Path<TFormValues>
  readOnly?: boolean
  // The latest saved Markdown, shown when it changes elsewhere.
  value?: string
  // Receives a function that copies the editor's current text into the form.
  registerSync?: (sync: (() => void) | null) => void
}
