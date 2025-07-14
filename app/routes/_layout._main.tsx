import { Outlet } from 'react-router'

import { fetchUserData } from '~/apis/firestore/user'
import { Navbar } from '~/components/layouts/navbar'

export const clientLoader = async () => {
  try {
    return await fetchUserData()
  } catch {
    return null
  }
}

const Dashboard = () => {
  return (
    <main className="flex min-h-dvh w-full flex-col">
      <Navbar />
      <Outlet />
    </main>
  )
}

export default Dashboard
