import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'

import { fetchUserData } from '~/apis/firestore/user'
import { Navbar } from '~/components/layouts/navbar'
import { useTheme } from '~/lib/contexts/theme'
import { useUserData } from '~/lib/hooks/use-get-user'

export const clientLoader = async () => {
  try {
    return await fetchUserData()
  } catch {
    return null
  }
}

const Main = () => {
  const { data: userData } = useUserData()
  const { setTheme, theme } = useTheme()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (userData?.theme && theme !== userData.theme) setTheme(userData.theme)
    if (userData?.language && i18n.language !== userData.language)
      i18n.changeLanguage(userData.language)
  }, [userData, setTheme, i18n, theme])

  return (
    <main className="flex min-h-dvh w-full flex-col">
      <Navbar />
      <Outlet />
    </main>
  )
}

export default Main
