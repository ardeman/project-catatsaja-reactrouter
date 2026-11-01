import { Search as SearchIcon, X } from 'lucide-react'
import { CSSProperties, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useMediaQuery } from 'usehooks-ts'

import { PlusInfo } from '~/components/base/plus-info'
import { useNotifications } from '~/components/layouts/notifications'
import { useKeyboardInset } from '~/lib/hooks/use-keyboard-inset'
import { useLogout } from '~/lib/hooks/use-logout'
import { cn } from '~/lib/utils/shadcn'

import { AccountSheet } from './account-sheet'
import { Navigation } from './navigation'
import { Search } from './search'
import { SideMenu } from './side-menu'
import { TProperties } from './type'
export { aboutMenus } from './constant'

export const Navbar = (properties: TProperties) => {
  const { className } = properties
  const navigate = useNavigate()
  const { t } = useTranslation()
  const handleLogout = () => {
    mutateLogout()
    navigate('/', { replace: true })
  }

  const { mutate: mutateLogout } = useLogout()
  const notifications = useNotifications()
  // Desktop has a side menu. Phones have the pages as bottom tabs, beside an
  // account tab and a Search button that turns the tabs' pill into the
  // search box, the row rising above the keyboard while it's open.
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const searchReference = useRef<HTMLInputElement>(null)
  const [isSearching, setIsSearching] = useState(false)
  // Outside the account menu, which closes as it opens.
  const [isPlusOpen, setIsPlusOpen] = useState(false)
  const keyboard = useKeyboardInset(!isDesktop && isSearching)
  // The bottom row's place, shared by the tabs, the Search button and the box.
  const rowStyle = {
    '--row-bottom': keyboard?.bottom
      ? `max(var(--nav-bottom), ${keyboard.bottom + 8}px)`
      : 'var(--nav-bottom)',
    '--keyboard-height': keyboard ? `${keyboard.height}px` : '100svh',
  } as CSSProperties
  const searchLabel = t(
    isSearching ? 'navigation.search.close' : 'navigation.search.placeholder',
  )

  return (
    <>
      {isDesktop ? (
        <SideMenu
          notifications={notifications}
          onOpenPlus={() => setIsPlusOpen(true)}
          onSignOut={handleLogout}
        />
      ) : (
        <header
          className={cn(
            // In the tabs' pill: as tall, and clear of the Search button.
            'fixed right-[calc(1rem+4rem+2px+0.375rem)] bottom-(--row-bottom) left-4 z-51 flex h-[calc(4rem+2px)] items-center px-1 motion-safe:transition-opacity motion-safe:duration-200',
            !isSearching && 'pointer-events-none opacity-0',
            className,
          )}
          style={rowStyle}
        >
          {/* Keep blur off the ancestor so search can blur the page behind it. */}
          <div
            aria-hidden="true"
            className="glass-surface pointer-events-none absolute inset-0 -z-10 rounded-full border"
          />
          <Search
            inputReference={searchReference}
            onFocusChange={setIsSearching}
          />
        </header>
      )}
      {!isDesktop && (
        <div
          className="fixed inset-x-4 bottom-(--row-bottom) z-50 flex gap-1.5"
          style={rowStyle}
        >
          <Navigation
            variant="bottom"
            className={cn(
              'glass-surface flex min-w-0 flex-1 gap-0 rounded-full border p-1 motion-safe:transition-opacity motion-safe:duration-200',
              // The search box takes the pill's place.
              isSearching && 'pointer-events-none opacity-0',
            )}
            trailing={
              <AccountSheet
                notifications={notifications}
                onSignOut={handleLogout}
              />
            }
          />
          <button
            type="button"
            aria-label={searchLabel}
            title={searchLabel}
            aria-pressed={isSearching}
            data-guide="search"
            // Keep focus in the box, so a tap closes search instead of
            // blurring it and opening it again.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (isSearching) {
                searchReference.current?.blur()
                return
              }
              // In the tap itself, or the phone won't open its keyboard.
              searchReference.current?.focus()
              searchReference.current?.select()
            }}
            // As tall as the pill: its tabs plus padding and border.
            className="glass-surface flex size-[calc(4rem+2px)] shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
          >
            {isSearching ? (
              <X
                aria-hidden="true"
                className="size-5"
              />
            ) : (
              <SearchIcon
                aria-hidden="true"
                className="size-5"
              />
            )}
          </button>
        </div>
      )}
      <PlusInfo
        open={isPlusOpen}
        setOpen={setIsPlusOpen}
      />
    </>
  )
}
