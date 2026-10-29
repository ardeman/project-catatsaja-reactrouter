import { ArrowLeft } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router'

import { Button } from '~/components/ui/button'
import { readStartPage } from '~/lib/constants/navigation'
import { useAuthUser } from '~/lib/hooks/use-auth-user'

const noSubscribe = () => () => {}
// React Router numbers the app's history entries from 0, so 0 means the tab
// opened on this page (start-up redirects replace the entry, keeping 0).
const hasAppHistory = () =>
  ((history.state as { idx?: number } | null)?.idx ?? 0) > 0

// Goes back when the page was reached inside the app; a page opened
// directly links home instead.
export const BackButton = () => {
  const { t } = useTranslation()
  // Re-renders on navigation, so the history index below is read again.
  useLocation()
  const navigate = useNavigate()
  const { data: user } = useAuthUser()
  // Browser-only: the server and the first client render use the default.
  const startPage = useSyncExternalStore(
    noSubscribe,
    readStartPage,
    () => 'notes',
  )
  const canGoBack = useSyncExternalStore(
    noSubscribe,
    hasAppHistory,
    () => false,
  )
  const label = t('actions.back')
  const icon = <ArrowLeft className="h-[1.2rem] w-[1.2rem]" />

  if (!canGoBack) {
    return (
      <Button
        asChild
        variant="outline"
        size="icon"
        aria-label={label}
        title={label}
      >
        <Link to={user ? `/${startPage}` : '/'}>{icon}</Link>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      onClick={() => navigate(-1)}
    >
      {icon}
    </Button>
  )
}
