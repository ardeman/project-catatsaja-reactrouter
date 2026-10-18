import { releases } from '~/content/changelog'

import { useUserData } from './use-get-user'

const MAX_SHOWN = 3

// A date as the changelog writes it (YYYY-MM-DD), in local time.
const toReleaseDate = (seconds: number) => {
  const date = new Date(seconds * 1000)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

// Releases since the newest one the person has seen (`seenRelease`), or since
// their account was made, so a new account isn't told about older ones.
export const useGetNewReleases = () => {
  const { data: user } = useUserData()
  const since =
    user?.seenRelease ??
    (user?.createdAt ? toReleaseDate(user.createdAt.seconds) : undefined)
  const unseen = since ? releases.filter((release) => release.date > since) : []
  return {
    releases: unseen.slice(0, MAX_SHOWN),
    more: Math.max(0, unseen.length - MAX_SHOWN),
    latest: unseen[0]?.date,
  }
}
