import MarkdownToJsx from 'markdown-to-jsx'

import { cn } from '~/lib/utils/shadcn'

import { TMarkdownProperties } from './type'

export const Markdown = (properties: TMarkdownProperties) => {
  const { children, className } = properties
  return (
    <div className={cn('prose prose-zinc prose-p:my-1', className)}>
      <MarkdownToJsx>{children}</MarkdownToJsx>
    </div>
  )
}
