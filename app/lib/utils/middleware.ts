import { authPages, protectedPages } from '~/lib/configs'
import { extractPathSegment } from '~/lib/utils'

type TProps = {
  pathname: string
  signedIn: boolean
}

export const middleware = (props: TProps): void => {
  const { pathname, signedIn } = props
  const extractPath = extractPathSegment(pathname)

  if (protectedPages.has(extractPath) && !signedIn) {
    globalThis.location.href = '/auth/sign-in'
  }

  if (authPages.has(extractPath) && signedIn) {
    globalThis.location.href = '/dashboard'
  }
}
