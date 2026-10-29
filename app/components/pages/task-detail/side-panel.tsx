import { useTranslation } from 'react-i18next'

import { SaveStatus } from '~/components/base/save-status'

import { TSidePanelProperties } from './type'

// Shown beside the list on wide screens: when it was saved, and how much of
// it is done.
export const SidePanel = (properties: TSidePanelProperties) => {
  const { dateLabel, saveStatus, done, total } = properties
  const { t } = useTranslation()
  const progress = t('tasks.progress', { done, total })

  return (
    <aside className="glass-surface sticky top-8 hidden max-h-[calc(100dvh-4rem)] flex-col gap-4 overflow-y-auto rounded-xl border p-4 xl:flex">
      {dateLabel && (
        <div className="grid gap-1 text-xs text-muted-foreground">
          <span>{dateLabel}</span>
          <SaveStatus status={saveStatus} />
        </div>
      )}
      {total > 0 && (
        <div className="grid gap-2">
          <p className="text-sm">{progress}</p>
          {/* The fill on a lighter track of the same colour. */}
          <div
            role="progressbar"
            aria-label={progress}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
            className="h-2 overflow-hidden rounded-full bg-primary/20"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </aside>
  )
}
