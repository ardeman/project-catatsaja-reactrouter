import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, ChevronUp, Edit, Plus, Trash2 } from 'lucide-react'
import React, { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '~/components/base/button'
import { Checkbox } from '~/components/base/checkbox'
import { Input } from '~/components/base/input'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { useCreateCurrency } from '~/lib/hooks/use-create-currency'
import { useDeleteCurrency } from '~/lib/hooks/use-delete-currency'
import { useGetCurrencies } from '~/lib/hooks/use-get-currencies'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useUpdateCurrency } from '~/lib/hooks/use-update-currency'
import { TCurrency, TCreateCurrencyRequest } from '~/lib/types/settings'
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const { data: currencies = [], isLoading } = useGetCurrencies()

  // Get current currency format settings
  const currentCurrencyFormat = userData?.currencyFormat
  const currentMinimumFractionDigits =
    currentCurrencyFormat?.minimumFractionDigits || 0

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

  const formMethods = useForm<TCreateCurrencyRequest>({
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

  const toggleExpandedRow = (currencyId: string) => {
    const newExpandedRows = new Set(expandedRows)
    if (newExpandedRows.has(currencyId)) {
      newExpandedRows.delete(currencyId)
    } else {
      newExpandedRows.add(currencyId)
    }
    setExpandedRows(newExpandedRows)
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('settings.manageCurrencies.title')}</CardTitle>
              <CardDescription>
                {t('settings.manageCurrencies.description')}
              </CardDescription>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('settings.manageCurrencies.button.add')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                {t('settings.manageCurrencies.status.loading')}
              </div>
            </div>
          ) : sortedCurrencies.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                {t('settings.manageCurrencies.status.empty')}
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3 md:w-auto">
                    {t('settings.manageCurrencies.table.code')}
                  </TableHead>
                  <TableHead className="hidden w-auto md:table-cell">
                    {t('settings.manageCurrencies.table.symbol')}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t('settings.manageCurrencies.table.maxDecimals')}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t('settings.manageCurrencies.table.rate')}
                  </TableHead>
                  <TableHead className="w-[100px]">
                    {t('settings.manageCurrencies.table.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCurrencies.map((currency: TCurrency) => {
                  const isExpanded = expandedRows.has(currency.id!)
                  return (
                    <React.Fragment key={currency.id}>
                      <TableRow>
                        <TableCell>
                          <span>{currency.code}</span>{' '}
                          <span
                            className={cn(
                              'inline-block text-xs md:hidden',
                              currency.isDefault
                                ? 'font-bold text-primary'
                                : 'text-muted-foreground',
                            )}
                          >
                            ({currency.symbol})
                          </span>
                        </TableCell>
                        <TableCell
                          className={cn(
                            'hidden font-medium md:table-cell',
                            currency.isDefault
                              ? 'font-bold text-primary'
                              : 'text-muted-foreground',
                          )}
                        >
                          {currency.symbol}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {currency.maximumFractionDigits}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {currency.rate}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 md:gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => toggleExpandedRow(currency.id!)}
                              disabled={disabled}
                              className="md:hidden"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => handleOpenDialog(currency)}
                              disabled={disabled}
                            >
                              <Edit className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => handleOpenDeleteDialog(currency)}
                              disabled={disabled || currency.isDefault}
                            >
                              <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="md:hidden">
                          <TableCell
                            {...({
                              colSpan: 6,
                            } as React.HTMLAttributes<HTMLTableCellElement>)}
                          >
                            <div className="flex flex-col gap-4 p-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                  {t(
                                    'settings.manageCurrencies.form.maximumFractionDigits.label',
                                  )}
                                  :
                                </span>
                                <span className="text-sm">
                                  {currency.maximumFractionDigits}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">
                                  {t(
                                    'settings.manageCurrencies.form.rate.label',
                                  )}
                                  :
                                </span>
                                <span className="text-sm">{currency.rate}</span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
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
                  label={t('settings.manageCurrencies.form.symbol.label')}
                  name="symbol"
                  placeholder={t(
                    'settings.manageCurrencies.form.symbol.placeholder',
                  )}
                  disabled={disabled || isCreating || isUpdating}
                />
                <Input
                  label={t('settings.manageCurrencies.form.code.label')}
                  name="code"
                  placeholder={t(
                    'settings.manageCurrencies.form.code.placeholder',
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
                <Input
                  label={t('settings.manageCurrencies.form.rate.label')}
                  name="rate"
                  type="number"
                  step="0.01"
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
