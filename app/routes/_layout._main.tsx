import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet } from 'react-router'

import { fetchUserData } from '~/apis/firestore/user'
import { Navbar } from '~/components/layouts/navbar'
import { ScrollArea } from '~/components/ui/scroll-area'
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
  const { setTheme, setSize, theme, size } = useTheme()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (userData?.theme && theme !== userData.theme) setTheme(userData.theme)
    if (userData?.language && i18n.language !== userData.language)
      i18n.changeLanguage(userData.language)
    if (userData?.size && size !== userData.size) setSize(userData.size)
  }, [userData, setTheme, i18n, theme, setSize, size])

  return (
    <ScrollArea className="flex h-dvh w-full">
      <main className="flex min-h-dvh w-screen flex-col bg-muted/40">
        <Navbar />
        <Outlet />
      </main>
    </ScrollArea>
  )
}

export default Main
