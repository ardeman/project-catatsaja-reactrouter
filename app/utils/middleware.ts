import { User } from 'firebase/auth'

import { authPages, protectedPages } from '~/configs'

import { extractPathSegment } from './parser'

type TProps = {
  pathname: string
  user?: User | null
}

export const middleware = (props: TProps): void => {
  const { pathname, user } = props
  const extractPath = extractPathSegment(pathname)

  if (protectedPages.has(extractPath) && !user) {
    globalThis.location.href = '/auth/sign-in'
  }

  if (authPages.has(extractPath) && user) {
    globalThis.location.href = '/dashboard'
  }
}
