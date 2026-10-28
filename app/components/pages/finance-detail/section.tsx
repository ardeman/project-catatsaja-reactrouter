import { ChevronDown } from 'lucide-react'
import { ReactNode, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '~/lib/utils/shadcn'

// Which analysis cards the person folded or opened, on this device only.
const STORAGE_KEY = 'finance-analysis-folded'

const readFolded = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<
      string,
      boolean
    >
  } catch {
    return {}
  }
}

const saveFolded = (id: string, isFolded: boolean) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...readFolded(), [id]: isFolded }),
    )
  } catch {
    // Storage blocked: the card still folds, just not remembered.
  }
}

// One card of a book's analysis: a title, maybe a subtitle and an action
// beside it, and what it shows. With an `id` the title folds the card to one
// line, showing `summary` in place of the subtitle, and the choice is kept.
export const Section = ({
  id,
  title,
  subtitle,
  summary,
  action,
  isFoldedFirst = false,
  children,
}: {
  id?: string
  title: string
  subtitle?: string
  summary?: ReactNode
  action?: ReactNode
  // Folded until the person opens it, such as a card with nothing to show.
  isFoldedFirst?: boolean
  children: ReactNode
}) => {
  const { t } = useTranslation()
  const contentId = useId()
  const [isFolded, setIsFolded] = useState(() =>
    id === undefined ? false : (readFolded()[id] ?? isFoldedFirst),
  )
  const toggle = () => {
    if (id === undefined) return
    setIsFolded(!isFolded)
    saveFolded(id, !isFolded)
  }
  const detail = isFolded ? (summary ?? subtitle) : subtitle

  return (
    <section
      className={cn(
        'glass-surface motion-enter grid grid-cols-1 rounded-xl border p-4',
        isFolded ? 'py-3' : 'gap-3',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Takes the free width and wraps, so a long subtitle can't widen the
            page on a phone. */}
        <div className="grid min-w-0 flex-1 basis-48 gap-0.5">
          <h2 className="text-sm font-medium">
            {id === undefined ? (
              title
            ) : (
              // The accordion pattern: the heading holds the button.
              <button
                type="button"
                aria-expanded={!isFolded}
                aria-controls={contentId}
                title={t(
                  isFolded
                    ? 'finances.analysis.section.open'
                    : 'finances.analysis.section.fold',
                )}
                onClick={toggle}
                className="-mx-1 flex max-w-full items-center gap-1.5 rounded-md px-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    'size-4 shrink-0 text-muted-foreground transition-transform',
                    isFolded && '-rotate-90',
                  )}
                />
                <span className="truncate">{title}</span>
              </button>
            )}
          </h2>
          {detail && (
            <p
              className={cn(
                'text-xs text-muted-foreground',
                isFolded && 'truncate',
                id !== undefined && 'pl-5.5',
              )}
            >
              {detail}
            </p>
          )}
        </div>
        {action}
      </div>
      {/* Hidden, not unmounted, when folded: an editor dialog inside still
          opens from the action beside the title. */}
      <div
        id={contentId}
        hidden={isFolded}
        className="grid grid-cols-1 gap-3"
      >
        {children}
      </div>
    </section>
  )
}
