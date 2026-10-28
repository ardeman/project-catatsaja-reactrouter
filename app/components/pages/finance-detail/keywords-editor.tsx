import { Plus, X } from 'lucide-react'
import { Dispatch, SetStateAction, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Input } from '~/components/base/input'
import { Modal } from '~/components/base/modal'
import { Button } from '~/components/ui/button'
import { TFinanceForm } from '~/lib/types/finance'

type TProperties = {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

// Choosing the words to look for in entries' descriptions. Changes go into
// the book's form as they are made, so they save like the rest of the book.
export const KeywordsEditor = ({ open, setOpen }: TProperties) => {
  const { t } = useTranslation()
  const { control, getValues, setValue } = useFormContext<TFinanceForm>()
  // Rows are keyed by their own id (see `accounts.tsx`).
  const keywords = useWatch({ control, name: 'keywords' }) ?? []
  const [addedId, setAddedId] = useState<string>()

  const update = (next: TFinanceForm['keywords']) =>
    setValue('keywords', next, { shouldDirty: true })

  const handleAdd = () => {
    const id = crypto.randomUUID()
    setAddedId(id)
    update([...(getValues('keywords') ?? []), { id, text: '' }])
  }

  const handleRemove = (id: string) =>
    update((getValues('keywords') ?? []).filter((keyword) => keyword.id !== id))

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      title={t('finances.analysis.keywords.edit')}
      description={t('finances.analysis.keywords.editHint')}
    >
      <div className="grid gap-1.5">
        {keywords.length > 0 && (
          <ul className="grid gap-1.5">
            {keywords.map((keyword, index) => (
              <li
                key={keyword.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 [&_input]:h-8 [&_input]:text-sm"
              >
                <Input<TFinanceForm>
                  name={`keywords.${index}.text`}
                  label={t('finances.analysis.keywords.keyword')}
                  labelClassName="sr-only"
                  // The hidden label must not push the input down.
                  className="[&>:not([hidden])~:not([hidden])]:mt-0"
                  placeholder={t('finances.analysis.keywords.placeholder')}
                  autoComplete="off"
                  autoFocus={keyword.id === addedId} // eslint-disable-line jsx-a11y/no-autofocus -- the row just added
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={t('finances.analysis.keywords.remove')}
                  title={t('finances.analysis.keywords.remove')}
                  onClick={() => handleRemove(keyword.id)}
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-self-start"
          onClick={handleAdd}
        >
          <Plus className="size-3.5" />
          {t('finances.analysis.keywords.add')}
        </Button>
      </div>
    </Modal>
  )
}
