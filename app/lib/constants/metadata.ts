import { LinksFunction, MetaDescriptor, MetaFunction } from 'react-router'

export const appName = 'Catat Saja'
// Where people write about their data (privacy policy).
export const contactEmail = 'mail@ardeman.com'
// Icons come from scripts/icon/logo.svg (`pnpm generate:icons`). The app
// and the browser tab follow the app's theme with the logo that stands out
// on it: the dark tile on light pages, the light tile on dark ones (the tab's
// icon is set by ThemeHead and ThemeProvider, like theme-color;
// /favicon.ico is the fallback). Installed icons stay dark; iOS rounds its
// full-bleed one itself.
export const logos = { light: '/logo-dark.svg', dark: '/logo-light.svg' }
export const favicons = {
  light: '/favicon-32x32.png',
  dark: '/favicon-32x32-light.png',
}
const appleIcon = '/apple-touch-icon.png'
export const author = 'Ardeman'
// The author's portfolio, linked from the About page.
export const authorUrl = 'https://ardeman.com'
// Browser and installed-app bars match the page background.
export const themeColor = '#ffffff'
export const themeColors = { light: themeColor, dark: '#0c0a09' }
// The installed app's status bar on iPhone and iPad, which ignores
// theme-color: see-through, so the page runs under it and fades into it
// (StatusBarFade). Kept per theme so either can go back to an opaque bar.
export const statusBarStyles = {
  light: 'black-translucent',
  dark: 'black-translucent',
}
export const appDescription =
  'Write notes, keep checklists, track your money and health, and share them with the people you choose.'
const manifest = '/site.webmanifest'
export const githubUser = 'ardeman'
export const githubRepository = 'project-catatsaja-reactrouter'

// Tags every page needs; a route's own `meta` replaces the root's, so
// routes with their own meta add these through `withAppMeta`.
const appMeta: MetaDescriptor[] = [
  { name: 'author', content: author },
  // Installed on an iPhone or iPad home screen, open without browser bars.
  { name: 'mobile-web-app-capable', content: 'yes' },
  { name: 'apple-mobile-web-app-capable', content: 'yes' },
  { name: 'apple-mobile-web-app-title', content: appName },
  // apple-mobile-web-app-status-bar-style follows the theme: ThemeHead
  // creates it, like theme-color.
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
