import { useEffect } from 'react'

import { refreshFinanceSummary } from '~/apis/firestore/finance'
import { TFinanceResponse } from '~/lib/types/finance'

// Ids already refreshed in this tab, so a failed write isn't retried on
// every snapshot.
const refreshed = new Set<string>()

// An open book saved before its summary had every description gets them,
// for whoever can edit it, quietly: nothing changed for the person.
export const useRefreshFinanceSummary = (
  finance: TFinanceResponse | undefined,
  canEdit: boolean,
) => {
  const id = finance?.id
  const content = finance?.content
  // The same count as stored, so it is the summary of these very entries.
  const isMissing =
    !!finance?.summary &&
    !finance.summary.descriptions &&
    finance.summary.count === content?.length
  useEffect(() => {
    if (!id || !content || !canEdit || !isMissing || refreshed.has(id)) return
    refreshed.add(id)
    const refresh = async () => {
      try {
        await refreshFinanceSummary(id, content)
      } catch {
        // Not shown: the next save of an entry writes them anyway.
      }
    }
    void refresh()
  }, [id, content, canEdit, isMissing])
}
