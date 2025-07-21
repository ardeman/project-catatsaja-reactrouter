import { HTMLAttributes } from 'react'

export type TMarkdownProperties = {
  children: string
  className?: HTMLAttributes<HTMLDivElement>['className']
}
