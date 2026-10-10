import { type VariantProps } from 'class-variance-authority'
import {
  AriaAttributes,
  HTMLAttributes,
  MouseEventHandler,
  ReactNode,
} from 'react'

import { variantClassName } from '~/components/ui/button'

export type TButtonProperties = {
  form?: string
  type?: 'button' | 'submit' | 'reset'
  onClick?: MouseEventHandler<HTMLButtonElement>
  className?: HTMLAttributes<HTMLButtonElement>['className']
  containerClassName?: HTMLAttributes<HTMLDivElement>['className']
  disabled?: boolean
  children: ReactNode
  isLoading?: boolean
  variant?: VariantProps<typeof variantClassName>['variant']
  title?: string
} & AriaAttributes
