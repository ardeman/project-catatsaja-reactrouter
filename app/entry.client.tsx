import i18next, { use as i18nextUse } from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'
import {
  PropsWithChildren,
  startTransition,
  StrictMode,
  useEffect,
} from 'react'
import { hydrateRoot } from 'react-dom/client'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { HydratedRouter } from 'react-router/dom'

import { publicPages } from './lib/configs/page'
import i18n from './localization/i18n'
import { resources } from './localization/resource'

const LANGUAGE_COOKIE = 'i18next'

const readLanguageCookie = () =>
  document.cookie
    .split(';')
    .map((cookie) => cookie.trim().split('='))
    .find(([name]) => name === LANGUAGE_COOKIE)?.[1]

// Switches to the saved language once hydration is done.
const SavedLanguage = (
  properties: PropsWithChildren<{ language?: string }>,
) => {
  const { language, children } = properties
  useEffect(() => {
    if (language && language !== i18next.language) {
      void i18next.changeLanguage(language)
    }
  }, [language])
  return children
}

async function hydrate() {
  // Public pages are rendered to HTML at build time in one language. React
  // must hydrate them in that language, or the text won't match; the saved
  // language is applied right after. Other pages contain no text yet.
  const savedLanguage = readLanguageCookie()
  const path = globalThis.location.pathname.replace(/(.)\/+$/, '$1')
  const isPrerendered = publicPages.has(path)
  const pageLanguage = document.documentElement.lang || undefined

  await i18nextUse(initReactI18next) // Tell i18next to use the react-i18next plugin
    .use(LanguageDetector) // Setup a client-side language detector
    .use(Backend) // Setup your backend
    .init({
      ...i18n, // spread the configuration
      resources,
      ...(isPrerendered && pageLanguage && { lng: pageLanguage }),
      detection: {
        // The language the person chose (saved in a cookie), else the page's
        // `<html lang>`.
        order: ['cookie', 'htmlTag'],
        caches: ['cookie'],
        lookupCookie: 'i18next',
        cookieMinutes: 60 * 24 * 365, // 1 year
      },
    })

  startTransition(() => {
    hydrateRoot(
      document,
      <I18nextProvider i18n={i18next}>
        <StrictMode>
          <SavedLanguage language={isPrerendered ? savedLanguage : undefined}>
            <HydratedRouter />
          </SavedLanguage>
        </StrictMode>
      </I18nextProvider>,
    )
  })
}

if (globalThis.requestIdleCallback) {
  globalThis.requestIdleCallback(hydrate)
} else {
  // Safari doesn't support requestIdleCallback
  // https://caniuse.com/requestidlecallback
  globalThis.setTimeout(hydrate, 1)
}
