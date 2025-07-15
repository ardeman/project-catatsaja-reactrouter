import {
  ComponentPropsWithoutRef,
  HTMLAttributes,
  KeyboardEventHandler,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react'
import { FieldValues, Path } from 'react-hook-form'

import { Checkbox } from '~/components/ui/checkbox'

export type TProperties<TFormValues extends FieldValues> = {
  id?: string
  name: Path<TFormValues>
  label?: ReactNode
  textareaName?: Path<TFormValues>
  placeholder?: string
  hint?: ReactNode
  className?: HTMLAttributes<HTMLDivElement>['className']
  containerClassName?: HTMLAttributes<HTMLDivElement>['className']
  labelClassName?: HTMLAttributes<HTMLLabelElement>['className']
  inputClassName?: ComponentPropsWithoutRef<typeof Checkbox>['className']
  textareaContainerClassName?: HTMLAttributes<HTMLDivElement>['className']
  textareaClassName?: HTMLAttributes<HTMLTextAreaElement>['className']
  required?: boolean
  rows?: TextareaHTMLAttributes<HTMLTextAreaElement>['rows']
  readOnly?: boolean
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>
  index?: number
  sequenceName?: string
} & Omit<
  ComponentPropsWithoutRef<typeof Checkbox>,
  'className' | 'checked' | 'onCheckedChange'
>
