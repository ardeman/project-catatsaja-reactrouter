import { Theme } from '~/lib/contexts/theme'

export type TProperties = {
  type?: 'dropdown' | 'radio'
}

export type TParameters = {
  value: Theme
  handleSetTheme: (value: Theme) => void
}
