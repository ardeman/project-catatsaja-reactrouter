import { Outlet } from 'react-router'

import { AboutFooter } from '~/components/layouts/about-footer'

const Home = () => {
  return (
    <main className="app-background relative flex min-h-dvh w-full flex-col items-center justify-center">
      <div className="glass-surface mx-4 mt-8 mb-3 w-[calc(100%-2rem)] max-w-2xl rounded-2xl border p-6 md:p-8">
        <Outlet />
      </div>
      <AboutFooter />
    </main>
  )
}

export default Home
