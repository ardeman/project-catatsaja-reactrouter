import { zodResolver } from '@hookform/resolvers/zod'
import { Coins, Pencil, Plus, Trash2 } from 'lucide-react'
import React, { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { Checkbox } from '~/components/base/checkbox'
import { Input } from '~/components/base/input'
import { NumberInput } from '~/components/base/number-input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { useCreateCurrency } from '~/lib/hooks/use-create-currency'
import { useDeleteCurrency } from '~/lib/hooks/use-delete-currency'
import { useGetCurrencies } from '~/lib/hooks/use-get-currencies'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useUpdateCurrency } from '~/lib/hooks/use-update-currency'
import {
  TCurrency,
  TCurrencyForm,
  TCreateCurrencyRequest,
} from '~/lib/types/settings'
import { formatCurrency, getDefaultCurrencyFormat } from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'
import { currencySchema } from '~/lib/validations/settings'

import { useCurrencySettings } from './context'

export const ManageCurrencies = () => {
  const { disabled, setDisabled } = useCurrencySettings()
  const { t } = useTranslation()
  const { data: userData } = useUserData()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState<TCurrency | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingCurrency, setDeletingCurrency] = useState<TCurrency | null>(
    null,
  )

  const { data: currencies = [], isLoading } = useGetCurrencies()

  // Get current currency format settings
  const currentCurrencyFormat = userData?.currencyFormat
  const currentMinimumFractionDigits =
    currentCurrencyFormat?.minimumFractionDigits ??
    getDefaultCurrencyFormat().minimumFractionDigits

  // Sort currencies: default first, then by latest rate ascending
  const sortedCurrencies = React.useMemo(() => {
    return [...currencies].sort((a, b) => {
      // Default currency should be first
      if (a.isDefault && !b.isDefault) return -1
      if (!a.isDefault && b.isDefault) return 1

      // Then sort by latest rate ascending
      return a.rate - b.rate
    })
  }, [currencies])
  const { mutate: createCurrency, isPending: isCreating } = useCreateCurrency()
  const { mutate: updateCurrency, isPending: isUpdating } = useUpdateCurrency()
  const { mutate: deleteCurrency, isPending: isDeleting } = useDeleteCurrency()

  const formMethods = useForm<TCurrencyForm, unknown, TCreateCurrencyRequest>({
    resolver: zodResolver(currencySchema(t, currentMinimumFractionDigits)),
    defaultValues: {
      symbol: '',
      code: '',
      maximumFractionDigits: Math.max(2, currentMinimumFractionDigits),
      rate: 1,
      isDefault: false,
    },
  })

  const { handleSubmit, reset, formState, watch, setValue } = formMethods
  const isDefault = watch('isDefault')

  // Set latest rate to 1 when default is checked
  React.useEffect(() => {
    if (isDefault) {
      setValue('rate', 1)
    }
  }, [isDefault, setValue])

  const handleOpenDialog = (currency?: TCurrency) => {
    if (currency) {
      setEditingCurrency(currency)
      reset({
        symbol: currency.symbol,
        code: currency.code,
        maximumFractionDigits: currency.maximumFractionDigits,
        rate: currency.rate,
        isDefault: currency.isDefault || false,
      })
    } else {
      setEditingCurrency(null)
      // First currency added should be default
      const isFirstCurrency = currencies.length === 0
      reset({
        symbol: '',
        code: '',
        maximumFractionDigits: 2,
        rate: 1,
        isDefault: isFirstCurrency,
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingCurrency(null)
    reset()
  }

  const handleOpenDeleteDialog = (currency: TCurrency) => {
    if (currency.isDefault) {
      return // Prevent opening delete dialog for default currency
    }
    setDeletingCurrency(currency)
    setIsDeleteDialogOpen(true)
  }

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
    setDeletingCurrency(null)
  }

  const onSubmit = handleSubmit(async (data) => {
    setDisabled(true)

    if (editingCurrency) {
      updateCurrency({
        id: editingCurrency.id!,
        ...data,
      })
    } else {
      createCurrency(data)
    }

    handleCloseDialog()
  })

  const handleDelete = () => {
    if (deletingCurrency) {
      setDisabled(true)
      deleteCurrency(deletingCurrency.id!)
      handleCloseDeleteDialog()
    }
  }

  // Preview amount
  const previewAmount = 1234.123_456_789
  const displayFormat = currentCurrencyFormat || getDefaultCurrencyFormat()
  const defaultCurrency = currencies.find((currency) => currency.isDefault)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col space-y-1.5">
              <CardTitle>{t('settings.manageCurrencies.title')}</CardTitle>
              <CardDescription>
                {t('settings.manageCurrencies.description')}
              </CardDescription>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              disabled={disabled}
              containerClassName="shrink-0"
            >
              <Plus className="h-4 w-4" />
              {t('settings.manageCurrencies.button.add')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground">
              {t('settings.manageCurrencies.status.loading')}
            </p>
          ) : sortedCurrencies.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
              <Coins className="size-8 text-muted-foreground/60" />
              <p className="font-medium">
                {t('settings.manageCurrencies.status.empty')}
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {t('settings.manageCurrencies.status.emptyHint')}
              </p>
            </div>
          ) : (
            <ul className="divide-y rounded-lg border">
              {sortedCurrencies.map((currency: TCurrency) => (
                <li
                  key={currency.id}
                  className="flex items-center gap-3 p-3"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold',
                      currency.isDefault && 'bg-primary/15 text-primary',
                    )}
                  >
                    {currency.symbol}
                  </span>
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <p className="flex items-center gap-2 font-medium">
                      {currency.code}
                      {currency.isDefault && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                          {t('settings.manageCurrencies.badge.default')}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {currency.isDefault || !defaultCurrency
                        ? t('settings.manageCurrencies.decimals', {
                            count: currency.maximumFractionDigits,
                          })
                        : t('settings.manageCurrencies.rateLine', {
                            code: currency.code,
                            value: formatCurrency({
                              amount: currency.rate,
                              format: displayFormat,
                              currency: defaultCurrency,
                            }),
                          })}
                    </p>
                  </div>
                  <span className="hidden font-mono text-sm text-muted-foreground lg:block">
                    {formatCurrency({
                      amount: previewAmount,
                      format: displayFormat,
                      currency,
                    })}
                  </span>
                  <div className="flex shrink-0 items-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleOpenDialog(currency)}
                      disabled={disabled}
                      aria-label={t(
                        'settings.manageCurrencies.button.editNamed',
                        {
                          code: currency.code,
                        },
                      )}
                      title={t('settings.manageCurrencies.button.edit')}
                      className="px-2.5"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    {!currency.isDefault && (
                      <Button
                        variant="ghost"
                        onClick={() => handleOpenDeleteDialog(currency)}
                        disabled={disabled}
                        aria-label={t(
                          'settings.manageCurrencies.button.deleteNamed',
                          { code: currency.code },
                        )}
                        title={t('settings.manageCurrencies.button.delete')}
                        className="px-2.5 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Currency Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCurrency
                ? t('settings.manageCurrencies.button.edit')
                : t('settings.manageCurrencies.button.add')}
            </DialogTitle>
            <DialogDescription>
              {editingCurrency
                ? t('settings.manageCurrencies.dialog.editDescription')
                : t('settings.manageCurrencies.dialog.addDescription')}
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...formMethods}>
            <form onSubmit={onSubmit}>
              <div className="grid gap-4 py-4">
                <Input
                  label={t('settings.manageCurrencies.form.code.label')}
                  name="code"
                  placeholder={t(
                    'settings.manageCurrencies.form.code.placeholder',
                  )}
                  disabled={disabled || isCreating || isUpdating}
                />
                <Input
                  label={t('settings.manageCurrencies.form.symbol.label')}
                  name="symbol"
                  placeholder={t(
                    'settings.manageCurrencies.form.symbol.placeholder',
                  )}
                  disabled={disabled || isCreating || isUpdating}
                />
                <Input
                  label={t(
                    'settings.manageCurrencies.form.maximumFractionDigits.label',
                  )}
                  name="maximumFractionDigits"
                  type="number"
                  placeholder={t(
                    'settings.manageCurrencies.form.maximumFractionDigits.placeholder',
                  )}
                  disabled={disabled || isCreating || isUpdating}
                />
                <NumberInput
                  label={t('settings.manageCurrencies.form.rate.label')}
                  name="rate"
                  hint={t('settings.manageCurrencies.form.rate.hint', {
                    example: (16_000)
                      .toLocaleString('en-US')
                      .replaceAll(
                        ',',
                        currentCurrencyFormat?.thousandSeparator ??
                          getDefaultCurrencyFormat().thousandSeparator,
                      ),
                  })}
                  placeholder={t(
                    'settings.manageCurrencies.form.rate.placeholder',
                  )}
                  disabled={disabled || isCreating || isUpdating || isDefault}
                />
                <Checkbox
                  name="isDefault"
                  label={t('settings.manageCurrencies.form.isDefault.label')}
                  hint={t('settings.manageCurrencies.form.isDefault.hint')}
                  disabled={
                    disabled ||
                    isCreating ||
                    isUpdating ||
                    (editingCurrency?.isDefault &&
                      currencies.filter((c) => c.isDefault).length === 1) ||
                    (!editingCurrency && currencies.length === 0) // First currency is readonly
                  }
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isCreating || isUpdating}
                >
                  {t('settings.manageCurrencies.button.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    disabled || isCreating || isUpdating || !formState.isDirty
                  }
                  isLoading={isCreating || isUpdating}
                >
                  {t('settings.manageCurrencies.button.save')}
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('settings.manageCurrencies.button.delete')}
            </DialogTitle>
            <DialogDescription>
              {t('settings.manageCurrencies.dialog.deleteDescription', {
                code: deletingCurrency?.code,
                symbol: deletingCurrency?.symbol,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDeleteDialog}
              disabled={isDeleting}
            >
              {t('settings.manageCurrencies.button.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={disabled || isDeleting}
              isLoading={isDeleting}
            >
              {t('settings.manageCurrencies.button.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
