import Masonry from 'masonry-layout'
import { PropsWithChildren, useEffect, useRef } from 'react'

export const ITEM_CLASS = 'collection-item'
const STAMP_CLASS = 'collection-stamp'

export type TLayoutProperties = PropsWithChildren<{
  itemKeys: string
  heading?: string
}>

// One Masonry instance for the life of the grid, laid out again when the
// cards change.
export const MasonryGrid = (properties: TLayoutProperties) => {
  const { children, itemKeys, heading } = properties
  const gridReference = useRef<HTMLDivElement>(null)
  const masonryReference = useRef<Masonry>(undefined)

  useEffect(() => {
    if (!gridReference.current) return
    masonryReference.current = new Masonry(gridReference.current, {
      itemSelector: `.${ITEM_CLASS}`,
      gutter: 16,
      horizontalOrder: true,
      fitWidth: true,
      // The heading is stamped at the top so it lines up with the cards.
      stamp: `.${STAMP_CLASS}`,
    })
    return () => {
      masonryReference.current?.destroy?.()
      masonryReference.current = undefined
    }
  }, [])

  useEffect(() => {
    masonryReference.current?.reloadItems?.()
    masonryReference.current?.layout?.()
  }, [itemKeys])

  return (
    <div className="flex justify-center">
      <div
        ref={gridReference}
        className="relative mx-auto w-full max-w-(--breakpoint-2xl)"
      >
        {heading && (
          <h2
            className={`${STAMP_CLASS} absolute top-0 left-0 h-8 w-full text-xs font-medium tracking-wide text-muted-foreground uppercase`}
          >
            {heading}
          </h2>
        )}
        {children}
      </div>
    </div>
  )
}
