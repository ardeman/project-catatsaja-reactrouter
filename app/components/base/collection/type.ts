import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

import { TTime } from '~/lib/types/common'

export type TCollectionItem = {
  id: string
  isPinned?: boolean
  createdAt: TTime
  updatedAt?: TTime
}

export type TCollectionProperties<T extends TCollectionItem> = {
  items?: T[]
  isLoading: boolean
  // Text searched by the navbar search (`?q=`), e.g. title and content.
  getSearchText: (item: T) => string
  renderCard: (item: T, className: string) => ReactNode
  // Masonry for cards of very different heights (notes), a grid otherwise.
  layout: 'masonry' | 'grid'
  icon: LucideIcon
  emptyTitle: string
  emptyDescription: string
  createLabel: string
  onCreate: () => void
}
