import { Outlet } from 'react-router'

import { Navbar } from '~/components/layouts/navbar'

const Dashboard = () => {
  return (
    <main className="flex min-h-dvh w-full flex-col">
      <Navbar />
      <Outlet />
    </main>
  )
}

export default Dashboard
