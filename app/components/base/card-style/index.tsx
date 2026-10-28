import { Check, Palette } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { cardColors, cardEmojis } from '~/lib/constants/card-style'
import { TCardStyle } from '~/lib/types/common'
import { cn } from '~/lib/utils/shadcn'

// A card's colour and background emoji, behind its content: the emoji in the
// top corner, clear of the action bar at the bottom. The card needs
// `isolate` so this layer stays above its surface and below its text. On a
// detail page (`isPage`) it covers the whole screen behind the page, softer
// so long text stays easy to read; `main` is isolated for it. Its height is
// set (`h-lvh`) because Chrome left `inset-0` alone 16px short of the bottom.
export const CardStyleLayer = (properties: {
  cardStyle?: TCardStyle
  isPage?: boolean
}) => {
  const { cardStyle, isPage = false } = properties
  const { color, emoji } = cardStyle ?? {}
  if (!color && !emoji) return
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none inset-0 -z-10 overflow-hidden',
        isPage ? 'fixed h-lvh' : 'absolute',
      )}
    >
      {color && (
        <div
          className={cn('absolute inset-0', isPage && 'opacity-60')}
          style={{ backgroundColor: `var(--card-${color})` }}
        />
      )}
      {emoji && (
        <span
          className={cn(
            'absolute rotate-12 leading-none opacity-25 select-none dark:opacity-30',
            isPage
              ? 'top-36 right-2 text-[10rem] opacity-15 md:top-28 md:right-8 md:text-[16rem] dark:opacity-20'
              : '-top-3 -right-3 text-[6rem]',
          )}
        >
          {emoji}
        </span>
      )}
    </div>
  )
}

// The action bar's button for choosing a card's colour and emoji.
export const CardStylePicker = (properties: {
  cardStyle?: TCardStyle
  onChange: (cardStyle: TCardStyle) => void
  buttonClassName: string
}) => {
  const { cardStyle = {}, onChange, buttonClassName } = properties
  const { t } = useTranslation()
  const swatchClassName =
    'relative grid size-7 place-items-center rounded-full border border-border transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden'

  return (
    <div className="flex flex-1 items-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            aria-label={t('actions.cardStyle')}
            title={t('actions.cardStyle')}
            onClick={(event) => event.stopPropagation()}
            className={cn(
              buttonClassName,
              'flex items-center justify-center',
              (cardStyle.color || cardStyle.emoji) && 'text-primary',
            )}
          >
            <Palette />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          collisionPadding={16}
          className="glass-surface grid w-[min(18rem,calc(100vw-2rem))] gap-3 rounded-xl p-3"
        >
          <h2 className="text-sm font-semibold">{t('cardStyle.title')}</h2>
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-xs text-muted-foreground">
              {t('cardStyle.color')}
            </legend>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                aria-label={t('cardStyle.none')}
                title={t('cardStyle.none')}
                aria-pressed={!cardStyle.color}
                onClick={() => onChange({ ...cardStyle, color: undefined })}
                className={cn(swatchClassName, 'bg-background')}
              >
                {!cardStyle.color && <Check className="size-4" />}
              </button>
              {cardColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={t(`cardStyle.colors.${color}`)}
                  title={t(`cardStyle.colors.${color}`)}
                  aria-pressed={cardStyle.color === color}
                  onClick={() => onChange({ ...cardStyle, color })}
                  className={swatchClassName}
                  style={{ backgroundColor: `var(--card-${color})` }}
                >
                  {cardStyle.color === color && <Check className="size-4" />}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-xs text-muted-foreground">
              {t('cardStyle.emoji')}
            </legend>
            <div className="-m-1 grid max-h-52 grid-cols-8 gap-1 overflow-y-auto p-1">
              <button
                type="button"
                aria-label={t('cardStyle.none')}
                title={t('cardStyle.none')}
                aria-pressed={!cardStyle.emoji}
                onClick={() => onChange({ ...cardStyle, emoji: undefined })}
                className={cn(
                  'grid aspect-square place-items-center rounded-md text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
                  !cardStyle.emoji && 'bg-accent ring-1 ring-primary',
                )}
              >
                <span className="text-xs">∅</span>
              </button>
              {cardEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-label={emoji}
                  aria-pressed={cardStyle.emoji === emoji}
                  onClick={() => onChange({ ...cardStyle, emoji })}
                  className={cn(
                    'grid aspect-square place-items-center rounded-md text-lg hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
                    cardStyle.emoji === emoji &&
                      'bg-accent ring-1 ring-primary',
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </fieldset>
        </PopoverContent>
      </Popover>
    </div>
  )
}
