import { Outlet } from 'react-router'

import { BackButton } from '~/components/base/back-button'
import { LanguageSelector } from '~/components/base/language-selector'
import { AboutFooter } from '~/components/layouts/about-footer'

const Home = () => {
  return (
    <main className="app-background relative flex min-h-dvh w-full flex-col items-center justify-center pt-(--top-inset)">
      <div className="glass-surface relative mx-4 mt-4 mb-3 w-[calc(100%-2rem)] max-w-2xl rounded-2xl border p-6 md:mt-8 md:p-8 [&_h1]:px-12">
        {/* Both corners line up with the first line of each page's title. */}
        <div className="absolute top-6 left-6 md:top-8 md:left-8">
          <BackButton />
        </div>
        <div className="absolute top-6 right-6 md:top-8 md:right-8">
          <LanguageSelector />
        </div>
        <Outlet />
      </div>
      <AboutFooter />
    </main>
  )
}

export default Home
