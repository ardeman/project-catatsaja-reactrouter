import { CalculatorIcon, Check, Plus } from 'lucide-react'
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
import { normalizeBudgets } from '~/lib/utils/budgets'
import { toCardStyle } from '~/lib/utils/card-style'
import { normalizeGroups } from '~/lib/utils/category-groups'
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
import { normalizeKeywords } from '~/lib/utils/keywords'
import { isSameJson, mergeById } from '~/lib/utils/merge-stored'
import {
  formatExchangeRate,
  getDateLabel,
  getDefaultCurrencyFormat,
} from '~/lib/utils/parser'
import { normalizeGoals, normalizePayday } from '~/lib/utils/savings-goals'
import { cn } from '~/lib/utils/shadcn'

import { Accounts } from './accounts'
import { AddCurrency } from './add-currency'
import { Analysis } from './analysis'
import { Calculator } from './calculator'
import { EntryFilter } from './entry-filter'
import { EntryForm } from './entry-form.client'
import { QuickAdd } from './quick-add.client'
import { Summary, TSummaryPart } from './summary'
import { TAnalysisOptions, TFormProperties } from './type'

// While the Add buttons float over the entries, the day showing just below
// them, so a new entry lands where the person scrolled to. Undefined (today)
// while they still sit above the list.
const dayBelowDock = () => {
  const dock = document.querySelector('[data-entry-dock]')
  const next = dock?.nextElementSibling
  if (!dock || !next) return
  const bottom = dock.getBoundingClientRect().bottom
  if (next.getBoundingClientRect().top >= bottom) return
  const days = document.querySelectorAll<HTMLElement>('[data-entry-date]')
  const below = [...days].find(
    (day) => day.getBoundingClientRect().bottom > bottom,
  )
  return below?.dataset.entryDate
}

