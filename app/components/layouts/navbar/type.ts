import { HTMLAttributes } from 'react'

export type TProperties = {
  className?: HTMLAttributes<HTMLDivElement>['className']
  onLinkClick?: () => void
}
