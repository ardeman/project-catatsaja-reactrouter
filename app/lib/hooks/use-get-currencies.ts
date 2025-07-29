import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
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
        const currenciesReference = collection(
          database,
          'users',
          user.uid,
          'currencies',
        )

        // Try with orderBy first, fallback to simple query if it fails
        let currenciesQuery
        try {
          currenciesQuery = query(
            currenciesReference,
            orderBy('createdAt', 'desc'),
          )
        } catch (orderByError) {
          // eslint-disable-next-line no-console
          console.warn('OrderBy failed, using simple query:', orderByError)
          currenciesQuery = query(currenciesReference)
        }

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
        console.error('Error setting up currencies listener:', error)
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
