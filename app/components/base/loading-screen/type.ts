import { HTMLAttributes, ReactNode } from 'react'

export type TProperties = {
  isLoading: boolean
  classname?: HTMLAttributes<HTMLDivElement>['className']
  children?: ReactNode
}
