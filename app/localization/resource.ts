import enCommon from './locales/en/common.json'
import enZod from './locales/en/zod.json'
import idCommon from './locales/id/common.json'
import idZod from './locales/id/zod.json'

const languages = ['en', 'id'] as const
export const supportedLanguages = [...languages]
export type Language = (typeof languages)[number]

export type Resource = {
  common: typeof enCommon
  zod: typeof enZod
}

export const resources: Record<Language, Resource> = {
  en: {
    common: enCommon,
    zod: enZod,
  },
  id: {
    common: idCommon,
    zod: idZod,
  },
}

export const returnLanguageIfSupported = (
  lang?: string,
): Language | undefined => {
  if (supportedLanguages.includes(lang as Language)) {
    return lang as Language
  }
  return undefined
}
