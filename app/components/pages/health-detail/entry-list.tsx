import { Plus } from 'lucide-react'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { HealthStatus } from '~/components/base/health-status'
import { Button } from '~/components/ui/button'
import { THealthEntry, THealthKind } from '~/lib/types/health'
import { cn } from '~/lib/utils/shadcn'

import { HealthEntryForm } from './entry-form'
import { TEntryRow, TSectionProperties } from './type'

type TProperties<TEntry extends THealthEntry> = Pick<
  TSectionProperties,
  'isReadOnly' | 'units' | 'onSaveEntry' | 'onDeleteEntry'
> & {
  kind: THealthKind
  // Newest first.
  entries: TEntry[]
  renderRow: (entry: TEntry) => TEntryRow
  // No add button without one (periods are added on their calendar).
  addLabel?: string
  emptyLabel: string
  // Shown between the add button and the list (charts, summaries), or at
  // the top of the list's card when there is `beside`.
  children?: ReactNode
  // Shown next to the list's card on wider screens (a calendar), with the
  // list scrolling within its height.
  beside?: ReactNode
}

// Entries rendered at first, and added each time the end of the list
// scrolls into view, so a long history stays quick.
const PAGE_SIZE = 30

// A section's entries: an add button that opens the form in place, the
// section's chart or summary, then each entry, which opens for editing.
export const EntryList = <TEntry extends THealthEntry>({
  kind,
  entries,
  renderRow,
  addLabel,
  emptyLabel,
  children,
  beside,
  isReadOnly,
  units,
  onSaveEntry,
  onDeleteEntry,
}: TProperties<TEntry>) => {
  const { i18n } = useTranslation()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string>()
  const [shownCount, setShownCount] = useState(PAGE_SIZE)
  const scrollReference = useRef<HTMLDivElement>(null)
  const moreReference = useRef<HTMLLIElement>(null)
  const hasMore = entries.length > shownCount
  useEffect(() => {
    const more = moreReference.current
    if (!hasMore || !more) return
    const observer = new IntersectionObserver(
      ([visible]) => {
        if (visible?.isIntersecting) setShownCount((count) => count + PAGE_SIZE)
      },
      // The list's own scroll box beside a calendar, the page otherwise.
      {
        root: beside ? scrollReference.current : undefined,
        rootMargin: '200px',
      },
    )
    observer.observe(more)
    return () => observer.disconnect()
  }, [hasMore, shownCount, beside])
  const dateFormat = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const form = (entry?: TEntry) => (
    <HealthEntryForm
      kind={kind}
      entry={entry}
      units={units}
      onSave={onSaveEntry}
      onDelete={onDeleteEntry}
      onClose={() => {
        setIsAdding(false)
        setEditingId(undefined)
      }}
    />
  )
  const list =
    entries.length === 0 ? (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    ) : (
      <ul
        className={cn(
          'grid divide-y',
          !beside && 'glass-surface rounded-xl border',
        )}
      >
        {entries.slice(0, shownCount).map((entry) => {
          if (!isReadOnly && editingId === entry.id)
            return (
              <li
                key={entry.id}
                className="p-1"
              >
                {form(entry)}
              </li>
            )
          const row = renderRow(entry)
          return (
            <li key={entry.id}>
              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => {
                  setIsAdding(false)
                  setEditingId(entry.id)
                }}
                className="motion-enter grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-0.5 px-4 py-3 text-left enabled:hover:bg-muted/50 disabled:cursor-default"
              >
                <span className="min-w-0 font-medium wrap-break-word">
                  {row.primary}
                </span>
                <span className="text-right text-xs text-muted-foreground">
                  {dateFormat.format(new Date(`${entry.date}T00:00:00Z`))}
                  {entry.time && ` · ${entry.time}`}
                </span>
                <span className="flex min-w-0 flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  {row.status && <HealthStatus status={row.status} />}
                  {row.secondary && (
                    <span className="min-w-0 wrap-break-word">
                      {row.secondary}
                    </span>
                  )}
                </span>
                {entry.note && (
                  <span className="col-span-2 truncate text-xs text-muted-foreground">
                    {entry.note}
                  </span>
                )}
              </button>
            </li>
          )
        })}
        {hasMore && (
          <li
            ref={moreReference}
            aria-hidden
            className="h-px"
          />
        )}
      </ul>
    )

  return (
    <div className="grid gap-4">
      {!isReadOnly &&
        addLabel &&
        (isAdding ? (
          form()
        ) : (
          <Button
            type="button"
            className="motion-fade w-full gap-2"
            onClick={() => {
              setEditingId(undefined)
              setIsAdding(true)
            }}
          >
            <Plus className="size-4" />
            {addLabel}
          </Button>
        ))}
      {beside ? (
        <div className="grid gap-4 md:grid-cols-2">
          {beside}
          {/* The summary on top, then the list, which takes what is left of
              the calendar's height (at least 8rem) and scrolls. */}
          <div className="glass-surface flex flex-col overflow-hidden rounded-xl border">
            {children && <div className="border-b">{children}</div>}
            <div className="md:relative md:min-h-32 md:flex-1">
              <div
                ref={scrollReference}
                className="max-h-96 overflow-y-auto overscroll-contain md:absolute md:inset-0 md:max-h-none"
              >
                {list}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {children}
          {list}
        </>
      )}
    </div>
  )
}
