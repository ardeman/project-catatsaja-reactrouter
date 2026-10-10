import { TFunction } from 'i18next'
import { ListTodo, StickyNote, Wallet } from 'lucide-react'

import { TMenu } from '~/lib/types/common'

// The app's main pages, in their default order. People can reorder them
// and choose which one the app opens on (settings, saved to their profile).
export const navPages = ['notes', 'tasks', 'finances'] as const

export type TNavPage = (typeof navPages)[number]

const isNavPage = (value: unknown): value is TNavPage =>
  navPages.includes(value as TNavPage)

// A saved order made whole: unknown pages dropped, missing ones (added to
// the app later) appended in their default place.
export const orderNavPages = (order?: readonly string[]): TNavPage[] => {
  const known = (order ?? []).filter((page) => isNavPage(page))
  return [...new Set([...known, ...navPages])]
}

// The start page is also kept in this browser, so the installed app can
// open on it before the profile loads (the inline script in ThemeHead
// reads the same key).
export const startPageStorageKey = 'start-page'

export const readStartPage = (): TNavPage => {
  try {
    const saved = localStorage.getItem(startPageStorageKey)
    return isNavPage(saved) ? saved : navPages[0]
  } catch {
    return navPages[0]
  }
}

export const rememberStartPage = (page: TNavPage) => {
  try {
    localStorage.setItem(startPageStorageKey, page)
  } catch {
    // Storage blocked: the app opens on the default page.
  }
}

const navIcons = { notes: StickyNote, tasks: ListTodo, finances: Wallet }

// The main pages as menu items, in the person's saved order (default order
// otherwise).
export const navs = (t: TFunction, order?: readonly string[]): TMenu[] =>
  orderNavPages(order).map((page) => ({
    name: t(`navigation.${page}`),
    href: `/${page}`,
    icon: navIcons[page],
  }))
