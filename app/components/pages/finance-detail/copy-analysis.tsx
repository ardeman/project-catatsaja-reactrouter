import { Copy } from 'lucide-react'
import { useId, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Modal } from '~/components/base/modal'
import { PlusNote } from '~/components/base/plus-note'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/base/select'
import { Button } from '~/components/ui/button'
import { usePlan } from '~/lib/hooks/use-plan'
import { toast } from '~/lib/hooks/use-toast'
import { TFinanceForm, TFinanceResponse } from '~/lib/types/finance'
import { TCurrency } from '~/lib/types/settings'
import { copySetup, setupSize } from '~/lib/utils/copy-analysis'

type TProperties = {
  // The person's other books.
  books: TFinanceResponse[]
  currencies: TCurrency[]
  isReadOnly: boolean
}

// Units of `to` for 1 unit of `from`, from the person's own rates (each the
// value of 1 unit in their default currency); undefined when one is missing.
const knownRate = (from: string, to: string, currencies: TCurrency[]) => {
  if (from === to) return 1
  const rateOf = (code: string) =>
    currencies.find((currency) => currency.code === code)?.rate
  const fromRate = rateOf(from)
  const toRate = rateOf(to)
  return fromRate && toRate
    ? Number((fromRate / toRate).toPrecision(8))
    : undefined
}

// Copies another book's groups, budgets, keywords, savings goals and payday
// into this one (a Plus feature, for writers), adding only what it lacks.
// The copy goes into the book's form, so it saves and undoes like any edit.
// Free accounts see the button turned off, with what Plus is.
export const CopyAnalysis = ({
  books,
  currencies,
  isReadOnly,
}: TProperties) => {
  const { t } = useTranslation()
  const { hasPlus } = usePlan()
  const { getValues, setValue } = useFormContext<TFinanceForm>()
  const [isOpen, setIsOpen] = useState(false)
  const [sourceId, setSourceId] = useState<string>()
  const labelId = useId()

  const sources = books.filter((book) => setupSize(book) > 0)
  if (isReadOnly || sources.length === 0) return

  const source = sources.find((book) => book.id === sourceId) ?? sources[0]
  const currency = getValues('currency')
  const rate = knownRate(source.currency.code, currency.code, currencies)
  const hasAmounts =
    (source.budgets ?? []).length > 0 ||
    (source.goals ?? []).some((goal) => !goal.done)

  const handleCopy = () => {
    const { added, ...setup } = copySetup(getValues(), source, {
      rate,
      fractionDigits: currency.maximumFractionDigits,
      newId: () => crypto.randomUUID(),
    })
    if (added > 0)
      for (const field of [
        'categoryGroups',
        'budgets',
        'keywords',
        'goals',
        'payday',
      ] as const)
        setValue(field, setup[field], { shouldDirty: true })
    setIsOpen(false)
    toast({
      description: t(
        added > 0
          ? 'finances.analysis.copy.done'
          : 'finances.analysis.copy.nothing',
        { count: added },
      ),
    })
  }

  return (
    <>
      <div className="grid gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-self-start"
          disabled={!hasPlus}
          onClick={() => setIsOpen(true)}
        >
          <Copy className="size-3.5" />
          {t('finances.analysis.copy.open')}
        </Button>
        {!hasPlus && <PlusNote>{t('finances.analysis.copy.plus')}</PlusNote>}
      </div>
      <Modal
        open={isOpen}
        setOpen={setIsOpen}
        title={t('finances.analysis.copy.title')}
        description={t('finances.analysis.copy.description')}
        handleConfirm={handleCopy}
        confirmLabel={t('finances.analysis.copy.confirm')}
      >
        <div className="grid gap-2">
          <span
            id={labelId}
            className="text-sm font-medium"
          >
            {t('finances.analysis.copy.from')}
          </span>
          <Select
            value={source.id}
            onValueChange={setSourceId}
          >
            <SelectTrigger aria-labelledby={labelId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sources.map((book) => (
                <SelectItem
                  key={book.id}
                  value={book.id}
                >
                  {book.title.trim() || t('finances.untitled')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasAmounts && source.currency.code !== currency.code && (
            <p className="text-xs text-muted-foreground">
              {t(
                rate === undefined
                  ? 'finances.analysis.copy.noRate'
                  : 'finances.analysis.copy.converted',
                { from: source.currency.code, to: currency.code },
              )}
            </p>
          )}
        </div>
      </Modal>
    </>
  )
}
