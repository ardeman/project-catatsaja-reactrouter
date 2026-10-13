import { useEffect } from 'react'

import { appName } from '~/lib/constants/metadata'

// The open item's title in the browser tab ("Weekly plan · Catat Saja"),
// following what is typed; the page's own title comes back on leaving.
// Detail pages load their item in the browser, so route `meta` can't name
// it. The text of React Router's <title> is changed in place: setting
// `document.title` would replace the text node React keeps, and later
// titles (another route's `meta`) would no longer show.
export const useDocumentTitle = (title: string | undefined) => {
  const text = title?.trim()

  useEffect(() => {
    if (!text) return
    const node = document.querySelector('title')?.firstChild
    if (!(node instanceof Text)) return
    const previous = node.data
    const shown = `${text} · ${appName}`
    node.data = shown
    return () => {
      // Unless a route's `meta` has set a newer title since.
      if (node.data === shown) node.data = previous
    }
  }, [text])
}
