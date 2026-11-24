import { Plus } from 'lucide-react'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { HealthStatus } from '~/components/base/health-status'
import { Button } from '~/components/ui/button'
import { THealthEntry, THealthKind } from '~/lib/types/health'
import { cn } from '~/lib/utils/shadcn'

import { HealthEntryForm } from './entry-form'
import { TEntryMetric, TEntryRow, TSectionProperties } from './type'

type TProperties<TEntry extends THealthEntry> = Pick<
  TSectionProperties,
  | 'isReadOnly'
  | 'units'
  | 'onSaveEntry'
  | 'onDeleteEntry'
  | 'addingKind'
  | 'onAddClosed'
> & {
  // The kind added; an entry opens in the form of its own kind (the period
  // list also holds sex logged on the calendar).
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

const changeTone = {
  up: 'text-muted-foreground',
  down: 'text-muted-foreground',
  flat: 'text-muted-foreground/80',
} as const

const changeKey = {
  up: 'health.history.changeUp',
  down: 'health.history.changeDown',
  flat: 'health.history.changeSame',
} as const

// Column labels from the first row that has metrics (every row shares the
// same keys so values line up for comparison).
const metricColumns = (rows: TEntryRow[]) => {
  const metrics = rows.find((row) => row.metrics?.length)?.metrics
  return metrics?.map(({ key, label }) => ({ key, label }))
}

const metricValue = (metrics: TEntryMetric[] | undefined, key: string) =>
  metrics?.find((metric) => metric.key === key)

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
  addingKind,
  onAddClosed,
}: TProperties<TEntry>) => {
  const { t, i18n } = useTranslation()
  const [isAddOpen, setIsAddOpen] = useState(false)
  // Also open when asked from a reminder's "Log now", until it closes.
  const isRequested = addingKind === kind
  const isAdding = isAddOpen || isRequested
  const setIsAdding = (isOpen: boolean) => {
    setIsAddOpen(isOpen)
    if (!isOpen && isRequested) onAddClosed?.()
  }
  const [editingId, setEditingId] = useState<string>()
  const [shownCount, setShownCount] = useState(PAGE_SIZE)
  const scrollReference = useRef<HTMLDivElement>(null)
  const listReference = useRef<HTMLDivElement>(null)
  // Brings the form opened by "Log now" into view (the reminders sit above
  // the sections on narrow screens).
  useEffect(() => {
    if (isRequested) listReference.current?.scrollIntoView({ block: 'nearest' })
  }, [isRequested])
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
      kind={entry?.kind ?? kind}
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
  const shown = entries.slice(0, shownCount)
  const rows = shown.map((entry) => renderRow(entry))
  const columns = metricColumns(rows)
  const metricGrid = columns
    ? {
        gridTemplateColumns: `repeat(${columns.length}, minmax(4.5rem, 1fr)) auto`,
      }
    : undefined

  const list =
    entries.length === 0 ? (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    ) : (
      <div
        className={cn(
          columns && '@container overflow-x-auto overscroll-contain',
        )}
      >
        <ul
          className={cn(
            'grid divide-y',
            columns && 'min-w-[28rem]',
            !beside && 'glass-surface rounded-xl border',
          )}
        >
          {columns && (
            <li
              aria-hidden
              className="border-b bg-muted/30 px-4 py-2"
            >
              <div
                className="grid items-end gap-x-3 text-xs font-medium text-muted-foreground"
                style={metricGrid}
              >
                {columns.map((column) => (
                  <span
                    key={column.key}
                    className="tabular-nums"
                  >
                    {column.label}
                  </span>
                ))}
                <span className="text-right">{t('health.form.date')}</span>
              </div>
            </li>
          )}
          {shown.map((entry, index) => {
            if (!isReadOnly && editingId === entry.id)
              return (
                <li key={entry.id}>
                  {/* As wide as what shows of a list that scrolls sideways
                      (less its borders), and in view wherever it is. */}
                  <div
                    className={cn(
                      'p-1',
                      columns && 'sticky left-0 w-[calc(100cqw-2px)]',
                    )}
                  >
                    {form(entry)}
                  </div>
                </li>
              )
            const row = rows[index]
            const when = [
              dateFormat.format(new Date(`${entry.date}T00:00:00Z`)),
              entry.time,
            ]
              .filter(Boolean)
              .join(' · ')
            const label = columns
              ? [
                  ...(row.metrics ?? [])
                    .filter((metric) => metric.value)
                    .map((metric) => `${metric.label} ${metric.value}`),
                  when,
                ].join(', ')
              : undefined
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  disabled={isReadOnly}
                  aria-label={label}
                  onClick={() => {
                    setIsAdding(false)
                    setEditingId(entry.id)
                  }}
                  className={cn(
                    'motion-enter grid w-full gap-x-3 gap-y-0.5 px-4 py-3 text-left enabled:hover:bg-muted/50 disabled:cursor-default',
                    columns
                      ? 'grid-cols-1'
                      : 'grid-cols-[minmax(0,1fr)_auto] items-start',
                  )}
                >
                  {columns ? (
                    <div
                      className="grid w-full items-start gap-x-3"
                      style={metricGrid}
                    >
                      {columns.map((column) => {
                        const metric = metricValue(row.metrics, column.key)
                        return (
                          <span
                            key={column.key}
                            className="min-w-0"
                          >
                            <span className="block font-medium tabular-nums">
                              {metric?.value ?? '—'}
                            </span>
                            {metric?.change && metric.changeDirection && (
                              <span
                                className={cn(
                                  'block text-xs tabular-nums',
                                  changeTone[metric.changeDirection],
                                )}
                                aria-label={t(
                                  changeKey[metric.changeDirection],
                                  { value: metric.change },
                                )}
                              >
                                {metric.change}
                              </span>
                            )}
                          </span>
                        )
                      })}
                      <span className="pt-0.5 text-right text-xs text-muted-foreground">
                        {when}
                      </span>
                    </div>
                  ) : (
                    <>
                      <span className="min-w-0 font-medium wrap-break-word">
                        {row.primary}
                      </span>
                      <span className="text-right text-xs text-muted-foreground">
                        {when}
                      </span>
                    </>
                  )}
                  {(row.status || row.secondary) && (
                    <span
                      className={cn(
                        'flex min-w-0 flex-wrap items-center gap-x-2 text-xs text-muted-foreground',
                        !columns && 'col-span-2',
                      )}
                    >
                      {row.status && <HealthStatus status={row.status} />}
                      {row.secondary && (
                        <span className="min-w-0 wrap-break-word">
                          {row.secondary}
                        </span>
                      )}
                    </span>
                  )}
                  {entry.note && (
                    <span
                      className={cn(
                        'truncate text-xs text-muted-foreground',
                        !columns && 'col-span-2',
                      )}
                    >
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
      </div>
    )

  return (
    <div
      ref={listReference}
      className="grid scroll-mt-4 gap-4"
    >
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
