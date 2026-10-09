import { SearchX, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

import { Button } from '~/components/base/button'
import { LoadingSpinner } from '~/components/base/loading-spinner'
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
  const pinned = matches.filter((item) => item.isPinned)
  const others = matches.filter((item) => !item.isPinned)
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
          {sectionItems.map((item) => renderCard(item, ITEM_CLASS))}
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
        {renderSection(pinned, t('collection.pinned'))}
        {renderSection(others, pinned.length > 0 ? t('collection.others') : '')}
      </>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pb-24 md:gap-8 md:p-8">
      <Button
        containerClassName="flex fixed bottom-4 md:top-16 z-50 sm:max-w-xs mx-auto left-0 right-0 w-full p-4 md:py-8 h-fit"
        className="w-full backdrop-blur-sm hover:bg-primary supports-backdrop-filter:bg-primary/70"
        onClick={onCreate}
      >
        {createLabel}
      </Button>
      <div className={cn('flex flex-1 flex-col gap-6 md:mt-16')}>
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
