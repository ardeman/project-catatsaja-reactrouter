import { useLoaderData } from 'react-router'

import { TNoteResponse } from '~/lib/types/note'

export const useGetNotes = () => {
  const data = useLoaderData() as { notes: TNoteResponse[] }
  return { data: data.notes }
}