export const Form = (properties: TFormProperties) => {
  const { finance } = properties
  const bookFormId = useId()
  const { t, i18n } = useTranslation()
  const { mutate: archive } = useUpdateArchive()
  const { mutate: updateCardStyle } = useUpdateCardStyle()
  const {
    selectedFinance,
    handleDeleteFinance,
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
    categoryGroups: selectedFinance?.categoryGroups || [],
    budgets: selectedFinance?.budgets || [],
    goals: selectedFinance?.goals || [],
    payday: selectedFinance?.payday ?? null,
    keywords: selectedFinance?.keywords || [],
  }
  const formMethods = useForm<TFinanceForm>({ defaultValues: stored })
  // Entries, accounts, groups, budgets, goals and keywords merge one by
  // one, so those added or deleted on two devices at once are all kept.
  useStoredValues({
    form: formMethods,
    stored,
    merge: {
      content: mergeById,
      accounts: mergeById,
      categoryGroups: mergeById,
      budgets: mergeById,
      goals: mergeById,
      keywords: mergeById,
    },
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
  const categoryGroups = watch('categoryGroups')
  const budgets = watch('budgets')
  const goals = watch('goals')
  const payday = watch('payday')
  const keywords = watch('keywords')
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
  const totalsCard = useRef<HTMLDivElement>(null)
  const accountsCard = useRef<HTMLDivElement>(null)
  // A part of the floating totals scrolls back to where it's shown in full.
  const handleSummarySelect = (part: TSummaryPart) => {
    const target =
      part === 'difference' ? accountsCard.current : totalsCard.current
    target?.scrollIntoView({
      block: 'start',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    })
  }
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
  // Entries ticked by their icon add up in the totals; nothing is saved.
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const selected = useMemo(() => {
    const ids = new Set(selectedIds)
    const chosen = entries.filter((entry) => ids.has(entry.id))
    return { count: chosen.length, total: summarize(chosen).balance }
  }, [entries, selectedIds])
  const toggleSelected = (id: string) =>
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  // The floating calculator's calculation; undefined while it's closed.
  const [calculation, setCalculation] = useState<string>()
  const addToCalculation = (total: number) => {
    const value = String(Number(total.toFixed(book.maximumFractionDigits ?? 2)))
    setCalculation((current) => {
      if (!current) return value
      return /[+\-*/(]$/.test(current) || value.startsWith('-')
        ? `${current}${value}`
        : `${current}+${value}`
    })
  }
  // New entries scroll into view just below the floating form (or the Add
  // buttons), so the person sees where they landed.
  const [addedIds, setAddedIds] = useState<string[]>([])
  useEffect(() => {
    if (addedIds.length === 0) return
    // The rows come in list order, so the first is the topmost.
    const row = document.querySelector(
      addedIds.map((id) => `[data-entry-id="${CSS.escape(id)}"]`).join(','),
    )
    if (!row) {
      // Wait for the list to catch up, unless the filter hides the entries.
      if (entries.some(({ id }) => addedIds.includes(id))) setAddedIds([])
      return
    }
    setAddedIds([])
    // The row scrolls itself into view, with a margin that clears the dock.
    if (!(row instanceof HTMLElement)) return
    const dock = document.querySelector('[data-entry-dock]')
    row.style.scrollMarginTop = `${(dock?.getBoundingClientRect().bottom ?? 0) + 8}px`
    row.scrollIntoView({
      block: 'start',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    })
    row.style.scrollMarginTop = ''
  }, [addedIds, groupedEntries, entries])
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
  // A new entry's date: the day under the floating Add button.
  const [entryDate, setEntryDate] = useState<string>()
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
    const data = {
      ...values,
      accounts: normalizeAccounts(values.accounts),
      categoryGroups: normalizeGroups(values.categoryGroups),
      budgets: normalizeBudgets(values.budgets),
      goals: normalizeGoals(values.goals),
      payday: normalizePayday(values.payday),
      keywords: normalizeKeywords(values.keywords),
    }
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
      if (
        !isSameJson(data.categoryGroups, selectedFinance.categoryGroups || [])
      )
        changes.categoryGroups = data.categoryGroups
      if (!isSameJson(data.budgets, selectedFinance.budgets || []))
        changes.budgets = data.budgets
      if (!isSameJson(data.goals, selectedFinance.goals || []))
        changes.goals = data.goals
      if (data.payday !== (selectedFinance.payday ?? null))
        changes.payday = data.payday
      if (!isSameJson(data.keywords, selectedFinance.keywords || []))
        changes.keywords = data.keywords
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
      JSON.stringify(categoryGroups),
      JSON.stringify(budgets),
      JSON.stringify(goals),
      payday,
      JSON.stringify(keywords),
    ],
    saveWhenIdle: !!selectedFinance,
  })

  // Undo and redo over the whole book (title, currency, entries, accounts,
  // groups, budgets, goals, keywords), in steps (a pause in changes, or
  // each entry saved).
  const current = useMemo(
    () => ({
      title: watchTitle,
      currency: book,
      content: entries,
      accounts,
      categoryGroups,
      budgets,
      goals,
      payday,
      keywords,
    }),
    [
      watchTitle,
      book,
      entries,
      accounts,
      categoryGroups,
      budgets,
      goals,
      payday,
      keywords,
    ],
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
    for (const field of [
      'title',
      'currency',
      'content',
      'accounts',
      'categoryGroups',
      'budgets',
      'goals',
      'payday',
      'keywords',
    ] as const)
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
    if (!entry) setEntryDate(dayBelowDock())
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
    if (!exists) setAddedIds([entry.id])
  }

  // Entries read from a receipt, after the person checked them.
  const handleAddEntries = (added: TFinanceEntry[]) => {
    setValue('content', [...getValues('content'), ...added], {
      shouldDirty: true,
    })
    setAddedIds(added.map(({ id }) => id))
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
        <div className="sticky top-[calc(1rem+env(safe-area-inset-top))] z-40 flex justify-center md:top-24">
          {finance ? (
            <Action
              className="w-full"
              buttonClassName="glass-surface"
              isOwner={isOwner}
              isEditable={isEditable}
              handleDelete={() => handleDeleteFinance({ finance })}
              isArchived={finance.isArchived}
              handleArchive={() =>
                archive('finances', finance.id, !finance.isArchived)
              }
              handleShare={() => handleShareFinance({ finance })}
              handleUnlink={() => handleUnlinkFinance({ finance })}
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
          ref={totalsCard}
          className={cn(
            'glass-surface scroll-mt-[4.5rem] md:scroll-mt-[9.5rem]',
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
            selected={selected}
            onClearSelected={() => setSelectedIds([])}
            onCalculate={addToCalculation}
          />
        </div>
        {hasAccounts && (
          <div
            ref={accountsCard}
            // The shadow is cut at the top, so the join with the totals
            // doesn't show.
            className="glass-surface !mb-0 scroll-mt-[4.5rem] rounded-b-xl border border-t-0 bg-none px-4 pb-4 [clip-path:inset(0_-2rem_-2rem_-2rem)] md:scroll-mt-[9.5rem]"
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
          className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 h-0 md:top-[8.5rem]"
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
                onSelect={handleSummarySelect}
                selected={selected}
                onClearSelected={() => setSelectedIds([])}
                onCalculate={addToCalculation}
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
            isReadOnly={isReadOnly}
            books={books.filter((item) => item.id !== finance?.id)}
            currencies={currencies}
          />
        ) : (
          <>
            {!isReadOnly &&
              (isEntryOpen ? (
                <EntryForm
                  onClose={closeEntry}
                  date={entryDate}
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
                  data-entry-dock
                  className="motion-fade sticky top-[calc(3.5rem+env(safe-area-inset-top)+var(--summary-height,0px)+0.5rem)] z-20 flex flex-wrap gap-2 md:top-[calc(8.5rem+var(--summary-height,0px)+0.5rem)]"
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
                actions={
                  <Button
                    type="button"
                    variant={calculation === undefined ? 'ghost' : 'secondary'}
                    size="icon"
                    className="size-8"
                    aria-label={t('finances.calculator.open')}
                    title={t('finances.calculator.open')}
                    aria-pressed={calculation !== undefined}
                    onClick={() =>
                      setCalculation((current) =>
                        current === undefined ? '' : undefined,
                      )
                    }
                  >
                    <CalculatorIcon className="size-4" />
                  </Button>
                }
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
                  data-entry-date={date}
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
                      const isSelected = selectedIds.includes(entry.id)
                      const selectLabel = t(
                        isSelected
                          ? 'finances.selected.remove'
                          : 'finances.selected.add',
                        { name: entry.description || label },
                      )
                      return (
                        <li
                          key={entry.id}
                          data-entry-id={entry.id}
                          className={cn(
                            'relative min-w-0',
                            isSelected && 'bg-primary/10',
                          )}
                        >
                          {/* The icon ticks the entry for the selected sum.
                              It sits over the row's button, as buttons can't
                              be nested. */}
                          <button
                            type="button"
                            aria-pressed={isSelected}
                            aria-label={selectLabel}
                            title={selectLabel}
                            onClick={() => toggleSelected(entry.id)}
                            className="absolute top-1/2 left-4 z-10 -translate-y-1/2 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          >
                            {isSelected ? (
                              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check className="size-4" />
                              </span>
                            ) : (
                              <CategoryIcon
                                category={entry.category}
                                chip
                              />
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={isReadOnly}
                            onClick={() => openEntry(entry)}
                            className="motion-enter grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 px-4 py-3 text-left enabled:hover:bg-muted/50 disabled:cursor-default sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                          >
                            <span
                              aria-hidden="true"
                              className="row-span-2 size-9 sm:row-span-1"
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
      {calculation !== undefined && (
        <Calculator
          expression={calculation}
          setExpression={setCalculation}
          className="fixed right-3 bottom-[calc(4.5rem+var(--nav-bottom))] z-40 md:right-6 md:bottom-6"
        />
      )}
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
