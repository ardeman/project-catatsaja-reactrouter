import { useEffect } from 'react'
import { useRevalidator } from 'react-router'

import { refreshUserData } from '~/apis/firestore/user'

// Once the app shows a profile kept in this browser, checks the server's
// copy and loads the profile again when it changed (e.g. settings saved on
// another device).
export const useRefreshUserData = () => {
  const { revalidate } = useRevalidator()

  useEffect(() => {
    void refreshUserData().then((changed) => {
      if (changed) void revalidate()
    })
  }, [revalidate])
}
