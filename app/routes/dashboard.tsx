import { Outlet } from '@remix-run/react'

import { Navbar } from '~/components/layouts'

const Dashboard = () => {
  return (
    <main className="flex min-h-screen w-full flex-col">
      <Navbar />
      <Outlet />
    </main>
  )
}

export default Dashboard
