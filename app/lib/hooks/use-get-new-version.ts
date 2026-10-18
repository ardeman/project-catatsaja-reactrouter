import { useEffect, useState } from 'react'

import { fetchDeployedBuildId } from '~/apis/version'
import { environment } from '~/lib/utils/environment'

const INTERVAL = 30 * 60 * 1000

// Whether a newer version of the app has been deployed since this tab
// loaded: checked when the app comes back into view and every half hour.
// Unlike `minAppVersion` it only offers a reload; the app keeps working.
export const useGetNewVersion = () => {
  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    if (isAvailable || import.meta.env.DEV) return
    const check = async () => {
      if (document.visibilityState !== 'visible') return
      const deployed = await fetchDeployedBuildId()
      if (deployed && deployed !== environment.VITE_BUILD_ID)
        setIsAvailable(true)
    }
    void check()
    const timer = setInterval(() => void check(), INTERVAL)
    const onVisible = () => void check()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [isAvailable])

  return isAvailable
}
