import { useState } from 'react'

import { useUserData } from '~/lib/hooks/use-get-user'

// Whether the person has Catat Saja Plus. Read with the profile, so a plan
// bought or ended elsewhere shows after a reload, and checked against the
// time the page opened.
export const usePlan = () => {
  const { data } = useUserData()
  const [now] = useState(() => Date.now())
  const endsAt = data?.planEndsAt?.seconds
  const hasPlus =
    data?.plan === 'plus' && endsAt !== undefined && endsAt * 1000 > now
  return { hasPlus }
}
