import { Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

import { Action } from '~/components/base/action'
import { SaveStatus, TSaveStatus } from '~/components/base/save-status'
import { Textarea } from '~/components/base/textarea'
import { useFinance } from '~/components/pages/finances'
import { Button } from '~/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
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
  newestFirst,
  summarize,
} from '~/lib/utils/finance'
import { getDateLabel } from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'

import { EntryForm } from './entry-form'
import { TFormProperties } from './type'

const sameJson = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b)

export const Form = (properties: TFormProperties) => {
  const { finance } = properties
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
  const { income, expense, balance } = summarize(entries)
  // Entries of this book (as edited here) and every other book, newest
  // first, for category suggestions.
  const history = newestFirst([
    ...books
      .filter((item) => item.id !== selectedFinance?.id)
      .flatMap((item) => item.content || []),
    ...entries,
  ])
  const isCreating = useRef(false)
  const [saveStatus, setSaveStatus] = useState<TSaveStatus>('idle')
  const [editing, setEditing] = useState<TFinanceEntry>()
  const [isEntryOpen, setIsEntryOpen] = useState(false)

  // Writes only what differs from the stored book, so it is safe to call at
  // any time (autosave, leaving the page, the Save button).
  const save = async () => {
    if (isReadOnly) return
    const data = getValues()
    if (selectedFinance) {
      const changes: Partial<TFinanceForm> = {}
      if (data.title !== (selectedFinance.title || ''))
        changes.title = data.title
      if (!sameJson(data.currency, selectedFinance.currency))
        changes.currency = data.currency
      if (!sameJson(data.content, selectedFinance.content || []))
        changes.content = data.content
      if (Object.keys(changes).length === 0) return
      setSaveStatus('saving')
      const isSaved = await mutateUpdateFinance({
        id: selectedFinance.id,
        ...changes,
      })
      setSaveStatus(isSaved ? 'saved' : 'error')
      return
    }
    if (isCreating.current || (!data.title && data.content.length === 0)) return
    isCreating.current = true
    const reference = await mutateCreateFinance(data)
    // Stays set after success: the page switches to the new book and this
    // form unmounts, which must not create it a second time.
    if (!reference) isCreating.current = false
    return reference
  }

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    const reference = await save()
    if (reference) navigate(`/finances/${reference.id}`, { replace: true })
  }

  useAutosave({
    save,
    watch: [watchTitle, JSON.stringify(book), JSON.stringify(entries)],
    saveWhenIdle: !!selectedFinance,
  })

  const openEntry = (entry?: TFinanceEntry) => {
    setEditing(entry)
    setIsEntryOpen(true)
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

  const formatDay = (date: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'full',
      timeZone: 'UTC',
    }).format(new Date(`${date}T00:00:00Z`))

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
      <form
        onSubmit={handleCreate}
        className="group/form is-shown mx-auto w-full max-w-3xl space-y-6"
      >
        <div className="sticky top-20 z-50 flex justify-center md:top-24">
          {finance ? (
            <Action
              className="w-full"
              buttonClassName="supports-backdrop-filter:bg-accent/20 backdrop-blur-sm"
              isOwner={isOwner}
              isEditable={isEditable}
              isPinned={isPinned}
              handleDelete={() => handleDeleteFinance({ finance })}
              handlePin={() =>
                handlePinFinance({ finance, isPinned: !isPinned })
              }
              handleShare={() => handleShareFinance({ finance })}
              handleUnlink={() => handleUnlinkFinance({ finance })}
              sharedCount={sharedCount}
              handleBack={handleBackFinance}
            />
          ) : (
            <Action
              className="w-full"
              buttonClassName="supports-backdrop-filter:bg-accent/20 backdrop-blur-sm"
              isLoading={isCreatePending}
              isCreate={true}
              handleBack={handleBackFinance}
              disabled={!isDirty}
            />
          )}
        </div>

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
            <Select
              value={book.code}
              disabled={isReadOnly || entries.length > 0}
              onValueChange={(code) => {
                const next = bookCurrencies.find(
                  (option) => option.code === code,
                )
                if (next) setValue('currency', next, { shouldDirty: true })
              }}
            >
              <SelectTrigger
                aria-label={t('finances.form.bookCurrency.label')}
                className="h-8 w-fit gap-2"
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
              </SelectContent>
            </Select>
            {entries.length > 0 && !isReadOnly && (
              <span className="text-xs">
                {t('finances.form.bookCurrency.locked')}
              </span>
            )}
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

        <dl className="grid grid-cols-2 gap-x-2 gap-y-3 rounded-xl border bg-card p-4 sm:grid-cols-3">
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
            <dd className="font-medium tabular-nums">{money(expense, book)}</dd>
          </div>
        </dl>

        {!isReadOnly && (
          <Button
            type="button"
            className="w-full gap-2"
            onClick={() => openEntry()}
          >
            <Plus className="size-4" />
            {t('finances.entry.add')}
          </Button>
        )}

        {entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('finances.entry.empty')}
          </p>
        ) : (
          groupByDate(entries).map(([date, dayEntries]) => (
            <section
              key={date}
              className="grid gap-1"
            >
              <h2 className="text-xs font-medium text-muted-foreground">
                {formatDay(date)}
              </h2>
              <ul className="grid divide-y rounded-xl border bg-card">
                {dayEntries.map((entry) => {
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
                    <li key={entry.id}>
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => openEntry(entry)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left enabled:hover:bg-muted/50 disabled:cursor-default"
                      >
                        {Icon && (
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                            <Icon className="size-4 text-muted-foreground" />
                          </span>
                        )}
                        <span className="grid min-w-0 flex-1">
                          <span className="truncate font-medium">
                            {entry.description || label}
                          </span>
                          {details.length > 0 && (
                            <span className="truncate text-xs text-muted-foreground">
                              {details.join(' · ')}
                            </span>
                          )}
                        </span>
                        <span
                          className={cn(
                            'shrink-0 font-medium tabular-nums',
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
      </form>
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
      <EntryForm
        open={isEntryOpen}
        setOpen={setIsEntryOpen}
        entry={editing}
        book={book}
        currencies={currencies}
        history={history}
        onSave={handleSaveEntry}
        onDelete={handleDeleteEntry}
      />
    </FormProvider>
  )
}
