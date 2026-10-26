import { cardColors, cardEmojis } from '~/lib/constants/card-style'
import { TCardStyle } from '~/lib/types/common'

// A stored `cardStyle` as the app can show it: names it doesn't know (from a
// newer app, or written by hand) are left out.
export const toCardStyle = (value: unknown): TCardStyle => {
  if (!value || typeof value !== 'object') return {}
  const { color, emoji } = value as Record<string, unknown>
  return {
    ...(cardColors.includes(color as never) && {
      color: color as TCardStyle['color'],
    }),
    ...(cardEmojis.includes(emoji as never) && {
      emoji: emoji as TCardStyle['emoji'],
    }),
  }
}
