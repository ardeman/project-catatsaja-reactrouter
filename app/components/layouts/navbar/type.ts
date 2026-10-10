import { HTMLAttributes } from 'react'

export type TProperties = {
  className?: HTMLAttributes<HTMLDivElement>['className']
  // The desktop top bar, or mobile bottom tabs without the logo.
  variant?: 'bar' | 'bottom'
}
