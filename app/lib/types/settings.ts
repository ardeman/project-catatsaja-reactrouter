import { z } from 'zod'

import { Theme, Size } from '~/lib/contexts/theme'
import {
  generalSettingSchema,
  currencyFormatSchema,
} from '~/lib/validations/settings'

export type TUpdateProfileRequest = z.infer<
  ReturnType<typeof generalSettingSchema>
>

export type TUpdateAppearanceRequest = {
  theme: Theme
  size: Size
  language: string
}

export type TCurrencyFormatRequest = z.infer<
  ReturnType<typeof currencyFormatSchema>
>
