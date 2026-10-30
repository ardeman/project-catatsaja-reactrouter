import { useSyncExternalStore } from 'react'

import { protectedPages } from '~/lib/configs/page'
import { favicons, themeColors } from '~/lib/constants/metadata'
import {
  lastVisitStorageKey,
  navPages,
  resumeWindow,
  signedInStorageKey,
  startPageStorageKey,
} from '~/lib/constants/navigation'

// Runs before the first paint: the installed app and signed-in visitors skip
// the landing page, and the saved theme and text size are applied so pages
// rendered at build time (the landing page) don't flash the wrong theme.
const themeScript = `(() => {
  try {
    const pages = ${JSON.stringify(navPages)}
    const saved = localStorage.getItem('${startPageStorageKey}')
    let start = '/' + (pages.includes(saved) ? saved : pages[0])
    const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
    // Signed in on this browser: go to the start page rather than wait for
    // Firebase Auth to restore the session over the landing page.
    if (!installed && location.pathname === '/' && localStorage.getItem('${signedInStorageKey}')) {
      location.replace(start)
      return
    }
    // The installed app has no landing page, and opens on the person's
    // start page: leave before painting. It launches at the manifest's
    // start_url (/notes), so the first page of a session moves too, back to
    // the last page when the phone unloaded the app in the background.
    if (installed) {
      try {
        const last = JSON.parse(localStorage.getItem('${lastVisitStorageKey}') || 'null')
        const resumable = ${JSON.stringify([...protectedPages])}
        if (last && typeof last.path === 'string' && resumable.includes('/' + last.path.split('/')[1]) && Date.now() - last.at < ${resumeWindow}) start = last.path
      } catch {}
      const launching = !sessionStorage.getItem('launched')
      sessionStorage.setItem('launched', '1')
      const path = location.pathname
      if (path === '/' || (launching && path === '/${navPages[0]}' && start !== path)) {
        location.replace(start)
        return
      }
    }
    const theme = localStorage.getItem('vite-ui-theme') || 'system'
    const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.add(dark ? 'dark' : 'light')
    let color = document.querySelector('meta[name="theme-color"]')
    if (!color) {
      color = document.createElement('meta')
      color.name = 'theme-color'
      document.head.append(color)
    }
    color.content = dark ? '${themeColors.dark}' : '${themeColors.light}'
    // The browser tab's icon follows the theme too.
    const icon = document.createElement('link')
    icon.id = 'theme-icon'
    icon.rel = 'icon'
    icon.type = 'image/png'
    icon.href = dark ? '${favicons.dark}' : '${favicons.light}'
    document.head.append(icon)
    const size = localStorage.getItem('tailwind-size')
    const sizes = { small: '87.5%', large: '112.5%' }
    if (sizes[size]) document.documentElement.style.setProperty('--base-size', sizes[size])
  } catch {}
})()`

// The browser and installed-app bars follow the app's theme (not only the
// device's) through one theme-color tag, and one status bar style tag for
// iOS; so does the tab's icon. The script creates it before the
// first paint and ThemeProvider updates it; React does not render it, because
// React would add its own copy once the script had changed it.
const noSubscribe = () => () => {}

export const ThemeHead = () => {
  // Only in server-rendered HTML (and while React takes it over): a script
  // React creates in the browser never runs, and React warns about it.
  const isServerHtml = useSyncExternalStore(
    noSubscribe,
    () => false,
    () => true,
  )
  return isServerHtml ? (
    <script dangerouslySetInnerHTML={{ __html: themeScript }} />
  ) : null
}
