import { z } from 'zod'

import { Theme, Size } from '~/lib/contexts/theme'
import { generalSettingSchema } from '~/lib/validations/settings'

export type TUpdateProfileRequest = z.infer<typeof generalSettingSchema>

export type TUpdateAppearanceRequest = {
  theme: Theme
  language: string
  size: Size
}

export type TCurrencyFormatRequest = {
  thousandSeparator: string
  decimalSeparator: string
  minimumFractionDigits: number
  currencyPlacement: 'before' | 'after'
  currencyType: 'symbol' | 'code'
  addSpace: boolean
}
