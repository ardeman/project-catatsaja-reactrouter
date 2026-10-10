import Masonry from 'masonry-layout'
import { PropsWithChildren, useEffect, useRef } from 'react'

export const ITEM_CLASS = 'collection-item'

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
    <div className="mx-auto w-full max-w-(--breakpoint-2xl) space-y-3">
      {heading && (
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {heading}
        </h2>
      )}
      <div
        ref={gridReference}
        className="relative w-full"
      >
        {children}
      </div>
    </div>
  )
}
