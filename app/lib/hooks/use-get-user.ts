import { useRouteLoaderData } from 'react-router'

import { TUserResponse } from '~/lib/types/user'
import { clientLoader as mainLoader } from '~/routes/_layout._main'

// Custom hook to access current user data from the layout loader
export const useUserData = () => {
  const data = useRouteLoaderData<typeof mainLoader>('routes/_layout._main') as
    | TUserResponse
    | undefined

  return { data, isLoading: false }
}
