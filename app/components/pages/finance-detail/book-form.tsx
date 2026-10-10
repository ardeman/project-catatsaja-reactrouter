import { Plus } from 'lucide-react'
import { useId, useMemo, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import { Action } from '~/components/base/action'
import { SaveStatus, TSaveStatus } from '~/components/base/save-status'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/base/select'
import { Textarea } from '~/components/base/textarea'
import { useFinance } from '~/components/pages/finances'
import { Button } from '~/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import { auth } from '~/lib/configs/firebase'
import { fallbackCurrency, findCategory } from '~/lib/constants/finance'
import { useAutosave } from '~/lib/hooks/use-autosave'
import { useCreateFinance } from '~/lib/hooks/use-create-finance'
import { useGetCurrencies } from '~/lib/hooks/use-get-currencies'
import { useGetFinances } from '~/lib/hooks/use-get-finances'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useMoney } from '~/lib/hooks/use-money'
import { useUpdateFinance } from '~/lib/hooks/use-update-finance'
import {
  TFinanceCurrency,
  TFinanceEntry,
  TFinanceForm,
} from '~/lib/types/finance'
import {
  entryBookTotal,
  entryTotal,
  groupByDate,
  newEntryId,
  newestFirst,
  normalizeAccounts,
  summarize,
} from '~/lib/utils/finance'
import {
  formatExchangeRate,
  getDateLabel,
  getDefaultCurrencyFormat,
} from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'

import { Accounts } from './accounts'
import { AddCurrency } from './add-currency'
import { EntryForm } from './entry-form.client'
import { TFormProperties } from './type'

const sameJson = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b)

