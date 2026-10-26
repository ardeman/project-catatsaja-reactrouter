import { Plus } from 'lucide-react'
import {
  type CSSProperties,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { Action } from '~/components/base/action'
import { CardStyleLayer } from '~/components/base/card-style'
import { CategoryIcon } from '~/components/base/category-icon'
import { SaveStatus, TSaveStatus } from '~/components/base/save-status'
import { Segmented } from '~/components/base/segmented'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/base/select'
import { Textarea } from '~/components/base/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '~/components/base/tooltip'
import { useFinance } from '~/components/pages/finances'
import { Button } from '~/components/ui/button'
import { auth } from '~/lib/configs/firebase'
import { fallbackCurrency } from '~/lib/constants/finance'
import { useAutosave } from '~/lib/hooks/use-autosave'
import { useCreateFinance } from '~/lib/hooks/use-create-finance'
import { useDocumentTitle } from '~/lib/hooks/use-document-title'
import { useGetCurrencies } from '~/lib/hooks/use-get-currencies'
import { useGetFinances } from '~/lib/hooks/use-get-finances'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useIsStuck } from '~/lib/hooks/use-is-stuck'
import { useMoney } from '~/lib/hooks/use-money'
import { useStoredValues } from '~/lib/hooks/use-stored-values'
import { useUndoHistory } from '~/lib/hooks/use-undo-history'
import { useUpdateArchive } from '~/lib/hooks/use-update-archive'
import { useUpdateCardStyle } from '~/lib/hooks/use-update-card-style'
import { useUpdateFinance } from '~/lib/hooks/use-update-finance'
import {
  TFinanceCurrency,
  TFinanceEntry,
  TFinanceForm,
} from '~/lib/types/finance'
import { toCardStyle } from '~/lib/utils/card-style'
import { readDraft } from '~/lib/utils/drafts'
import {
  emptyEntryFilter,
  filterEntries,
  TEntryFilter,
} from '~/lib/utils/entry-filter'
import {
  entryBookTotal,
  entryTotal,
  groupByDate,
  newestFirst,
  normalizeAccounts,
  summarize,
} from '~/lib/utils/finance'
import { knownEntries } from '~/lib/utils/finance-analysis'
import { isSameJson, mergeById } from '~/lib/utils/merge-stored'
import {
  formatExchangeRate,
  getDateLabel,
  getDefaultCurrencyFormat,
} from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'

import { Accounts } from './accounts'
import { AddCurrency } from './add-currency'
import { Analysis } from './analysis'
import { EntryFilter } from './entry-filter'
import { EntryForm } from './entry-form.client'
import { QuickAdd } from './quick-add.client'
import { Summary } from './summary'
import { TAnalysisOptions, TFormProperties } from './type'

