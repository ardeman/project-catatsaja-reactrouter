import { useState } from 'react'

import { useUserData } from '~/lib/hooks/use-get-user'
import { useGetUsers } from '~/lib/hooks/use-get-users'
import { TUserResponse } from '~/lib/types/user'

const isPlus = (profile: TUserResponse | undefined, now: number) => {
  const endsAt = profile?.planEndsAt?.seconds
  return profile?.plan === 'plus' && endsAt !== undefined && endsAt * 1000 > now
}

// Whether the person has Catat Saja Plus. Read with the profile, so a plan
// bought or ended elsewhere shows after a reload, and checked against the
// time the page opened.
export const usePlan = () => {
  const { data } = useUserData()
  const [now] = useState(() => Date.now())
  const endsAt = data?.planEndsAt?.seconds
  const hasPlus = isPlus(data, now) && endsAt !== undefined
  return { hasPlus, endsAt: hasPlus ? new Date(endsAt * 1000) : undefined }
}

// Whether a book's Plus features (its groups, budgets, goals and keywords)
// can be changed: its owner's Plus covers everyone it is shared with, so a
// free writer can use them on a Plus owner's book. Gemini limits stay the
// person's own (`usePlan`).
export const useBookPlan = (owner?: string) => {
  const { data } = useUserData()
  const { hasPlus } = usePlan()
  const [now] = useState(() => Date.now())
  const isOther = !!owner && !!data && owner !== data.uid && !hasPlus
  const { data: owners } = useGetUsers(isOther ? [owner] : [])
  return { hasPlus: hasPlus || (isOther && isPlus(owners?.[0], now)) }
}
