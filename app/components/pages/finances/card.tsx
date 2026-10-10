import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Action } from '~/components/base/action'
import {
  Card as UICard,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/base/card'
import { CategoryBar } from '~/components/base/category-bar'
import { CategoryIcon } from '~/components/base/category-icon'
import { auth } from '~/lib/configs/firebase'
import { useUserData } from '~/lib/hooks/use-get-user'
import { useMoney } from '~/lib/hooks/use-money'
import { entryBookTotal, summarize } from '~/lib/utils/finance'
import { totalsByCategory } from '~/lib/utils/finance-analysis'
import { getDateLabel } from '~/lib/utils/parser'
import { cn } from '~/lib/utils/shadcn'

import { useFinance } from './context'
import { TCardProperties } from './type'

export const Card = (properties: TCardProperties) => {
  const { finance, className } = properties
  const { t, i18n } = useTranslation()
  const {
    handleDeleteFinance,
    handlePinFinance,
    handleShareFinance,
    handleUnlinkFinance,
    handleDuplicateFinance,
  } = useFinance()
  const { data: userData } = useUserData()
  const money = useMoney()
  const isPinned = finance.isPinned
  const canWrite = finance.permissions?.write?.includes(userData?.uid || '')
  const isOwner = finance.owner === userData?.uid
  const isEditable = isOwner || canWrite
  const dateLabel = getDateLabel({
    updatedAt: finance.updatedAt?.seconds,
    createdAt: finance.createdAt.seconds,
    t,
    locale: i18n.language,
  })
  const sharedCount = new Set(
    [
      ...(finance.permissions?.read || []),
      ...(finance.permissions?.write || []),
    ].filter((uid) => uid !== auth?.currentUser?.uid),
  ).size
  const entries = finance.content || []
  const { income, expense, balance } = summarize(entries)
  const spending = totalsByCategory(entries, 'expense')
  const latest = entries.toReversed().slice(0, 3)

  return (
    <UICard
      className={cn(
        className,
        'group/card relative mb-4 w-full overflow-hidden pb-9 focus-within:ring-2 focus-within:ring-ring sm:w-80 sm:pb-0',
      )}
    >
      <Action
        className="absolute right-1 bottom-1 left-1 z-20"
        isOwner={isOwner}
        isEditable={isEditable}
        isPinned={isPinned}
        handleDelete={() => handleDeleteFinance({ finance })}
        handlePin={() => handlePinFinance({ finance, isPinned: !isPinned })}
        handleShare={() => handleShareFinance({ finance })}
        handleUnlink={() => handleUnlinkFinance({ finance })}
        handleDuplicate={() => handleDuplicateFinance({ finance })}
        sharedCount={sharedCount}
      />
      <CardHeader className="pb-3">
        <CardDescription className="flex justify-between text-xs">
          <span>{dateLabel}</span>
          <span>
            {isEditable
              ? !isOwner && t('form.permissions.shared')
              : t('form.permissions.readOnly')}
          </span>
        </CardDescription>
        <CardTitle className="text-xl">
          {/* Covers the whole card; the action buttons sit above it. */}
          <Link
            to={`/finances/${finance.id}`}
            className="outline-hidden after:absolute after:inset-0 after:z-10"
          >
            {finance.title || (
              <span className="sr-only">{t('finances.untitled')}</span>
            )}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:pb-8">
        <div>
          <p className="text-xs text-muted-foreground">
            {t('finances.summary.balance')}
          </p>
          <p
            className={cn(
              'text-lg font-semibold',
              balance < 0 && 'text-destructive-text',
            )}
          >
            {money(balance, finance.currency, balance < 0)}
          </p>
          <p className="text-xs text-muted-foreground">
            <Trans
              i18nKey="finances.summary.incomeExpense"
              values={{
                income: money(income, finance.currency),
                expense: money(expense, finance.currency),
              }}
              components={{
                in: <span className="text-income" />,
                out: <span className="text-expense" />,
              }}
            />
          </p>
        </div>
        <CategoryBar segments={spending} />
        {latest.length > 0 && (
          <ul className="grid gap-1.5 text-sm">
            {latest.map((entry) => {
              const isIncome = entry.type === 'income'
              return (
                <li
                  key={entry.id}
                  className="flex min-w-0 items-center gap-2"
                >
                  <CategoryIcon category={entry.category} />
                  <span className="min-w-0 flex-1 truncate">
                    {entry.description ||
                      t(`finances.form.category.${entry.category}.label`)}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 tabular-nums',
                      isIncome ? 'text-income' : 'text-expense',
                    )}
                  >
                    {money(
                      isIncome ? entryBookTotal(entry) : -entryBookTotal(entry),
                      finance.currency,
                      true,
                    )}
                  </span>
                </li>
              )
            })}
            {entries.length > latest.length && (
              <li className="ml-6 text-xs text-muted-foreground">
                {t('tasks.more', { number: entries.length - latest.length })}
              </li>
            )}
          </ul>
        )}
      </CardContent>
    </UICard>
  )
}
