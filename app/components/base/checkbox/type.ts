import { CheckedState } from '@radix-ui/react-checkbox'
import { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react'
import { FieldValues, Path } from 'react-hook-form'

import { Checkbox } from '~/components/ui/checkbox'

export type TProperties<TFormValues extends FieldValues> = {
  id?: string
  name: Path<TFormValues>
  label?: ReactNode
  rightNode?: ReactNode
  leftNode?: ReactNode
  hint?: ReactNode
  className?: HTMLAttributes<HTMLDivElement>['className']
  containerClassName?: HTMLAttributes<HTMLDivElement>['className']
  labelClassName?: HTMLAttributes<HTMLLabelElement>['className']
  inputClassName?: ComponentPropsWithoutRef<typeof Checkbox>['className']
  required?: boolean
  onChange?: (checked: CheckedState) => void
} & Omit<
  ComponentPropsWithoutRef<typeof Checkbox>,
  'className' | 'checked' | 'onCheckedChange'
>
