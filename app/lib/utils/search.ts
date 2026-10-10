// Case-insensitive search helpers shared by the lists and the global search.

export const normalize = (text: string) => text.toLowerCase()

// A short excerpt of `text` around the first match, with an ellipsis where
// it is cut. Empty when there is no match.
export const excerpt = (text: string, query: string, radius = 40) => {
  const index = normalize(text).indexOf(normalize(query.trim()))
  if (index === -1) return ''
  const start = Math.max(0, index - radius)
  const end = Math.min(text.length, index + query.trim().length + radius)
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${
    end < text.length ? '…' : ''
  }`
}
