import { Size } from '~/lib/contexts/theme'

export type TProperties = {
  type?: 'dropdown' | 'radio'
  value?: Size
  onChange?: (value: Size) => void
}

export type TParameters = {
  value: Size
  handleSetSize: (value: Size) => void
}
