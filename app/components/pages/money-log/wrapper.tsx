import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base'
import { Card, CardContent, CardTitle } from '~/components/ui'

import { useMoneyLog } from './context'

export const Wrapper = () => {
  const { t } = useTranslation()
  const { handleCreateMoneyLog } = useMoneyLog()

  return (
    <main className="flex flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-8">
      <Button
        containerClassName="flex justify-center md:static md:transform-none fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
        className="w-full max-w-md"
        onClick={handleCreateMoneyLog}
      >
        {t('moneyLog.add')}
      </Button>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        <Card>
          <CardTitle>Title</CardTitle>
          <CardContent>Content</CardContent>
        </Card>
      </div>
    </main>
  )
}
