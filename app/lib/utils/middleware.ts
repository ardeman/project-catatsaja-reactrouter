import { User } from 'firebase/auth'
import { NavigateFunction } from 'react-router'

import { authPages, protectedPages } from '~/lib/configs/page'
import { extractPathSegment } from '~/lib/utils/parser'

type TProperties = {
  navigate: NavigateFunction
  pathname: string
  user?: User | null
}

export const middleware = (properties: TProperties) => {
  const { navigate, pathname, user } = properties
  const extractedPath = extractPathSegment(pathname)

  if (protectedPages.has(extractedPath) && !user) {
    const url = '/auth/sign-in'
    return navigate(url)
  }

  if (authPages.has(extractedPath) && user) {
    const url = '/notes'
    return navigate(url)
  }
}
