import type { VariantProps } from 'class-variance-authority'
import { Dispatch, ReactNode, SetStateAction } from 'react'

import { variantClassName } from '~/components/ui/button'

export type TProperties = {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  children: ReactNode
  title?: ReactNode
  description?: string
  onClose?: () => void
  handleConfirm?: () => void | Promise<void>
  // The confirm button's text; "Confirm" when not given.
  confirmLabel?: string
  // A second, safer choice shown before the confirm button, such as
  // archiving instead of deleting.
  secondaryLabel?: string
  handleSecondary?: () => void | Promise<void>
  variant?: VariantProps<typeof variantClassName>['variant']
}

export type TParameters = {
  handleClose: () => void
} & TProperties
