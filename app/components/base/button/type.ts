import { type VariantProps } from 'class-variance-authority'
import {
  ElementType,
  HTMLAttributes,
  MouseEventHandler,
  ReactNode,
} from 'react'

import { variantClassName } from '~/components/ui/button'

export type TButtonProperties<T extends ElementType = 'button'> = {
  type?: 'button' | 'submit' | 'reset'
  onClick?: MouseEventHandler<HTMLButtonElement>
  className?: HTMLAttributes<HTMLButtonElement>['className']
  containerClassName?: HTMLAttributes<HTMLDivElement>['className']
  disabled?: boolean
  children: ReactNode
  isLoading?: boolean
  as?: T
  variant?: VariantProps<typeof variantClassName>['variant']
}
