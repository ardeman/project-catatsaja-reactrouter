import i18next from 'i18next'
import { useEffect } from 'react'
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
  const { setTheme, setSize } = useTheme()
  const savedTheme = userData?.theme
  const savedSize = userData?.size
  const savedLanguage = userData?.language

  // Apply the saved appearance only when it changes (sign-in, saving). It
  // must not run on every render: the settings page previews other values,
  // and undoing them each render made the two fight (an endless loop).
  useEffect(() => {
    if (savedTheme) setTheme(savedTheme)
  }, [savedTheme, setTheme])

  useEffect(() => {
    if (savedSize) setSize(savedSize)
  }, [savedSize, setSize])

  useEffect(() => {
    if (savedLanguage && i18next.language !== savedLanguage)
      void i18next.changeLanguage(savedLanguage)
  }, [savedLanguage])

  return (
    <ScrollArea className="flex h-dvh w-full">
      <main className="flex min-h-dvh w-screen flex-col bg-muted/40 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        <Navbar />
        <Outlet />
      </main>
    </ScrollArea>
  )
}

export default Main
