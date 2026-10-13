import { ArrowDown, ArrowUp } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useMoney } from '~/lib/hooks/use-money'
import { TFinanceCurrency } from '~/lib/types/finance'
import { cn } from '~/lib/utils/shadcn'
import { TSimilarItem } from '~/lib/utils/similar-items'

type TProperties = {
  items: TSimilarItem[]
  book: TFinanceCurrency
  // Expenses show how the latest price compares; for income a change isn't
  // good or bad, so it isn't marked.
  showsPriceChange: boolean
}

// How many rows show before "Show all".
const SHOWN = 8
// Smaller price changes than this aren't worth pointing out.
const NOTABLE_CHANGE = 0.01

// The things in a book that came up more than once, largest total first:
// how often, at what price each, and whether the latest price was more or
// less than usual. The change is written out, never shown by colour alone.
export const ItemBreakdown = (properties: TProperties) => {
  const { items, book, showsPriceChange } = properties
  const { t, i18n } = useTranslation()
  const money = useMoney()
  const [isAllShown, setIsAllShown] = useState(false)
  const percent = new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 0,
  })
  const shown = isAllShown ? items : items.slice(0, SHOWN)

  return (
    <div className="grid gap-3">
      <ul className="grid divide-y">
        {shown.map((item) => {
          const change =
            showsPriceChange &&
            item.change !== undefined &&
            Math.abs(item.change) >= NOTABLE_CHANGE
              ? item.change
              : undefined
          return (
            <li
              key={item.key}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-0.5 py-2 text-sm first:pt-0 last:pb-0"
            >
              <span className="truncate font-medium">{item.name}</span>
              <span className="text-right font-medium tabular-nums">
                {money(item.total, book)}
              </span>
              <span className="col-span-2 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground tabular-nums">
                <span>
                  {t('finances.analysis.items.each', {
                    count: item.count,
                    price: money(item.averageUnit, book),
                  })}
                </span>
                {change !== undefined && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5',
                      change > 0
                        ? 'text-destructive-text'
                        : 'text-emerald-600 dark:text-emerald-400',
                    )}
                  >
                    {change > 0 ? (
                      <ArrowUp
                        aria-hidden="true"
                        className="size-3"
                      />
                    ) : (
                      <ArrowDown
                        aria-hidden="true"
                        className="size-3"
                      />
                    )}
                    {t(
                      change > 0
                        ? 'finances.analysis.items.latestUp'
                        : 'finances.analysis.items.latestDown',
                      {
                        price: money(item.latestUnit, book),
                        percent: percent.format(Math.abs(change)),
                      },
                    )}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
      {items.length > SHOWN && (
        <button
          type="button"
          onClick={() => setIsAllShown((current) => !current)}
          className="justify-self-start text-xs font-medium underline underline-offset-4"
        >
          {isAllShown
            ? t('finances.analysis.items.showFewer')
            : t('finances.analysis.items.showAll', { count: items.length })}
        </button>
      )}
    </div>
  )
}
