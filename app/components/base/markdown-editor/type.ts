import {
  HTMLAttributes,
  KeyboardEventHandler,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react'
import { FieldValues, Path } from 'react-hook-form'

export type TProperties<TFormValues extends FieldValues> = {
  id?: string
  name: Path<TFormValues>
  label?: string
  hint?: ReactNode
  className?: HTMLAttributes<HTMLDivElement>['className']
  labelClassName?: HTMLAttributes<HTMLLabelElement>['className']
  containerClassName?: HTMLAttributes<HTMLDivElement>['className']
  inputClassName?: HTMLAttributes<HTMLDivElement>['className']
  required?: boolean
  placeholder?: string
  readOnly?: boolean
  autoFocus?: boolean
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>
  textareaProps?: Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    'value' | 'onScroll'
  >
}