export const Form = (properties: TFormProperties) => {
  const { finance } = properties
  const bookFormId = useId()
  const { t, i18n } = useTranslation()
  const {
    selectedFinance,
    handleDeleteFinance,
    handlePinFinance,
    handleShareFinance,
    handleUnlinkFinance,
    handleBackFinance,
  } = useFinance()
  const { data: userData } = useUserData()
  const { data: currencies = [] } = useGetCurrencies()
  const { data: books = [] } = useGetFinances()
  const money = useMoney()
  const currencyFormat = userData?.currencyFormat ?? getDefaultCurrencyFormat()
  const navigate = useNavigate()
  const { mutate: mutateCreateFinance, isPending: isCreatePending } =
    useCreateFinance()
  const { mutate: mutateUpdateFinance } = useUpdateFinance()
  const isPinned = finance?.isPinned
  const canWrite = finance?.permissions?.write.includes(userData?.uid || '')
  const isOwner = finance?.owner === userData?.uid
  const isEditable = isOwner || canWrite
  const isReadOnly = !!finance && !isEditable
  const sharedCount = new Set(
    [
      ...(finance?.permissions?.read || []),
      ...(finance?.permissions?.write || []),
    ].filter((uid) => uid !== auth?.currentUser?.uid),
  ).size
  const dateLabel = finance
    ? getDateLabel({
        updatedAt: finance.updatedAt?.seconds,
        createdAt: finance.createdAt.seconds,
        t,
        locale: i18n.language,
      })
    : ''

  // A new book uses the person's default currency.
  const defaultCurrency = currencies.find((currency) => currency.isDefault)
  const initialCurrency: TFinanceCurrency = defaultCurrency
    ? {
        code: defaultCurrency.code,
        symbol: defaultCurrency.symbol,
        maximumFractionDigits: defaultCurrency.maximumFractionDigits,
      }
    : fallbackCurrency

  const formMethods = useForm<TFinanceForm>({
    values: {
      title: selectedFinance?.title || '',
      currency: selectedFinance?.currency ?? initialCurrency,
      content: selectedFinance?.content || [],
      accounts: selectedFinance?.accounts || [],
    },
    // Changes saved elsewhere must not overwrite what is being typed.
    resetOptions: { keepDirtyValues: true },
  })
  const {
    watch,
    getValues,
    setValue,
    formState: { isDirty },
  } = formMethods
  const watchTitle = watch('title')
  const book = watch('currency')
  const entries = watch('content')
  const accounts = watch('accounts')
  const isCurrencyLocked = !isReadOnly && entries.length > 0
  const { income, expense, balance } = useMemo(
    () => summarize(entries),
    [entries],
  )
  const groupedEntries = useMemo(() => groupByDate(entries), [entries])
  // Rebuild suggestions only when entries change, not while editing a title
  // or moving between dialogs.
  const history = useMemo(
    () =>
      newestFirst([
        ...books
          .filter((item) => item.id !== selectedFinance?.id)
          .flatMap((item) => item.content || []),
        ...entries,
      ]),
    [books, entries, selectedFinance?.id],
  )
  const isCreating = useRef(false)
  const [saveStatus, setSaveStatus] = useState<TSaveStatus>('idle')
  const [editing, setEditing] = useState<TFinanceEntry>()
  const [isEntryOpen, setIsEntryOpen] = useState(false)
  const [isAddingCurrency, setIsAddingCurrency] = useState(false)
  const [isLockHintOpen, setIsLockHintOpen] = useState(false)

  // Writes only what differs from the stored book, so it is safe to call at
  // any time (autosave, leaving the page, the Save button).
  const save = async () => {
    if (isReadOnly) return
    const values = getValues()
    const data = { ...values, accounts: normalizeAccounts(values.accounts) }
    if (selectedFinance) {
      const changes: Partial<TFinanceForm> = {}
      if (data.title !== (selectedFinance.title || ''))
        changes.title = data.title
      if (!sameJson(data.currency, selectedFinance.currency))
        changes.currency = data.currency
      if (!sameJson(data.content, selectedFinance.content || []))
        changes.content = data.content
      if (!sameJson(data.accounts, selectedFinance.accounts || []))
        changes.accounts = data.accounts
      if (Object.keys(changes).length === 0) return
      setSaveStatus('saving')
      const isSaved = await mutateUpdateFinance({
        id: selectedFinance.id,
        ...changes,
      })
      setSaveStatus(isSaved ? 'saved' : 'error')
      return
    }
    if (
      isCreating.current ||
      (!data.title && data.content.length === 0 && data.accounts.length === 0)
    )
      return
    isCreating.current = true
    const reference = await mutateCreateFinance(data)
    // Stays set after success: the page switches to the new book and this
    // form unmounts, which must not create it a second time.
    if (!reference) isCreating.current = false
    return reference
  }

  // A new book of the person's own with the same content, not shared or
  // pinned. Saves this one first so the copy has the latest changes.
  const handleDuplicate = async () => {
    await save()
    const { title, currency, content, accounts } = getValues()
    const reference = await mutateCreateFinance(
      {
        title: title ? t('finances.duplicateTitle', { title }) : '',
        currency,
        content: content.map((entry) => ({ ...entry, id: newEntryId() })),
        accounts: normalizeAccounts(accounts).map((account) => ({
          ...account,
          id: crypto.randomUUID(),
        })),
      },
      t('finances.toast.duplicated'),
    )
    if (reference) navigate(`/finances/${reference.id}`)
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    const reference = await save()
    if (reference) navigate(`/finances/${reference.id}`, { replace: true })
  }

  useAutosave({
    save,
    watch: [
      watchTitle,
      JSON.stringify(book),
      JSON.stringify(entries),
      JSON.stringify(accounts),
    ],
    saveWhenIdle: !!selectedFinance,
  })

  const openEntry = (entry?: TFinanceEntry) => {
    setEditing(entry)
    setIsEntryOpen(!entry)
  }

  const closeEntry = () => {
    setEditing(undefined)
    setIsEntryOpen(false)
  }

  const handleSaveEntry = (entry: TFinanceEntry) => {
    const current = getValues('content')
    const exists = current.some((item) => item.id === entry.id)
    setValue(
      'content',
      exists
        ? current.map((item) => (item.id === entry.id ? entry : item))
        : [...current, entry],
      { shouldDirty: true },
    )
  }

  const handleDeleteEntry = (id: string) => {
    setValue(
      'content',
      getValues('content').filter((item) => item.id !== id),
      { shouldDirty: true },
    )
  }

  const dayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'full',
        timeZone: 'UTC',
      }),
    [i18n.language],
  )
  const formatDay = (date: string) =>
    dayFormatter.format(new Date(`${date}T00:00:00Z`))

  // The book currency, plus the person's own currencies to choose from.
  const bookCurrencies = [
    book,
    ...currencies.map(({ code, symbol, maximumFractionDigits }) => ({
      code,
      symbol,
      maximumFractionDigits,
    })),
  ].filter(
    (option, index, all) =>
      all.findIndex((other) => other.code === option.code) === index,
  )

  return (
    <FormProvider {...formMethods}>
      <div className="group/form is-shown mx-auto w-full max-w-3xl space-y-6">
        <div className="sticky top-20 z-40 flex justify-center md:top-24">
          {finance ? (
            <Action
              className="w-full"
              buttonClassName="glass-surface"
              isOwner={isOwner}
              isEditable={isEditable}
              isPinned={isPinned}
              handleDelete={() => handleDeleteFinance({ finance })}
              handlePin={() =>
                handlePinFinance({ finance, isPinned: !isPinned })
              }
              handleShare={() => handleShareFinance({ finance })}
              handleUnlink={() => handleUnlinkFinance({ finance })}
              handleDuplicate={handleDuplicate}
              isLoading={isCreatePending}
              sharedCount={sharedCount}
              handleBack={handleBackFinance}
            />
          ) : (
            <Action
              className="w-full"
              buttonClassName="glass-surface"
              isLoading={isCreatePending}
              isCreate={true}
              formId={bookFormId}
              handleBack={handleBackFinance}
              disabled={!isDirty}
            />
          )}
        </div>

        <form
          id={bookFormId}
          onSubmit={handleCreate}
          className="space-y-6"
        >
          <div className="grid gap-3">
            <Textarea
              name="title"
              placeholder={t('finances.form.title.label')}
              inputClassName="border-none ring-0 text-xl md:text-xl font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none p-0 focus-visible:shadow-none focus:outline-hidden resize-none min-h-0"
              autoFocus={!selectedFinance} // eslint-disable-line jsx-a11y/no-autofocus
              rows={1}
              readOnly={isReadOnly}
            />
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{t('finances.form.bookCurrency.label')}</span>
              <TooltipProvider>
                <Tooltip
                  open={isCurrencyLocked && isLockHintOpen}
                  onOpenChange={setIsLockHintOpen}
                >
                  <TooltipTrigger asChild>
                    {/* A disabled control gets no pointer events, so the
                        wrapper shows why it is locked, on hover or tap. */}
                    <span
                      className="inline-flex rounded-md"
                      onClick={(event) => {
                        if (!isCurrencyLocked) return
                        event.preventDefault()
                        setIsLockHintOpen(true)
                      }}
                    >
                      <Select
                        value={book.code}
                        disabled={isReadOnly || isCurrencyLocked}
                        onValueChange={(code) => {
                          if (code === '__add-currency') {
                            setIsAddingCurrency(true)
                            return
                          }
                          const next = bookCurrencies.find(
                            (option) => option.code === code,
                          )
                          if (next)
                            setValue('currency', next, { shouldDirty: true })
                        }}
                      >
                        <SelectTrigger
                          aria-label={t('finances.form.bookCurrency.label')}
                          className="h-8 w-fit gap-2 disabled:pointer-events-none"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {bookCurrencies.map((option) => (
                            <SelectItem
                              key={option.code}
                              value={option.code}
                            >
                              {option.code} ({option.symbol})
                            </SelectItem>
                          ))}
                          <SelectItem value="__add-currency">
                            <span className="flex items-center gap-2">
                              <Plus className="size-4" />
                              {t('finances.addCurrency.option')}
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {isCurrencyLocked && (
                        <span className="sr-only">
                          {t('finances.form.bookCurrency.locked')}
                        </span>
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('finances.form.bookCurrency.locked')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {currencies.length === 0 && !isReadOnly && (
                <Link
                  to="/settings/currency"
                  className="text-xs underline underline-offset-4"
                >
                  {t('finances.form.bookCurrency.setup')}
                </Link>
              )}
            </div>
          </div>

          <div className="glass-surface grid gap-3 rounded-xl border p-4">
            <dl className="grid grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-xs text-muted-foreground">
                  {t('finances.summary.balance')}
                </dt>
                <dd
                  className={cn(
                    'text-lg font-semibold tabular-nums',
                    balance < 0 && 'text-destructive',
                  )}
                >
                  {money(balance, book, balance < 0)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t('finances.summary.income')}
                </dt>
                <dd className="font-medium text-emerald-600 tabular-nums dark:text-emerald-400">
                  {money(income, book)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t('finances.summary.expense')}
                </dt>
                <dd className="font-medium tabular-nums">
                  {money(expense, book)}
                </dd>
              </div>
            </dl>

            <Accounts
              book={book}
              balance={balance}
              isReadOnly={isReadOnly}
            />
          </div>
        </form>

        {!isReadOnly &&
          (isEntryOpen ? (
            <EntryForm
              onClose={closeEntry}
              book={book}
              currencies={currencies}
              history={history}
              onSave={handleSaveEntry}
              onDelete={handleDeleteEntry}
            />
          ) : (
            <Button
              type="button"
              className="motion-fade w-full gap-2"
              onClick={() => openEntry()}
            >
              <Plus className="size-4" />
              {t('finances.entry.add')}
            </Button>
          ))}

        {entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('finances.entry.empty')}
          </p>
        ) : (
          groupedEntries.map(([date, dayEntries]) => (
            <section
              key={date}
              className="grid gap-1"
            >
              <h2 className="text-xs font-medium text-muted-foreground">
                {formatDay(date)}
              </h2>
              <ul className="glass-surface grid divide-y rounded-xl border">
                {dayEntries.map((entry) => {
                  if (!isReadOnly && editing?.id === entry.id)
                    return (
                      <li
                        key={entry.id}
                        className="min-w-0"
                      >
                        <EntryForm
                          onClose={closeEntry}
                          entry={editing}
                          book={book}
                          currencies={currencies}
                          history={history}
                          onSave={handleSaveEntry}
                          onDelete={handleDeleteEntry}
                        />
                      </li>
                    )
                  const category = findCategory(entry.category)
                  const Icon = category?.icon
                  const isIncome = entry.type === 'income'
                  const isForeign = entry.currency.code !== book.code
                  const label = t(
                    `finances.form.category.${entry.category}.label`,
                  )
                  const details = [
                    entry.description ? label : '',
                    entry.quantity === 1
                      ? ''
                      : `${entry.quantity} × ${money(entry.amount, entry.currency)}`,
                    isForeign ? money(entryTotal(entry), entry.currency) : '',
                  ].filter(Boolean)
                  return (
                    <li
                      key={entry.id}
                      className="min-w-0"
                    >
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => openEntry(entry)}
                        className="motion-enter grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 px-4 py-3 text-left enabled:hover:bg-muted/50 disabled:cursor-default sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                      >
                        {Icon && (
                          <span className="row-span-2 flex size-9 items-center justify-center rounded-full bg-muted sm:row-span-1">
                            <Icon className="size-4 text-muted-foreground" />
                          </span>
                        )}
                        <span className="col-start-2 row-start-1 grid min-w-0">
                          <span className="truncate font-medium">
                            {entry.description || label}
                          </span>
                          {details.length > 0 && (
                            <span className="truncate text-xs text-muted-foreground">
                              {details.join(' · ')}
                            </span>
                          )}
                          {isForeign && (
                            <span className="text-xs wrap-break-word text-muted-foreground">
                              {t('finances.entry.rateUsed', {
                                from: entry.currency.code,
                                to: book.code,
                                rate: formatExchangeRate(
                                  entry.rate,
                                  currencyFormat,
                                ),
                              })}
                            </span>
                          )}
                        </span>
                        <span
                          className={cn(
                            'col-start-2 row-start-2 min-w-0 text-right font-medium wrap-break-word tabular-nums sm:col-start-3 sm:row-start-1',
                            isIncome &&
                              'text-emerald-600 dark:text-emerald-400',
                          )}
                        >
                          {money(
                            isIncome
                              ? entryBookTotal(entry)
                              : -entryBookTotal(entry),
                            book,
                            true,
                          )}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))
        )}
      </div>
      <span className="flex justify-center gap-2 text-xs text-muted-foreground">
        <span>
          {dateLabel}{' '}
          {finance &&
            (isEditable
              ? !isOwner && `(${t('form.permissions.shared')})`
              : `(${t('form.permissions.readOnly')})`)}
        </span>
        <SaveStatus status={saveStatus} />
      </span>
      <AddCurrency
        open={isAddingCurrency}
        setOpen={setIsAddingCurrency}
        currencies={currencies}
        onAdded={({ code, symbol, maximumFractionDigits }) => {
          if (isReadOnly || getValues('content').length > 0) return
          setValue(
            'currency',
            { code, symbol, maximumFractionDigits },
            { shouldDirty: true },
          )
        }}
      />
    </FormProvider>
  )
}
