import Backend from 'i18next-fs-backend'
import { RemixI18Next } from 'remix-i18next/server'

import i18n from './i18n'

const i18next = new RemixI18Next({
  detection: {
    supportedLanguages: i18n.supportedLngs,
    fallbackLanguage: i18n.fallbackLng,
    async findLocale(request) {
      const langFromCookie = request.headers
        .get('cookie')
        ?.split(';')
        .find((c) => c.includes('i18next'))
        ?.split('=')[1]

      return langFromCookie ?? i18n.fallbackLng
    },
  },

  i18next: {
    ...i18n,
  },
  plugins: [Backend],
})

export default i18next
