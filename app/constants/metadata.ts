import { LinksFunction, MetaFunction } from '@remix-run/node'

export const meta: MetaFunction = () => [
  { title: 'Circle Sync' },
  {
    name: 'description',
    content:
      'A comprehensive personal productivity app featuring task lists, timers, and money logging. Organize your tasks, stay on top of your schedule, and track your finances efficiently.',
  },
]

export const links: LinksFunction = () => [
  { rel: 'icon', href: '/icon/favicon.ico' },
]
