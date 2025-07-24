import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '~/components/base/button'
import { Card, CardContent, CardTitle } from '~/components/ui/card'

export const FinancesPage = () => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Button
        containerClassName="flex fixed bottom-4 md:top-16 z-50 sm:max-w-xs mx-auto left-0 right-0 w-full p-4 md:py-8 h-fit"
        className="w-full backdrop-blur hover:bg-primary supports-[backdrop-filter]:bg-primary/70"
      >
        <Link to="/finances/create">{t('finances.add')}</Link>
      </Button>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-16 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        <Card>
          <CardTitle>Title</CardTitle>
          <CardContent>Content</CardContent>
        </Card>
      </div>
    </div>
  )
}
