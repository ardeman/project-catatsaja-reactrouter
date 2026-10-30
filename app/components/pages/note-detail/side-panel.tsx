import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SaveStatus } from '~/components/base/save-status'
import { useIsMac } from '~/lib/hooks/use-is-mac'

import { TSidePanelProperties } from './type'

type THeading = { level: number; text: string }

const headingSelector = '.ProseMirror :is(h1, h2, h3, h4, h5, h6)'
const indentClassNames = ['', 'ps-3', 'ps-6', 'ps-9', 'ps-12', 'ps-15']

const readHeadings = (root: HTMLElement): THeading[] =>
  [...root.querySelectorAll<HTMLElement>(headingSelector)].map((element) => ({
    level: Number(element.tagName.slice(1)),
    text: element.textContent?.trim() || '',
  }))

const isSameOutline = (a: THeading[], b: THeading[]) =>
  a.length === b.length &&
  a.every(
    (heading, index) =>
      heading.level === b[index].level && heading.text === b[index].text,
  )

// Shown beside the note on wide screens: when it was saved (and the save
// shortcut), and an outline of
// its headings to jump between. The editor renders asynchronously, so the
// outline follows the editor's DOM instead of parsing the markdown.
export const SidePanel = (properties: TSidePanelProperties) => {
  const { contentReference, dateLabel, isReadOnly, saveStatus } = properties
  const { t } = useTranslation()
  const isMac = useIsMac()
  const [headings, setHeadings] = useState<THeading[]>([])

  useEffect(() => {
    const root = contentReference.current
    if (!root) {
      return
    }

    const update = () => {
      const next = readHeadings(root)
      setHeadings((current) => (isSameOutline(current, next) ? current : next))
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => observer.disconnect()
  }, [contentReference])

  const minLevel = Math.min(...headings.map((heading) => heading.level))

  const jumpTo = (index: number) => {
    const element =
      contentReference.current?.querySelectorAll<HTMLElement>(headingSelector)[
        index
      ]
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    element?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <aside className="glass-surface sticky top-8 hidden max-h-[calc(100dvh-4rem)] flex-col gap-4 overflow-y-auto overscroll-contain rounded-xl border p-4 xl:flex">
      {(dateLabel || !isReadOnly) && (
        <div className="grid gap-1 text-xs text-muted-foreground">
          {dateLabel && (
            <>
              <span>{dateLabel}</span>
              <SaveStatus status={saveStatus} />
            </>
          )}
          {!isReadOnly && (
            <span>
              {t('notes.form.saveShortcut', { key: isMac ? '⌘S' : 'Ctrl+S' })}
            </span>
          )}
        </div>
      )}
      <nav
        aria-label={t('notes.form.outline.title')}
        className="grid gap-2"
      >
        <h2 className="text-xs font-medium text-muted-foreground">
          {t('notes.form.outline.title')}
        </h2>
        {headings.length > 0 ? (
          <ul className="grid gap-0.5">
            {headings.map((heading, index) => (
              <li
                key={`${index}-${heading.text}`}
                className={indentClassNames[heading.level - minLevel]}
              >
                <button
                  type="button"
                  className="w-full truncate rounded-md px-2 py-1 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  title={heading.text}
                  onClick={() => jumpTo(index)}
                >
                  {heading.text}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t('notes.form.outline.empty')}
          </p>
        )}
      </nav>
    </aside>
  )
}
