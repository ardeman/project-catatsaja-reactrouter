import { ArrowRight, LucideIcon, Search as SearchIcon } from 'lucide-react'
import {
  Fragment,
  RefObject,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useSearchParams } from 'react-router'

import { Input } from '~/components/ui/input'
import { navs } from '~/lib/constants/navigation'
import { useGetFinances } from '~/lib/hooks/use-get-finances'
import { useGetHealthLogs } from '~/lib/hooks/use-get-health-logs'
import { useGetNotes } from '~/lib/hooks/use-get-notes'
import { useGetTasks } from '~/lib/hooks/use-get-tasks'
import { TMenu } from '~/lib/types/common'
import { toPlainText } from '~/lib/utils/parser'
import { excerpt, normalize } from '~/lib/utils/search'
import { cn } from '~/lib/utils/shadcn'

// Results shown per section; the rest are one "See all" away.
const LIMIT = 5

type TOption = {
  id: string
  href: string
  // A result, or the link to the section's full results.
  kind: 'item' | 'all'
  title: string
  // No title of its own: the placeholder is shown, never highlighted.
  isUntitled?: boolean
  detail?: string
  icon?: LucideIcon
}

type TGroup = {
  heading: string
  options: TOption[]
}

// Searches notes, tasks, finances and health logs at once. Typing shows the best matches
// of each; Enter opens the highlighted one, "See all" filters that list.
export const Search = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchParameters] = useSearchParams()
  const listQuery = searchParameters.get('q') || ''
  const [query, setQuery] = useState(listQuery)
  const [isOpen, setIsOpen] = useState(false)
  const inputReference = useRef<HTMLInputElement>(null)
  const listId = useId()
  const [isMac, setIsMac] = useState(false)
  const [activeDescendant, setActiveDescendant] = useState<string>()

  // Follow the list's own search (back, forward, "Clear search").
  useEffect(() => setQuery(listQuery), [listQuery])
  useEffect(() => setIsOpen(false), [pathname])
  useEffect(() => {
    setIsMac(/mac|iphone|ipad/i.test(navigator.userAgent))
  }, [])

  // "/" or Ctrl/⌘ K jumps to the search from anywhere.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const isTyping =
        target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      const isShortcut =
        (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) ||
        (event.key === '/' && !isTyping)
      if (!isShortcut) return
      event.preventDefault()
      inputReference.current?.focus()
      inputReference.current?.select()
    }
    globalThis.addEventListener('keydown', handleKeyDown)
    return () => globalThis.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleOpen = (option: TOption) => {
    // A single result opens on its own; "See all" keeps the words in the box.
    if (option.kind === 'item') setQuery('')
    setIsOpen(false)
    inputReference.current?.blur()
    navigate(option.href)
  }

  const isShowingResults = isOpen && query.trim() !== ''

  return (
    <div className="relative ml-auto flex-1">
      <form
        role="search"
        onSubmit={(event) => event.preventDefault()}
        className="relative flex items-center"
      >
        <SearchIcon className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
        <Input
          ref={inputReference}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          placeholder={t('navigation.search.placeholder')}
          aria-label={t('navigation.search.placeholder')}
          role="combobox"
          aria-expanded={isShowingResults}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            isShowingResults ? activeDescendant : undefined
          }
          autoComplete="off"
          className="w-full pl-10 md:pr-16"
        />
        {!query && (
          <kbd className="pointer-events-none absolute right-3 hidden rounded border bg-muted px-1.5 py-0.5 font-sans text-[0.7rem] text-muted-foreground md:block">
            {isMac ? '⌘' : 'Ctrl'} K
          </kbd>
        )}
      </form>
      {isShowingResults && (
        <Results
          query={query.trim()}
          listId={listId}
          inputReference={inputReference}
          onOpen={handleOpen}
          onClose={() => setIsOpen(false)}
          onActiveChange={setActiveDescendant}
        />
      )}
    </div>
  )
}

type TResultsProperties = {
  query: string
  listId: string
  inputReference: RefObject<HTMLInputElement | null>
  onOpen: (option: TOption) => void
  onClose: () => void
  onActiveChange: (id?: string) => void
}

