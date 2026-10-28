import { Plus, X } from 'lucide-react'
import { Dispatch, SetStateAction, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { CategoryIcon } from '~/components/base/category-icon'
import { Input } from '~/components/base/input'
import { Modal } from '~/components/base/modal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/base/select'
import { Button } from '~/components/ui/button'
import { financeCategories } from '~/lib/constants/finance'
import { TFinanceEntry, TFinanceForm } from '~/lib/types/finance'
import { assignCategory } from '~/lib/utils/category-groups'

type TProperties = {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  // The categories offered: those of the types the analysis shows.
  types: TFinanceEntry['type'][]
}

const none = 'none'

// Naming groups and choosing each category's group, one group at most per
// category. Changes go into the book's form as they are made, so they save
// like the rest of the book.
export const CategoryGroupsEditor = ({ open, setOpen, types }: TProperties) => {
  const { t } = useTranslation()
  const { control, getValues, setValue } = useFormContext<TFinanceForm>()
  // Rows are keyed by their own id (see `accounts.tsx`).
  const groups = useWatch({ control, name: 'categoryGroups' }) ?? []
  const [addedId, setAddedId] = useState<string>()

  const update = (next: TFinanceForm['categoryGroups']) =>
    setValue('categoryGroups', next, { shouldDirty: true })

  const handleAdd = () => {
    const id = crypto.randomUUID()
    setAddedId(id)
    update([
      ...(getValues('categoryGroups') ?? []),
      { id, name: '', categories: [] },
    ])
  }

  const handleRemove = (id: string) =>
    update(
      (getValues('categoryGroups') ?? []).filter((group) => group.id !== id),
    )

  const handleAssign = (category: string, id: string) =>
    update(
      assignCategory(
        getValues('categoryGroups') ?? [],
        id === none ? undefined : id,
        category,
      ),
    )

  const groupName = (name: string) =>
    name.trim() || t('finances.analysis.groups.untitled')

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      title={t('finances.analysis.groups.edit')}
      description={t('finances.analysis.groups.editHint')}
    >
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <h3 className="text-xs text-muted-foreground">
            {t('finances.analysis.groups.names')}
          </h3>
          {groups.length > 0 && (
            <ul className="grid gap-1.5">
              {groups.map((group, index) => (
                <li
                  key={group.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 [&_input]:h-8 [&_input]:text-sm"
                >
                  <Input<TFinanceForm>
                    name={`categoryGroups.${index}.name`}
                    label={t('finances.analysis.groups.name.label')}
                    labelClassName="sr-only"
                    // The hidden label must not push the input down.
                    className="[&>:not([hidden])~:not([hidden])]:mt-0"
                    placeholder={t('finances.analysis.groups.name.placeholder')}
                    autoComplete="off"
                    autoFocus={group.id === addedId} // eslint-disable-line jsx-a11y/no-autofocus -- the group just added
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={t('finances.analysis.groups.remove')}
                    title={t('finances.analysis.groups.remove')}
                    onClick={() => handleRemove(group.id)}
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
            {t('finances.analysis.groups.add')}
          </Button>
        </div>

        {groups.length > 0 &&
          types.map((type) => (
            <div
              key={type}
              className="grid gap-1.5"
            >
              <h3 className="text-xs text-muted-foreground">
                {t(`finances.analysis.groups.categories.${type}`)}
              </h3>
              <ul className="grid gap-1.5">
                {financeCategories
                  .filter((category) => category.type === type)
                  .map(({ key }) => {
                    const label = t(`finances.form.category.${key}.label`)
                    const current =
                      groups.find((group) => group.categories.includes(key))
                        ?.id ?? none
                    return (
                      <li
                        key={key}
                        className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 text-sm"
                      >
                        <CategoryIcon category={key} />
                        <span className="truncate">{label}</span>
                        <Select
                          value={current}
                          onValueChange={(id) => handleAssign(key, id)}
                        >
                          <SelectTrigger
                            className="h-8"
                            aria-label={t('finances.analysis.groups.groupOf', {
                              category: label,
                              // An attribute, not HTML: "Food & drinks" stays.
                              interpolation: { escapeValue: false },
                            })}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={none}>
                              {t('finances.analysis.groups.none')}
                            </SelectItem>
                            {groups.map((group) => (
                              <SelectItem
                                key={group.id}
                                value={group.id}
                              >
                                {groupName(group.name)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </li>
                    )
                  })}
              </ul>
            </div>
          ))}
      </div>
    </Modal>
  )
}
