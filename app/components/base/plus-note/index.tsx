import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PlusInfo } from '~/components/base/plus-info'
import { Button } from '~/components/ui/button'

// A line saying something needs Catat Saja Plus, with a link to what Plus is.
export const PlusNote = ({ children }: { children: string }) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <p className="text-xs text-muted-foreground">
        {children}{' '}
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-xs"
          onClick={() => setIsOpen(true)}
        >
          {t('plus.info.open')}
        </Button>
      </p>
      <PlusInfo
        open={isOpen}
        setOpen={setIsOpen}
      />
    </>
  )
}
