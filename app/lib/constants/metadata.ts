import { LinksFunction, MetaFunction } from 'react-router'

export const appName = 'Catat Saja'
// Where people write about their data (privacy policy).
export const contactEmail = 'mail@ardeman.com'
export const appleIcon = '/apple-touch-icon.png'
const shortcutIcon = '/android-chrome-512x512.png'
const favicon = '/favicon.ico'
const author = 'Ardeman'
const themeColor = 'hsl(47.9, 95.8%, 53.1%)'
const manifest = '/site.webmanifest'
export const githubUser = 'ardeman'
export const githubRepo = 'project-catatsaja-reactrouter'

export const meta: MetaFunction = () => [
  { title: appName },
  {
    name: 'description',
    content:
      'Write notes, keep checklists and share them with the people you choose. Finances are coming soon.',
  },
  { name: 'author', content: author },
  {
    name: 'theme-color',
    content: themeColor,
  },
]

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
