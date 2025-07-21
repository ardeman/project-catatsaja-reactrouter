import MarkdownToJsx from 'markdown-to-jsx'

import { TMarkdownProperties } from './type'

export const Markdown = (properties: TMarkdownProperties) => {
  const { children, className } = properties
  return (
    <div className={className}>
      <MarkdownToJsx>{children}</MarkdownToJsx>
    </div>
  )
}
