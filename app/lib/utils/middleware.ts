import { User } from 'firebase/auth'
import { NavigateFunction, type Location } from 'react-router'

import { authPages, protectedPages } from '~/lib/configs/page'
import { extractPathSegment } from '~/lib/utils/parser'

type TProperties = {
  navigate: NavigateFunction
  location: Location
  user?: User | null
}

export const middleware = (properties: TProperties) => {
  const { navigate, location, user } = properties
  const { pathname, search } = location
  const extractedPath = extractPathSegment(pathname)

  if (protectedPages.has(extractedPath) && !user) {
    const url = `/auth/sign-in?redirect=${encodeURIComponent(
      pathname + search,
    )}`
    return navigate(url)
  }

  if (authPages.has(extractedPath) && user) {
    const redirect = new URLSearchParams(search).get('redirect')
    const url = redirect || '/notes'
    return navigate(url)
  }
}
