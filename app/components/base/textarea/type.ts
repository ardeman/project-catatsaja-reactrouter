import {
  HTMLAttributes,
  KeyboardEventHandler,
  MouseEventHandler,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react'
import { FieldValues, Path } from 'react-hook-form'

export type TProps<TFormValues extends FieldValues> = {
  id?: string
  name: Path<TFormValues>
  label?: string
  onClick?: MouseEventHandler<HTMLTextAreaElement>
  hint?: ReactNode
  maxLength?: number
  className?: HTMLAttributes<HTMLTextAreaElement>['className']
  labelClassName?: HTMLAttributes<HTMLLabelElement>['className']
  containerClassName?: HTMLAttributes<HTMLDivElement>['className']
  inputClassName?: HTMLAttributes<HTMLTextAreaElement>['className']
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  inputMode?: HTMLAttributes<HTMLTextAreaElement>['inputMode']
  autoFocus?: boolean
  leftNode?: (props: HTMLAttributes<HTMLDivElement>) => ReactNode
  rightNode?: (props: HTMLAttributes<HTMLDivElement>) => ReactNode
  autoResize?: boolean
  rows?: TextareaHTMLAttributes<HTMLTextAreaElement>['rows']
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>
}
