import { RefreshCw } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { useIsStandalone } from '~/lib/hooks/use-install-app'

import { listenForPull } from './gesture.client'

// Only in the installed app: browsers have their own pull to refresh.
export const PullToRefresh = () => {
  const reference = useRef<HTMLDivElement>(null)
  const isStandalone = useIsStandalone()

  useEffect(
    () => (isStandalone ? listenForPull(reference.current) : undefined),
    [isStandalone],
  )

  if (!isStandalone) return
  return (
    <div
      ref={reference}
      aria-hidden
      // Waits above the top edge until pulled into view.
      className="glass-surface pointer-events-none fixed top-[calc(var(--top-inset)-2.5rem)] left-1/2 z-50 flex size-10 items-center justify-center rounded-full border text-muted-foreground opacity-0 shadow-md data-[ready=true]:text-primary"
      // Moved by the gesture, so set as a transform rather than a class.
      style={{ transform: 'translate(-50%, 0)' }}
    >
      <RefreshCw className="size-5" />
    </div>
  )
}
