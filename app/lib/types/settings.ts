import { z } from 'zod'

import { TNavPage } from '~/lib/constants/navigation'
import { Theme, Size } from '~/lib/contexts/theme'
import {
  generalSettingSchema,
  currencyFormatSchema,
  currencySchema,
} from '~/lib/validations/settings'

export type TUpdateProfileRequest = z.infer<
  ReturnType<typeof generalSettingSchema>
>

export type TUpdateAppearanceRequest = {
  theme: Theme
  size: Size
  language: string
}

export type TUpdateNavigationRequest = {
  navOrder: TNavPage[]
  startPage: TNavPage
}

export type TCurrencyFormatRequest = z.infer<
  ReturnType<typeof currencyFormatSchema>
>

export type TCurrencyFormatForm = z.input<
  ReturnType<typeof currencyFormatSchema>
>

export type TCurrency = z.infer<ReturnType<typeof currencySchema>>

export type TCurrencyForm = z.input<ReturnType<typeof currencySchema>>

export type TCreateCurrencyRequest = {
  symbol: string
  code: string
  maximumFractionDigits: number
  rate: number
  isDefault?: boolean
}

export type TUpdateCurrencyRequest = TCreateCurrencyRequest & {
  id: string
}
