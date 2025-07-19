import { FieldValues, Path } from 'react-hook-form'

export type TMilkdownEditorProperties<TFormValues extends FieldValues> = {
  name: Path<TFormValues>
  placeholder?: string
}
