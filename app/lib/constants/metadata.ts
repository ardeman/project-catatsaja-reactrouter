import { LinksFunction, MetaFunction } from 'react-router'

export const appName = 'Catat Saja'
export const appleIcon = '/apple-touch-icon.png'
const shortcutIcon = '/android-chrome-512x512.png'
const favicon = '/favicon.ico'
const author = 'Ardeman'
const themeColor = '#facc14'
const manifest = '/site.webmanifest'
export const githubUser = 'ardeman'
export const githubRepo = 'project-catatsaja-reactrouter'

export const meta: MetaFunction = () => [
  { title: appName },
  {
    name: 'description',
    content:
      'A comprehensive personal productivity app featuring task lists, timers, and money logging. Organize your tasks, stay on top of your schedule, and track your finances efficiently.',
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
