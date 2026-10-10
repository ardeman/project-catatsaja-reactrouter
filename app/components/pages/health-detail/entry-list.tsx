import { Plus } from 'lucide-react'
import { ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { HealthStatus } from '~/components/base/health-status'
import { Button } from '~/components/ui/button'
import { THealthEntry, THealthKind } from '~/lib/types/health'

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
  addLabel: string
  emptyLabel: string
  // Shown between the add button and the list (charts, summaries).
  children?: ReactNode
}

// A section's entries: an add button that opens the form in place, the
// section's chart or summary, then each entry, which opens for editing.
export const EntryList = <TEntry extends THealthEntry>({
  kind,
  entries,
  renderRow,
  addLabel,
  emptyLabel,
  children,
  isReadOnly,
  units,
  onSaveEntry,
  onDeleteEntry,
}: TProperties<TEntry>) => {
  const { i18n } = useTranslation()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string>()
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

  return (
    <div className="grid gap-4">
      {!isReadOnly &&
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
      {children}
      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <ul className="glass-surface grid divide-y rounded-xl border">
          {entries.map((entry) => {
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
        </ul>
      )}
    </div>
  )
}
