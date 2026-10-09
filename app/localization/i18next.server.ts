import type { EntryContext } from 'react-router'

import i18n from './i18n'

// The language saved by the client's language detector (`lookupCookie`).
export const getLocale = (request: Request) => {
  const langFromCookie = request.headers
    .get('cookie')
    ?.split(';')
    .map((cookie) => cookie.trim().split('='))
    .find(([name]) => name === 'i18next')?.[1]

  return (
    i18n.supportedLngs.find((lang) => lang === langFromCookie) ??
    i18n.fallbackLng
  )
}

// The namespaces the matched routes ask for in `handle.i18n`.
export const getRouteNamespaces = (context: EntryContext) =>
  Object.values(context.routeModules).flatMap((module) => {
    const handle = module?.handle as { i18n?: string | string[] } | undefined
    return handle?.i18n ?? []
  })
