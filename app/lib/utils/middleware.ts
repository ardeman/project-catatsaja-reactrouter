import { NavigateFunction } from '@remix-run/react'
import { User } from 'firebase/auth'

import { authPages, protectedPages } from '~/lib/configs/page'
import { extractPathSegment } from '~/lib/utils/parser'

type TProps = {
  navigate: NavigateFunction
  pathname: string
  user?: User | null
}

export const middleware = (props: TProps) => {
  const { navigate, pathname, user } = props
  const extractedPath = extractPathSegment(pathname)

  if (protectedPages.has(extractedPath) && !user) {
    const url = '/auth/sign-in'
    return navigate(url)
  }

  if (authPages.has(extractedPath) && user) {
    const url = '/dashboard'
    return navigate(url)
  }
}
