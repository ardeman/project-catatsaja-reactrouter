import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  readSeenGuides,
  rememberGuideSeen,
  screenGuides,
  TScreenGuide,
} from '~/lib/constants/screen-guide'

import { findTarget } from './find-target'
import { Tour } from './tour'

type TScreenGuideContext = {
  guide?: TScreenGuide
  setGuide: (guide?: TScreenGuide, canShowItself?: boolean) => void
  start: () => void
}

const ScreenGuideContext = createContext<TScreenGuideContext | undefined>(
  undefined,
)

// Waits this long for the page's controls (data still loading, a dialog
// open) before giving up on starting.
const waitStep = 250
const waitTries = 20

export const ScreenGuideProvider = ({ children }: { children: ReactNode }) => {
  const [guide, setPageGuide] = useState<TScreenGuide>()
  const [request, setRequest] = useState<TScreenGuide>()
  const [steps, setSteps] = useState<string[]>()

  // A guide belongs to its page: leaving the page ends it.
  const setGuide = useCallback((next?: TScreenGuide, canShowItself = true) => {
    setPageGuide(next)
    setSteps(undefined)
    setRequest(
      next && canShowItself && !readSeenGuides().includes(next)
        ? next
        : undefined,
    )
  }, [])

  // Starts once the page has settled: no dialog open, and the same controls
  // on screen twice in a row (detail pages fill in as their data loads).
  useEffect(() => {
    if (!request) return
    let tries = 0
    let previous = ''
    const timer = setInterval(() => {
      tries += 1
      const isDialogOpen = !!document.querySelector(
        '[role="dialog"], [role="alertdialog"]',
      )
      const shown = screenGuides[request].filter((target) => findTarget(target))
      const key = shown.join(',')
      if (!isDialogOpen && key === previous && shown.length > 0) {
        clearInterval(timer)
        rememberGuideSeen(request)
        setSteps(shown)
        setRequest(undefined)
        return
      }
      previous = isDialogOpen ? '' : key
      if (tries < waitTries) return
      clearInterval(timer)
      setRequest(undefined)
    }, waitStep)
    return () => clearInterval(timer)
  }, [request])

  const start = useCallback(() => setRequest(guide), [guide])
  const close = useCallback(() => setSteps(undefined), [])
  const value = useMemo(
    () => ({ guide, setGuide, start }),
    [guide, setGuide, start],
  )

  return (
    <ScreenGuideContext.Provider value={value}>
      {children}
      {guide && steps && (
        <Tour
          guide={guide}
          steps={steps}
          onClose={close}
        />
      )}
    </ScreenGuideContext.Provider>
  )
}

// Gives the page its guide, shown by itself the first time the page opens.
// `isReady` false holds that back (a note not created yet, without Share);
// Page guide in the account menu still shows what is there.
export const useScreenGuide = (guide: TScreenGuide, isReady = true) => {
  const setGuide = useContext(ScreenGuideContext)?.setGuide
  useEffect(() => {
    if (!setGuide) return
    setGuide(guide, isReady)
    return () => setGuide(undefined)
  }, [guide, isReady, setGuide])
}

// For the menus: whether this page has a guide, and showing it again.
export const useStartScreenGuide = () => {
  const context = useContext(ScreenGuideContext)
  return { canStart: !!context?.guide, start: context?.start }
}
