import { HTMLAttributes, ReactNode } from 'react'

export type TProperties = {
  className?: HTMLAttributes<HTMLDivElement>['className']
  // The desktop top bar, or mobile bottom tabs without the logo.
  variant?: 'bar' | 'bottom'
  // Shown after the pages in the bottom tabs (the account button).
  trailing?: ReactNode
}
