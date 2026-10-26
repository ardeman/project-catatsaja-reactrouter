import { Outlet } from 'react-router'

import { LanguageSelector } from '~/components/base/language-selector'
import { AboutFooter } from '~/components/layouts/about-footer'

const Home = () => {
  return (
    <main className="app-background relative flex min-h-dvh w-full flex-col items-center justify-center">
      <div className="glass-surface mx-4 mt-4 mb-3 w-[calc(100%-2rem)] max-w-2xl rounded-2xl border p-6 md:mt-8 md:p-8">
        <div className="-mt-3 -mr-3 mb-1 flex justify-end md:-mt-5 md:-mr-5">
          <LanguageSelector />
        </div>
        <Outlet />
      </div>
      <AboutFooter />
    </main>
  )
}

export default Home
