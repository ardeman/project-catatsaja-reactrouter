import { User } from 'firebase/auth'

import { authPages, protectedPages } from '~/lib/configs'
import { extractPathSegment } from '~/lib/utils'

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
