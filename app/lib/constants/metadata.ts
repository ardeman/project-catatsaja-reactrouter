import { LinksFunction, MetaDescriptor, MetaFunction } from 'react-router'

export const appName = 'Catat Saja'
// Where people write about their data (privacy policy).
export const contactEmail = 'mail@ardeman.com'
export const appleIcon = '/apple-touch-icon.png'
const shortcutIcon = '/android-chrome-512x512.png'
const favicon = '/favicon.ico'
const author = 'Ardeman'
// Browser and installed-app bars match the page background.
export const themeColor = '#ffffff'
export const themeColors = { light: themeColor, dark: '#0c0a09' }
export const appDescription =
  'Write notes, keep checklists, track your money and share them with the people you choose.'
const manifest = '/site.webmanifest'
export const githubUser = 'ardeman'
export const githubRepo = 'project-catatsaja-reactrouter'

// Tags every page needs; a route's own `meta` replaces the root's, so
// routes with their own meta add these through `withAppMeta`.
const appMeta: MetaDescriptor[] = [
  { name: 'author', content: author },
  // Installed on an iPhone or iPad home screen, open without browser bars.
  { name: 'mobile-web-app-capable', content: 'yes' },
  { name: 'apple-mobile-web-app-capable', content: 'yes' },
  { name: 'apple-mobile-web-app-title', content: appName },
  { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
]

export const withAppMeta = (routeMeta: MetaDescriptor[]): MetaDescriptor[] => [
  ...routeMeta,
  ...appMeta,
]

export const meta: MetaFunction = () =>
  withAppMeta([
    { title: appName },
    { name: 'description', content: appDescription },
  ])

export const links: LinksFunction = () => [
  { rel: 'icon', href: favicon },
  { rel: 'shortcut icon', href: shortcutIcon },
  { rel: 'apple-touch-icon', href: appleIcon },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
  {
    rel: 'manifest',
    href: manifest,
  },
]
