import type { VariantProps } from 'class-variance-authority'
import { Dispatch, ReactNode, SetStateAction } from 'react'

import { buttonVariants } from '~/components/ui/button'

export type TProperties = {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  children: ReactNode
  title?: ReactNode
  description?: string
  onClose?: () => void
  handleConfirm?: () => void | Promise<void>
  variant?: VariantProps<typeof buttonVariants>['variant']
}

export type TParameters = {
  handleClose: () => void
} & TProperties
