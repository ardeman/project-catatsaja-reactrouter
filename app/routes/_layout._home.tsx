import { Outlet } from 'react-router'

import { LanguageSelector } from '~/components/base/language-selector'
import { AboutFooter } from '~/components/layouts/about-footer'

const Home = () => {
  return (
    <main className="app-background relative flex min-h-dvh w-full flex-col items-center justify-center">
      <div className="flex w-full justify-end px-4 pt-4 md:absolute md:top-0 md:right-0 md:w-auto md:px-6">
        <LanguageSelector />
      </div>
      <div className="glass-surface mx-4 mt-4 mb-3 w-[calc(100%-2rem)] max-w-2xl rounded-2xl border p-6 md:mt-8 md:p-8">
        <Outlet />
      </div>
      <AboutFooter />
    </main>
  )
}

export default Home
