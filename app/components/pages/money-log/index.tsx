import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '~/components/ui/button'
import { Card, CardContent, CardTitle } from '~/components/ui/card'

import { MoneyLogProvider } from './context'

export const MoneyLogPage = () => {
  const { t } = useTranslation()

  return (
    <MoneyLogProvider>
      <main className="flex flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-8">
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 justify-center md:static md:transform-none">
          <Button
            className="w-full max-w-md"
            asChild
          >
            <Link to="/dashboard/money-log/add">{t('moneyLog.add')}</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          <Card>
            <CardTitle>Title</CardTitle>
            <CardContent>Content</CardContent>
          </Card>
        </div>
      </main>
    </MoneyLogProvider>
  )
}
