import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Button } from '~/components/base/button'

export const ItemForm = () => {
  const { t } = useTranslation()

  return (
    <div>
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 justify-center md:static md:transform-none">
        <Button className="w-full max-w-md">
          <Link to="/finances/create">{t('finances.form.add')}</Link>
        </Button>
      </div>
    </div>
  )
}
