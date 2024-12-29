import { Link } from '@remix-run/react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui'

export const Wrapper = () => {
  const { t } = useTranslation()

  return (
    <main className="flex flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-8">
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 justify-center md:static md:transform-none">
        <Button
          className="w-full max-w-md"
          asChild
        >
          <Link to="/dashboard/money-log/add">{t('moneyLog.form.add')}</Link>
        </Button>
      </div>
    </main>
  )
}
