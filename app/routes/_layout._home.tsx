import { Outlet } from 'react-router'

import { AboutFooter } from '~/components/layouts/about-footer'

const Home = () => {
  return (
    <main className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-muted/40">
      <Outlet />
      <AboutFooter />
    </main>
  )
}

export default Home
