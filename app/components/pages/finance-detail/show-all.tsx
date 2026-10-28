import { useState } from 'react'
import { useTranslation } from 'react-i18next'

// How many rows an analysis list shows before "Show all".
const SHOWN = 5

// The first rows of a long list, and the button that shows the rest.
export const useShowAll = <T,>(rows: T[]) => {
  const { t } = useTranslation()
  const [isAllShown, setIsAllShown] = useState(false)

  const button = rows.length > SHOWN && (
    <button
      type="button"
      onClick={() => setIsAllShown((current) => !current)}
      className="justify-self-start text-xs font-medium underline underline-offset-4"
    >
      {isAllShown
        ? t('finances.analysis.showFewer')
        : t('finances.analysis.showAll', { count: rows.length })}
    </button>
  )
  return { shown: isAllShown ? rows : rows.slice(0, SHOWN), button }
}
