import type { Config } from '@react-router/dev/config'

export default {
  // A single-page app: every route renders in the browser. The public pages
  // (landing, about, privacy, terms) are also rendered to HTML at build time,
  // so search engines and link previews can read them; every other path is
  // served `__spa-fallback.html`.
  ssr: false,
  prerender: ['/', '/about', '/privacy', '/terms'],
} satisfies Config
