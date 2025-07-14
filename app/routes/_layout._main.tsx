import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useRouteLoaderData } from 'react-router'


import { fetchUserData } from '~/apis/firestore/user'
import { Navbar } from '~/components/layouts/navbar'
import { useTheme } from '~/lib/contexts/theme'
import { TUserResponse } from '~/lib/types/user'

export const clientLoader = async () => {
  try {
    return await fetchUserData()
  } catch {
    return null
  }
}

const Dashboard = () => {
  const userData = useRouteLoaderData<typeof clientLoader>('routes/_layout._main') as
    | TUserResponse
    | null
  const { setTheme } = useTheme()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (!userData) return
    if (userData.theme) setTheme(userData.theme)
    if (userData.language) i18n.changeLanguage(userData.language)
  }, [userData, setTheme, i18n])

  return (
    <main className="flex min-h-dvh w-full flex-col">
      <Navbar />
      <Outlet />
    </main>
  )
}

export default Dashboard
