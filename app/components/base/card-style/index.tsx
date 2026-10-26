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

// A card's colour and background emoji, behind its content. The card needs
// `isolate` so this layer stays above its surface and below its text.
export const CardStyleLayer = (properties: { cardStyle?: TCardStyle }) => {
  const { color, emoji } = properties.cardStyle ?? {}
  if (!color && !emoji) return
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      style={color && { backgroundColor: `var(--card-${color})` }}
    >
      {emoji && (
        <span className="absolute -right-4 -bottom-6 rotate-12 text-[7rem] leading-none opacity-20 select-none dark:opacity-25">
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
            <div className="grid grid-cols-8 gap-1">
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
