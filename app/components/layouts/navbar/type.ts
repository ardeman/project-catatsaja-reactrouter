import { HTMLAttributes } from 'react'

export type TProperties = {
  className?: HTMLAttributes<HTMLDivElement>['className']
  onLinkClick?: () => void
  // The top bar, or the phone menu (bigger rows, no logo).
  variant?: 'bar' | 'menu'
}
