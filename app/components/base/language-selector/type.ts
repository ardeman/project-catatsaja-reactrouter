export type TProperties = {
  type?: 'dropdown' | 'radio'
  value?: string
  onChange?: (lng: string) => void
}

export type TParameters = {
  value: string
  changeLanguage: (lng: string) => void
}
