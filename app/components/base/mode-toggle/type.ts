import { Theme } from '~/lib/contexts/theme'

export type TProperties = {
  type?: 'dropdown' | 'radio'
  value?: Theme
  onChange?: (value: Theme) => void
}

export type TParameters = {
  value: Theme
  handleSetTheme: (value: Theme) => void
}
