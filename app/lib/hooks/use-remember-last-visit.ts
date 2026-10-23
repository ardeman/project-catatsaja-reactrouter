import { useEffect } from 'react'
import { useLocation } from 'react-router'

import { protectedPages } from '~/lib/configs/page'
import { rememberLastVisit } from '~/lib/constants/navigation'
import { extractPathSegment } from '~/lib/utils/parser'

// Keeps the installed app's current page, and when it went to the
// background, so a relaunch soon after returns to it (see ThemeHead).
export const useRememberLastVisit = (isEnabled: boolean) => {
  const { pathname, search } = useLocation()

  useEffect(() => {
    if (!isEnabled || !protectedPages.has(extractPathSegment(pathname))) return
    const path = pathname + search
    rememberLastVisit(path)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') rememberLastVisit(path)
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [isEnabled, pathname, search])
}
