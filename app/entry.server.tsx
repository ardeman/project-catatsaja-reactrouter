import { PassThrough } from 'node:stream'

import { createReadableStreamFromReadable } from '@react-router/node'
import { createInstance } from 'i18next'
import { isbot } from 'isbot'
import { renderToPipeableStream } from 'react-dom/server'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { ServerRouter } from 'react-router'
import type { EntryContext } from 'react-router'

import i18n from './localization/i18n'
import { getLocale, getRouteNamespaces } from './localization/i18next.server'
import { resources } from './localization/resource'

const ABORT_DELAY = 6000

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
) {
  const instance = createInstance()
  await instance.use(initReactI18next).init({
    ...i18n,
    lng: getLocale(request),
    ns: getRouteNamespaces(reactRouterContext),
    resources,
  })

  return new Promise<Response>((resolve, reject) => {
    let shellRendered = false
    const ready = isbot(request.headers.get('user-agent') || '')
      ? 'onAllReady'
      : 'onShellReady'
    const { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={instance}>
        <ServerRouter
          context={reactRouterContext}
          url={request.url}
        />
      </I18nextProvider>,
      {
        [ready]() {
          shellRendered = true
          const body = new PassThrough()
          // A completed render no longer needs an abort timer.
          body.on('close', () => clearTimeout(abortTimer))
          const stream = createReadableStreamFromReadable(body)
          responseHeaders.set('Content-Type', 'text/html')
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          )
          pipe(body)
        },
        onShellError(error: unknown) {
          clearTimeout(abortTimer)
          reject(error)
        },
        onError(error: unknown) {
          responseStatusCode = 500
          if (shellRendered) {
            // Streaming errors occur after the response has been returned.
            // eslint-disable-next-line no-console
            console.error(error)
          }
        },
      },
    )
    const abortTimer = setTimeout(abort, ABORT_DELAY)
  })
}

process.on('unhandledRejection', (reason: unknown, p: Promise<unknown>) => {
  let stack: string

  if (reason instanceof Error && reason.stack) {
    stack = reason.stack
  } else if (typeof reason === 'string') {
    stack = reason
  } else {
    try {
      stack = JSON.stringify(reason)
    } catch {
      stack = '[Unable to serialize reason]'
    }
  }

  // eslint-disable-next-line no-console
  console.error('Unhandled Promise Rejection', { reason, stack, promise: p })
})
