import {
  collection,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'

import { auth, firestore } from '~/lib/configs/firebase'
import { TCurrency } from '~/lib/types/settings'
import { waitForAuth } from '~/lib/utils/wait-for-auth'

export const useGetCurrencies = () => {
  const [data, setData] = useState<TCurrency[]>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!firestore) return
    const database = firestore
    let unsubscribe: () => void

    const listen = async () => {
      const user = auth?.currentUser ?? (await waitForAuth())
      if (!user) {
        setData([])
        setIsLoading(false)
        return
      }

      try {
        // First, check if the collection exists and has documents
        const currenciesReference = collection(
          database,
          'users',
          user.uid,
          'currencies',
        )
        const initialSnapshot = await getDocs(currenciesReference)

        if (initialSnapshot.empty) {
          // If collection is empty, set data to empty array and stop loading
          setData([])
          setIsLoading(false)
          return
        }

        // If collection has documents, set up the listener
        const currenciesQuery = query(
          currenciesReference,
          orderBy('createdAt', 'desc'),
        )

        unsubscribe = onSnapshot(
          currenciesQuery,
          (snap) => {
            const result = snap.docs.map((document) => {
              const currencyData = document.data()
              return {
                ...currencyData,
                id: document.id,
              } as TCurrency
            })
            setData(result)
            setIsLoading(false)
          },
          (error) => {
            // eslint-disable-next-line no-console
            console.error('Error listening to currencies:', error)
            setData([])
            setIsLoading(false)
          },
        )
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error checking currencies collection:', error)
        setData([])
        setIsLoading(false)
      }
    }

    void listen()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  return { data, isLoading }
}
