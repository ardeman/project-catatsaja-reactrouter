import MarkdownToJsx from 'markdown-to-jsx'

import { cn } from '~/lib/utils/shadcn'

import { TMarkdownProperties } from './type'

export const Markdown = (properties: TMarkdownProperties) => {
  const { children, className } = properties
  return (
    <div
      className={cn(
        'prose prose-zinc prose-p:my-1 prose-code:before:content-none prose-code:after:content-none [&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-normal',
        className,
      )}
    >
      <MarkdownToJsx>{children}</MarkdownToJsx>
    </div>
  )
}
