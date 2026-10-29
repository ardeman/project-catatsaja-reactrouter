import { HTMLAttributes, ReactNode } from 'react'

export type TProperties = {
  className?: HTMLAttributes<HTMLDivElement>['className']
  // The desktop side menu, or mobile bottom tabs.
  variant?: 'side' | 'bottom'
  // The side menu folded to icons.
  isCollapsed?: boolean
  // Shown after the pages (the bottom tabs' account button, the side
  // menu's settings).
  trailing?: ReactNode
}
