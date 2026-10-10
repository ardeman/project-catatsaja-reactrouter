import { useTranslation } from 'react-i18next'

import { AboutFooter } from '~/components/layouts/about-footer'

export const NotFoundPage = () => {
  const { t } = useTranslation()
  return (
    <main className="app-background relative flex min-h-dvh w-full flex-col items-center justify-center">
      <div className="glass-surface mx-4 my-8 grid min-h-fit max-w-md gap-4 rounded-2xl border p-4 text-center md:gap-8 md:p-8">
        <h1 className="text-5xl font-bold text-destructive">404</h1>
        <h2 className="text-2xl font-semibold">{t('notFound.title')}</h2>
        <p className="text-muted-foreground">{t('notFound.description')}</p>
      </div>
      <AboutFooter />
    </main>
  )
}