// Mounted only while results show, so the lists are loaded on demand.
const Results = (properties: TResultsProperties) => {
  const { query, listId, inputReference, onOpen, onClose, onActiveChange } =
    properties
  const { t } = useTranslation()
  const { data: notes, isLoading: isLoadingNotes } = useGetNotes()
  const { data: tasks, isLoading: isLoadingTasks } = useGetTasks()
  const { data: finances, isLoading: isLoadingFinances } = useGetFinances()
  const { data: healthLogs, isLoading: isLoadingHealth } = useGetHealthLogs()
  const isLoading =
    isLoadingNotes || isLoadingTasks || isLoadingFinances || isLoadingHealth
  const [active, setActive] = useState(0)
  const groups = useMemo(() => {
    // Default order: the search groups results by page, not by the menu.
    const [noteNav, taskNav, financeNav, healthNav] = navs(t)
    const normalizedQuery = normalize(query)
    const toGroup = <T extends { id: string; title?: string }>(
      nav: TMenu,
      items: T[] | undefined,
      untitled: string,
      getText: (item: T) => string,
    ): TGroup => {
      const titleMatches: TOption[] = []
      const contentMatches: TOption[] = []
      let count = 0
      const collectionItems = items || []
      // Scan each collection once. Keep only the visible results instead of
      // sorting every match, with title matches first in their original order.
      for (const item of collectionItems) {
        const title = item.title ?? ''
        const text = getText(item)
        if (!normalize(`${title} ${text}`).includes(normalizedQuery)) continue
        count++
        const isTitleMatch = normalize(title).includes(normalizedQuery)
        const target = isTitleMatch ? titleMatches : contentMatches
        if (target.length === LIMIT) continue
        target.push({
          id: `${nav.href}/${item.id}`,
          href: `${nav.href}/${item.id}`,
          kind: 'item',
          title: title || untitled,
          isUntitled: !title,
          detail: isTitleMatch ? undefined : excerpt(text, query),
          icon: nav.icon,
        })
      }
      const options = [...titleMatches, ...contentMatches].slice(0, LIMIT)
      if (count > LIMIT) {
        options.push({
          id: `${nav.href}?q`,
          href: `${nav.href}?q=${encodeURIComponent(query)}`,
          kind: 'all',
          title: t('search.seeAll', { count, section: nav.name }),
        })
      }
      return { heading: nav.name, options }
    }

    return [
      toGroup(noteNav, notes, t('notes.untitled'), (note) =>
        toPlainText(note.content || ''),
      ),
      toGroup(taskNav, tasks, t('tasks.untitled'), (task) =>
        (task.content || []).map((item) => item.item).join(' · '),
      ),
      toGroup(financeNav, finances, t('finances.untitled'), (finance) =>
        (finance.content || [])
          .flatMap((entry) => [
            entry.description,
            t(`finances.form.category.${entry.category}.label`),
          ])
          .filter(Boolean)
          .join(' · '),
      ),
      // Health logs by the person's name and their notes.
      toGroup(
        healthNav,
        (healthLogs ?? []).map((log) => ({ ...log, title: log.name })),
        t('health.untitled'),
        (log) =>
          (log.content || [])
            .map((entry) => entry.note)
            .filter(Boolean)
            .join(' · '),
      ),
    ].filter((group) => group.options.length > 0)
  }, [notes, tasks, finances, healthLogs, query, t])
  const options = useMemo(
    () => groups.flatMap((group) => group.options),
    [groups],
  )

  useEffect(() => setActive(0), [query])

  // The keyboard stays in the search box; arrows move the highlight.
  useEffect(() => {
    const input = inputReference.current
    if (!input) return
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowUp': {
          event.preventDefault()
          if (options.length === 0) return
          const step = event.key === 'ArrowDown' ? 1 : -1
          setActive(
            (current) => (current + step + options.length) % options.length,
          )
          break
        }
        case 'Enter': {
          event.preventDefault()
          const option = options[active]
          if (option) onOpen(option)
          break
        }
        case 'Escape': {
          onClose()
          break
        }
      }
    }
    input.addEventListener('keydown', handleKeyDown)
    return () => input.removeEventListener('keydown', handleKeyDown)
  }, [inputReference, options, active, onOpen, onClose])

  const activeId = options[active]?.id
  useEffect(() => {
    onActiveChange(activeId ? optionId(listId, activeId) : undefined)
  }, [activeId, listId, onActiveChange])

  const renderBody = () => {
    if (options.length === 0) {
      return (
        <li
          role="presentation"
          className="px-3 py-6 text-center text-sm text-muted-foreground"
        >
          {isLoading ? t('search.searching') : t('search.nothing', { query })}
        </li>
      )
    }
    return groups.map((group) => (
      <Fragment key={group.heading}>
        <li
          role="presentation"
          className="px-3 pt-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase first:pt-1"
        >
          {group.heading}
        </li>
        {group.options.map((option) => {
          const index = options.indexOf(option)
          const Icon = option.icon
          return (
            <li
              key={option.id}
              id={optionId(listId, option.id)}
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
              onClick={() => onOpen(option)}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2 text-sm',
                index === active && 'bg-accent text-accent-foreground',
              )}
            >
              {option.kind === 'item' ? (
                <>
                  {Icon && (
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="grid min-w-0 flex-1">
                    <span
                      className={cn(
                        'truncate font-medium',
                        option.isUntitled && 'text-muted-foreground italic',
                      )}
                    >
                      {option.isUntitled ? (
                        option.title
                      ) : (
                        <Highlight
                          text={option.title}
                          query={query}
                        />
                      )}
                    </span>
                    {option.detail && (
                      <span className="truncate text-xs text-muted-foreground">
                        <Highlight
                          text={option.detail}
                          query={query}
                        />
                      </span>
                    )}
                  </span>
                </>
              ) : (
                <span className="flex items-center gap-2 text-primary">
                  {option.title}
                  <ArrowRight className="size-3.5" />
                </span>
              )}
            </li>
          )
        })}
      </Fragment>
    ))
  }

  return (
    <ul
      id={listId}
      role="listbox"
      aria-label={t('navigation.search.placeholder')}
      // Keep focus in the box so a click doesn't close the list first.
      onMouseDown={(event) => event.preventDefault()}
      className="glass-surface fixed inset-x-4 top-[4.5rem] z-50 max-h-[70vh] overflow-y-auto rounded-xl border p-2 text-popover-foreground md:absolute md:inset-x-0 md:top-full md:mt-2"
    >
      {renderBody()}
    </ul>
  )
}

const optionId = (listId: string, id: string) =>
  `${listId}-${id.replaceAll(/[^\w-]/g, '_')}`

// The text with the first match marked.
const Highlight = (properties: { text: string; query: string }) => {
  const { text, query } = properties
  const index = normalize(text).indexOf(normalize(query))
  if (index === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-primary/25 text-inherit">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  )
}
