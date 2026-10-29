import { ReactNode } from 'react'

export type TCardColumnsProperties = {
  // In reading order; `column` places each card in the left (0) or right (1)
  // stack on wide screens.
  cards: { key: string; column: 0 | 1; node: ReactNode }[]
}
