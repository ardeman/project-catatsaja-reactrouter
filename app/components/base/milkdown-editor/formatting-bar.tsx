import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { cn } from '~/lib/utils/shadcn'

import { formats } from './formats'
import { TFormattingBarProperties } from './type'

// A row of formatting buttons for the page's toolbar. They keep the focus in
// the editor, so the selection they format stays.
export const FormattingBar = ({
  onFormat,
  active,
  buttonClassName,
}: TFormattingBarProperties) => {
  const { t } = useTranslation()

  return (
    <div
      role="group"
      aria-label={t('notes.formatting.title')}
      className="motion-fade flex justify-between gap-1"
    >
      {formats.map(({ value, icon: Icon }) => (
        <Button
          key={value}
          variant="outline"
          aria-label={t(`notes.formatting.${value}`)}
          title={t(`notes.formatting.${value}`)}
          aria-pressed={active.includes(value)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onFormat(value)}
          containerClassName="flex min-w-0 flex-1 items-center"
          className={cn(
            buttonClassName,
            active.includes(value) && 'text-primary',
          )}
        >
          <Icon />
        </Button>
      ))}
    </div>
  )
}
