import { useEffect, useState } from 'react'

import { fetchContactIds } from '~/apis/firestore/shared-document'
import { fetchUsersByIds } from '~/apis/firestore/user'
import { TUserResponse } from '~/lib/types/user'

// How many people are suggested at most.
const MAX_CONTACTS = 8

// People the person already shares with, most recent first, loaded once
// when the share dialog opens: suggestions for the email field.
export const useGetContacts = () => {
  const [data, setData] = useState<TUserResponse[]>([])

  useEffect(() => {
    let isCurrent = true
    const load = async () => {
      try {
        const ids = await fetchContactIds()
        const users = await fetchUsersByIds(ids.slice(0, MAX_CONTACTS))
        // Profiles come back in any order: keep the most recent first.
        const order = new Map(ids.map((id, index) => [id, index]))
        if (isCurrent)
          setData(
            users
              .filter((user) => user.email)
              .toSorted(
                (a, b) => (order.get(a.uid) ?? 0) - (order.get(b.uid) ?? 0),
              ),
          )
      } catch {
        // Only suggestions: typing an email still works.
      }
    }
    void load()
    return () => {
      isCurrent = false
    }
  }, [])

  return { data }
}