export const Form = (properties: TFormProperties) => {
  const { finance } = properties
  const bookFormId = useId()
  const { t, i18n } = useTranslation()
  const { mutate: archive } = useUpdateArchive()
  const { mutate: updateCardStyle } = useUpdateCardStyle()
  const {
    selectedFinance,
    handleDeleteFinance,
    handlePinFinance,
    handleShareFinance,
    handleUnlinkFinance,
    handleBackFinance,
    handleDuplicateFinance,
    isDuplicatePending,
  } = useFinance()
  const { data: userData } = useUserData()
  const { data: currencies = [] } = useGetCurrencies()
  const { data: books = [] } = useGetFinances()
  const money = useMoney()
  const currencyFormat = userData?.currencyFormat ?? getDefaultCurrencyFormat()
  const navigate = useNavigate()
  // Entries or their analysis, kept in the address so Back and reloading
  // keep the choice.
  const [searchParameters, setSearchParameters] = useSearchParams()
  const view =
    finance && searchParameters.get('view') === 'analysis'
      ? 'analysis'
      : 'entries'
  const handleViewChange = (next: 'entries' | 'analysis') =>
    setSearchParameters(
      (current) => {
        if (next === 'analysis') current.set('view', 'analysis')
        else current.delete('view')
        return current
      },
      { replace: true },
    )
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

  const stored: TFinanceForm = {
    title: selectedFinance?.title || '',
    currency: selectedFinance?.currency ?? initialCurrency,
    content: selectedFinance?.content || [],
    accounts: selectedFinance?.accounts || [],
  }
  const formMethods = useForm<TFinanceForm>({ defaultValues: stored })
  // Entries and accounts merge one by one, so entries added or deleted on
  // two devices at once are all kept.
  useStoredValues({
    form: formMethods,
    stored,
    merge: { content: mergeById, accounts: mergeById },
  })
  const {
    watch,
    getValues,
    setValue,
    formState: { isDirty },
  } = formMethods
  const watchTitle = watch('title')
  useDocumentTitle(watchTitle || t('navigation.finances'))
  const book = watch('currency')
  const entries = watch('content')
  const accounts = watch('accounts')
  const isCurrencyLocked = !isReadOnly && entries.length > 0
  // Read-only people see accounts only when there are some.
  const hasAccounts = !isReadOnly || (accounts ?? []).length > 0
  const {
    reference: summaryReference,
    sentinel: summarySentinel,
    isStuck: isSummaryStuck,
  } = useIsStuck<HTMLDivElement>()
  // The floating totals' height (0 while hidden), so the "Add entry" card
  // floats below them.
  const compactSummary = useRef<HTMLDivElement>(null)
  const [summaryHeight, setSummaryHeight] = useState(0)
  useEffect(() => {
    const element = compactSummary.current
    if (!isSummaryStuck || !element) {
      setSummaryHeight(0)
      return
    }
    const observer = new ResizeObserver(() =>
      setSummaryHeight(element.offsetHeight),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [isSummaryStuck])
  // The floating totals come in with the scrolling: over their own height
  // past the card's bottom edge they rise into place and fade in, so they
  // follow the card going up instead of popping in.
  useEffect(() => {
    const element = compactSummary.current
    const wrapper = summaryReference.current
    const marker = summarySentinel.current
    if (
      !isSummaryStuck ||
      !element ||
      !wrapper ||
      !marker ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const passed =
          wrapper.getBoundingClientRect().top -
          marker.getBoundingClientRect().top
        const progress = Math.min(
          1,
          Math.max(0, passed / (element.offsetHeight || 1)),
        )
        element.style.opacity = String(progress)
        element.style.transform = `translateY(${(1 - progress) * 0.75}rem)`
      })
    }
    update()
    document.addEventListener('scroll', update, {
      capture: true,
      passive: true,
    })
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('scroll', update, { capture: true })
    }
  }, [isSummaryStuck, summaryReference, summarySentinel])
  const { income, expense, balance } = useMemo(
    () => summarize(entries),
    [entries],
  )
  // Kept while switching to Analysis and back, cleared when leaving the book.
  const [filter, setFilter] = useState<TEntryFilter>(emptyEntryFilter)
  const [analysisOptions, setAnalysisOptions] = useState<TAnalysisOptions>({
    range: emptyEntryFilter,
  })
  const shownEntries = useMemo(
    () => filterEntries(entries, filter),
    [entries, filter],
  )
  const groupedEntries = useMemo(
    () => groupByDate(shownEntries),
    [shownEntries],
  )
  // Rebuild suggestions only when entries change, not while editing a title
  // or moving between dialogs.
  const history = useMemo(
    () =>
      newestFirst([
        ...books
          .filter((item) => item.id !== selectedFinance?.id)
          .flatMap((item) => knownEntries(item)),
        ...entries,
      ]),
    [books, entries, selectedFinance?.id],
  )
  const isCreating = useRef(false)
  const [saveStatus, setSaveStatus] = useState<TSaveStatus>('idle')
  const [editing, setEditing] = useState<TFinanceEntry>()
  // Unsaved new entries and Quick add text, per book (lib/utils/drafts);
  // a waiting entry draft opens the form again.
  const entryDraftKey = finance ? `entry:${finance.id}` : undefined
  const quickAddDraftKey = finance ? `quick-add:${finance.id}` : undefined
  const isPrivate = !!finance?.isEncrypted
  const [isEntryOpen, setIsEntryOpen] = useState(
    () => !!entryDraftKey && !!readDraft(entryDraftKey),
  )
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
      if (!isSameJson(data.currency, selectedFinance.currency))
        changes.currency = data.currency
      if (!isSameJson(data.content, selectedFinance.content || []))
        changes.content = data.content
      if (!isSameJson(data.accounts, selectedFinance.accounts || []))
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

  // Copies what is on screen, after saving it, and opens the copy.
  const handleDuplicate = async () => {
    await save()
    const reference = await handleDuplicateFinance({ finance: getValues() })
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

  // Undo and redo over the whole book (title, currency, entries, accounts),
  // in steps (a pause in changes, or each entry saved).
  const current = useMemo(
    () => ({ title: watchTitle, currency: book, content: entries, accounts }),
    [watchTitle, book, entries, accounts],
  )
  const undoHistory = useUndoHistory({
    key: selectedFinance?.id ?? 'create',
    value: current,
    stored,
  })
  const restore = (next?: TFinanceForm) => {
    if (!next) return
    setEditing(undefined)
    setIsEntryOpen(false)
    for (const field of ['title', 'currency', 'content', 'accounts'] as const)
      setValue(field, next[field], { shouldDirty: true })
  }
  const historyActions = isReadOnly
    ? {}
    : {
        handleUndo: () => restore(undoHistory.undo()),
        handleRedo: () => restore(undoHistory.redo()),
        canUndo: undoHistory.canUndo,
        canRedo: undoHistory.canRedo,
      }

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

  // Entries read from a receipt, after the person checked them.
  const handleAddEntries = (added: TFinanceEntry[]) => {
    setValue('content', [...getValues('content'), ...added], {
      shouldDirty: true,
    })
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
      <div
        className="group/form is-shown mx-auto w-full max-w-3xl space-y-6"
        style={{ '--summary-height': `${summaryHeight}px` } as CSSProperties}
      >
        <CardStyleLayer
          isPage
          cardStyle={toCardStyle(finance?.cardStyle)}
        />
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
              isArchived={finance.isArchived}
              handleArchive={() =>
                archive('finances', finance.id, !finance.isArchived)
              }
              handleShare={() => handleShareFinance({ finance })}
              handleUnlink={() => handleUnlinkFinance({ finance })}
              handleDuplicate={handleDuplicate}
              isLoading={isDuplicatePending}
              sharedCount={sharedCount}
              cardStyle={toCardStyle(finance.cardStyle)}
              handleCardStyle={(next) =>
                updateCardStyle('finances', finance.id, next)
              }
              handleBack={handleBackFinance}
              {...historyActions}
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
              {...historyActions}
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
              autoFocus={!finance} // eslint-disable-line jsx-a11y/no-autofocus -- new books only; `finance` is set from the first render
              rows={1}
              readOnly={isReadOnly}
            />
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{t('finances.form.bookCurrency.label')}</span>
              {isReadOnly ? (
                // Can't be changed: shown as text, not a greyed-out list.
                <span className="font-medium text-foreground">
                  {book.code} ({book.symbol})
                </span>
              ) : isCurrencyLocked ? (
                <TooltipProvider>
                  <Tooltip
                    open={isLockHintOpen}
                    onOpenChange={setIsLockHintOpen}
                  >
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="cursor-help font-medium text-foreground underline decoration-dotted underline-offset-4"
                        // Opens on tap as well as on hover and focus.
                        onClick={(event) => {
                          event.preventDefault()
                          setIsLockHintOpen(true)
                        }}
                      >
                        {book.code} ({book.symbol})
                        <span className="sr-only">
                          {t('finances.form.bookCurrency.locked')}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t('finances.form.bookCurrency.locked')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Select
                  value={book.code}
                  onValueChange={(code) => {
                    if (code === '__add-currency') {
                      setIsAddingCurrency(true)
                      return
                    }
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
                    <SelectItem value="__add-currency">
                      <span className="flex items-center gap-2">
                        <Plus className="size-4" />
                        {t('finances.addCurrency.option')}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
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
        </form>

        {/* The totals and the accounts look like one card. `!mb-0` undoes
            the stack's spacing between the parts. */}
        <div
          className={cn(
            'glass-surface',
            hasAccounts
              ? '!mb-0 rounded-t-xl border border-b-0 bg-none px-4 pt-4 pb-3 [clip-path:inset(-2rem_-2rem_0_-2rem)]'
              : '!mb-0 rounded-xl border p-4',
          )}
        >
          <Summary
            book={book}
            income={income}
            expense={expense}
            balance={balance}
            accounts={accounts ?? []}
            isCompact={false}
          />
        </div>
        {hasAccounts && (
          <div
            // The shadow is cut at the top, so the join with the totals
            // doesn't show.
            className="glass-surface !mb-0 rounded-b-xl border border-t-0 bg-none px-4 pb-4 [clip-path:inset(0_-2rem_-2rem_-2rem)]"
          >
            <Accounts
              book={book}
              balance={balance}
              isReadOnly={isReadOnly}
            />
          </div>
        )}
        {/* Once the whole card has scrolled under the toolbar, a compact
            copy of the totals floats there. It sticks at the card's bottom
            edge and takes no height, so showing it doesn't move the page. */}
        <div
          ref={summarySentinel}
          aria-hidden="true"
          className="!mb-0 h-0"
        />
        <div
          ref={summaryReference}
          className="sticky top-[7.5rem] z-30 h-0 md:top-[8.5rem]"
        >
          {isSummaryStuck && (
            <div
              ref={compactSummary}
              className="glass-surface glass-float rounded-xl border px-3 py-2 shadow-lg motion-safe:opacity-0 sm:px-4"
            >
              <Summary
                book={book}
                income={income}
                expense={expense}
                balance={balance}
                accounts={accounts ?? []}
                isCompact
              />
            </div>
          )}
        </div>

        {finance && (
          <div className="flex justify-center">
            <Segmented
              label={t('finances.view.label')}
              value={view}
              options={[
                { value: 'entries', label: t('finances.view.entries') },
                { value: 'analysis', label: t('finances.view.analysis') },
              ]}
              onChange={handleViewChange}
            />
          </div>
        )}

        {view === 'analysis' ? (
          <Analysis
            entries={entries}
            book={book}
            options={analysisOptions}
            setOptions={setAnalysisOptions}
          />
        ) : (
          <>
            {!isReadOnly &&
              (isEntryOpen ? (
                <EntryForm
                  onClose={closeEntry}
                  book={book}
                  currencies={currencies}
                  history={history}
                  onSave={handleSaveEntry}
                  onDelete={handleDeleteEntry}
                  draftKey={entryDraftKey}
                  isPrivate={isPrivate}
                />
              ) : (
                <div
                  // Floats under the book's totals, like the entry form, so
                  // adding is always one tap away while scrolling.
                  className="motion-fade sticky top-[calc(7.5rem+var(--summary-height,0px)+0.5rem)] z-20 flex flex-wrap gap-2 md:top-[calc(8.5rem+var(--summary-height,0px)+0.5rem)]"
                >
                  <Button
                    type="button"
                    className="min-w-0 flex-1 gap-2"
                    onClick={() => openEntry()}
                  >
                    <Plus className="size-4" />
                    {t('finances.entry.add')}
                  </Button>
                  <QuickAdd
                    book={book}
                    currencies={currencies}
                    history={history}
                    onAdd={handleAddEntries}
                    draftKey={quickAddDraftKey}
                    isPrivate={isPrivate}
                  />
                </div>
              ))}

            {entries.length > 0 && (
              <EntryFilter
                filter={filter}
                setFilter={setFilter}
                entries={entries}
                shown={shownEntries}
                book={book}
              />
            )}

            {shownEntries.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t(
                  entries.length === 0
                    ? 'finances.entry.empty'
                    : 'finances.filter.empty',
                )}
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
                        isForeign
                          ? money(entryTotal(entry), entry.currency)
                          : '',
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
                            <CategoryIcon
                              category={entry.category}
                              chip
                              className="row-span-2 sm:row-span-1"
                            />
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
                                isIncome ? 'text-income' : 'text-expense',
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
          </>
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
