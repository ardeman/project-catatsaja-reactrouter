import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from 'firebase/firestore'

import { auth, firestore } from '~/lib/configs/firebase'
import {
  TCurrency,
  TCreateCurrencyRequest,
  TUpdateCurrencyRequest,
} from '~/lib/types/settings'

export const createCurrency = async (
  data: TCreateCurrencyRequest,
): Promise<TCurrency> => {
  try {
    if (!firestore) {
      throw new Error('Firestore is not initialized')
    }
    if (!auth?.currentUser) {
      throw new Error('No user is currently signed in.')
    }

    const userCurrenciesReference = collection(
      firestore,
      'users',
      auth.currentUser.uid,
      'currencies',
    )

    // If this currency is being set as default, update all other currencies to not be default
    if (data.isDefault) {
      const existingCurrenciesQuery = query(
        userCurrenciesReference,
        where('isDefault', '==', true),
      )
      const existingCurrenciesSnapshot = await getDocs(existingCurrenciesQuery)

      // Update all existing default currencies to not be default
      const updatePromises = existingCurrenciesSnapshot.docs.map((document_) =>
        updateDoc(document_.ref, { isDefault: false }),
      )
      await Promise.all(updatePromises)
    }

    const documentReference = await addDoc(userCurrenciesReference, {
      ...data,
      isDefault: data.isDefault || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    const newDocument = await getDoc(documentReference)
    return {
      id: documentReference.id,
      ...newDocument.data(),
    } as TCurrency
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating currency:', error)
    throw error
  }
}

export const updateCurrency = async (
  id: string,
  data: TUpdateCurrencyRequest,
): Promise<TCurrency> => {
  try {
    if (!firestore) {
      throw new Error('Firestore is not initialized')
    }
    if (!auth?.currentUser) {
      throw new Error('No user is currently signed in.')
    }

    const userCurrenciesReference = collection(
      firestore,
      'users',
      auth.currentUser.uid,
      'currencies',
    )

    // If this currency is being set as default, update all other currencies to not be default
    if (data.isDefault) {
      const existingCurrenciesQuery = query(
        userCurrenciesReference,
        where('isDefault', '==', true),
      )
      const existingCurrenciesSnapshot = await getDocs(existingCurrenciesQuery)

      // Update all existing default currencies to not be default
      const updatePromises = existingCurrenciesSnapshot.docs.map((document_) =>
        updateDoc(document_.ref, { isDefault: false }),
      )
      await Promise.all(updatePromises)
    }

    const documentReference = doc(
      firestore,
      'users',
      auth.currentUser.uid,
      'currencies',
      id,
    )
    await updateDoc(documentReference, {
      ...data,
      isDefault: data.isDefault || false,
      updatedAt: serverTimestamp(),
    })

    const updatedDocument = await getDoc(documentReference)
    return {
      id: updatedDocument.id,
      ...updatedDocument.data(),
    } as TCurrency
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error updating currency:', error)
    throw error
  }
}

export const deleteCurrency = async (id: string): Promise<void> => {
  try {
    if (!firestore) {
      throw new Error('Firestore is not initialized')
    }
    if (!auth?.currentUser) {
      throw new Error('No user is currently signed in.')
    }

    const documentReference = doc(
      firestore,
      'users',
      auth.currentUser.uid,
      'currencies',
      id,
    )
    await deleteDoc(documentReference)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error deleting currency:', error)
    throw error
  }
}
