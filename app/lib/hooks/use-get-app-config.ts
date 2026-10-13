import { useEffect, useState } from 'react'

import { subscribeToAppConfig } from '~/apis/firestore/config'
import { TAppConfig } from '~/lib/types/config'

// The app-wide settings (maintenance mode), live: turning maintenance on in
// the console shows the maintenance screen at once, without a reload.
export const useGetAppConfig = () => {
  const [data, setData] = useState<TAppConfig>({})

  useEffect(() => subscribeToAppConfig(setData), [])

  return { data }
}
