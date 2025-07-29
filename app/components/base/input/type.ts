import {
  HTMLAttributes,
  HTMLInputAutoCompleteAttribute,
  MouseEventHandler,
  ReactNode,
} from 'react'
import { FieldValues, Path } from 'react-hook-form'

export type TProperties<TFormValues extends FieldValues> = {
  id?: string
  name: Path<TFormValues>
  label?: string
  type?: string
  onClick?: MouseEventHandler<HTMLInputElement>
  hint?: ReactNode
  maxLength?: number
  min?: string | number
  max?: string | number
  className?: HTMLAttributes<HTMLInputElement>['className']
  labelClassName?: HTMLAttributes<HTMLLabelElement>['className']
  containerClassName?: HTMLAttributes<HTMLDivElement>['className']
  inputClassName?: HTMLAttributes<HTMLInputElement>['className']
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  autoFocus?: boolean
  leftNode?: (properties: HTMLAttributes<HTMLDivElement>) => ReactNode
  rightNode?: (properties: HTMLAttributes<HTMLDivElement>) => ReactNode
  autoComplete?: HTMLInputAutoCompleteAttribute
}
