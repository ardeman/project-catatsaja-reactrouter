import { RemixBrowser } from '@remix-run/react'
import i18next, { use } from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'
import { startTransition, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { getInitialNamespaces } from 'remix-i18next/client'

import i18n from './localization/i18n'
import { resources } from './localization/resource'

async function hydrate() {
  await use(initReactI18next) // Tell i18next to use the react-i18next plugin
    .use(LanguageDetector) // Setup a client-side language detector
    .use(Backend) // Setup your backend
    .init({
      ...i18n, // spread the configuration
      // This function detects the namespaces your routes rendered while SSR use
      ns: getInitialNamespaces(),
      resources,
      detection: {
        // Here only enable htmlTag detection, we'll detect the language only
        // server-side with remix-i18next, by using the `<html lang>` attribute
        // we can communicate to the client the language detected server-side
        order: ['cookie', 'htmlTag'],
        // Because we only use htmlTag, there's no reason to cache the language
        // on the browser, so we disable it
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
          <RemixBrowser />
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
