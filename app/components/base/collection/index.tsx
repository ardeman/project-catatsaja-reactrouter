import { ChevronDown, SearchX, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

import { Button } from '~/components/base/button'
import { LoadingSpinner } from '~/components/base/loading-spinner'
import { Invitations } from '~/components/layouts/invitations'
import { cn } from '~/lib/utils/shadcn'

import { ITEM_CLASS, MasonryGrid, TLayoutProperties } from './masonry.client'
import { TCollectionItem, TCollectionProperties } from './type'

const byNewest = (a: TCollectionItem, b: TCollectionItem) =>
  (b.updatedAt?.seconds || b.createdAt?.seconds || 0) -
  (a.updatedAt?.seconds || a.createdAt?.seconds || 0)

const Grid = (properties: TLayoutProperties) => (
  <div className="space-y-3">
    {properties.heading && (
      <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {properties.heading}
      </h2>
    )}
    <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      {properties.children}
    </div>
  </div>
)

export const Collection = <T extends TCollectionItem>(
  properties: TCollectionProperties<T>,
) => {
  const {
    items,
    isLoading,
    getSearchText,
    renderCard,
    layout,
    icon: Icon,
    emptyTitle,
    emptyDescription,
    createLabel,
    onCreate,
  } = properties
  const { t } = useTranslation()
  const [searchParameters, setSearchParameters] = useSearchParams()
  const query = (searchParameters.get('q') || '').trim()

  const matches = (items || [])
    .filter(
      (item) =>
        !query ||
        getSearchText(item).toLowerCase().includes(query.toLowerCase()),
    )
    .toSorted(byNewest)
  // Archived items leave the main sections for their own, folded away;
  // searching still finds them.
  const active = matches.filter((item) => !item.isArchived)
  const archived = matches.filter((item) => item.isArchived)
  const pinned = active.filter((item) => item.isPinned)
  const others = active.filter((item) => !item.isPinned)
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const Layout = layout === 'masonry' ? MasonryGrid : Grid

  const clearSearch = () => {
    setSearchParameters(
      (parameters) => {
        parameters.delete('q')
        return parameters
      },
      { replace: true },
    )
  }

  const renderSection = (sectionItems: T[], heading?: string) =>
    sectionItems.length > 0 && (
      <section>
        <Layout
          itemKeys={sectionItems.map((item) => item.id).join(',')}
          heading={heading}
        >
          {sectionItems.map((item) =>
            renderCard(item, cn(ITEM_CLASS, 'motion-fade')),
          )}
        </Layout>
      </section>
    )

  const renderContent = () => {
    if (isLoading) return <LoadingSpinner classname="min-h-40 flex-1" />

    if (query) {
      return (
        <>
          <div className="mx-auto flex w-full max-w-(--breakpoint-2xl) items-center gap-2 text-sm text-muted-foreground">
            <span>{t('search.results', { count: matches.length, query })}</span>
            <Button
              variant="ghost"
              className="h-7 gap-1 px-2"
              onClick={clearSearch}
            >
              <X className="size-3.5" />
              {t('search.clear')}
            </Button>
          </div>
          {matches.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={t('search.empty.title')}
              description={t('search.empty.description')}
            />
          ) : (
            renderSection(matches)
          )}
        </>
      )
    }

    if (matches.length === 0) {
      return (
        <EmptyState
          icon={Icon}
          title={emptyTitle}
          description={emptyDescription}
        />
      )
    }

    return (
      <>
        {active.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('collection.allArchived')}
          </p>
        )}
        {renderSection(pinned, t('collection.pinned'))}
        {renderSection(others, pinned.length > 0 ? t('collection.others') : '')}
        {archived.length > 0 && (
          <div className="mx-auto grid w-full max-w-(--breakpoint-2xl) gap-3">
            <button
              type="button"
              aria-expanded={isArchiveOpen}
              onClick={() => setIsArchiveOpen((current) => !current)}
              className="flex items-center gap-1 justify-self-center rounded-md text-xs font-medium tracking-wide text-muted-foreground uppercase hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
            >
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  'size-4 transition-transform motion-reduce:transition-none',
                  !isArchiveOpen && '-rotate-90',
                )}
              />
              {t('collection.archived', { count: archived.length })}
            </button>
            {isArchiveOpen && renderSection(archived)}
          </div>
        )}
      </>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pb-24 md:gap-8 md:p-8">
      <Button
        containerClassName="flex fixed bottom-[calc(4.5rem+var(--nav-bottom))] md:bottom-auto md:top-16 z-40 sm:max-w-xs mx-auto left-0 right-0 w-full p-4 md:py-8 h-fit"
        className="glass-surface glass-primary w-full border hover:bg-primary"
        // Toasts keep clear of it (app/styles/tailwind.css).
        data-floating-create
        onClick={onCreate}
      >
        {createLabel}
      </Button>
      <div className={cn('flex flex-1 flex-col gap-6 md:mt-16')}>
        {/* Below the floating create button, so it never covers them. */}
        <Invitations />
        {renderContent()}
      </div>
    </div>
  )
}

const EmptyState = (properties: {
  icon: TCollectionProperties<TCollectionItem>['icon']
  title: string
  description: string
}) => {
  const { icon: Icon, title, description } = properties
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
      <Icon className="mb-2 size-10 text-muted-foreground/60" />
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
