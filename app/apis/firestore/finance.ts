import { doc, updateDoc, deleteDoc } from 'firebase/firestore'

import { auth } from '~/lib/configs/firebase'
import { firestore } from '~/lib/configs/firestore'
import { TLiveSubscription } from '~/lib/types/common'
import {
  TCreateFinanceRequest,
  TFinanceResponse,
  TPinFinanceRequest,
  TFinancePermissionRequest,
  TUpdateFinanceRequest,
} from '~/lib/types/finance'

import {
  createShared,
  setSharedPermission,
  subscribeShared,
  subscribeSharedOne,
  unlinkShared,
  updateShared,
} from './shared-document'

export const createFinance = (data: TCreateFinanceRequest) =>
  createShared('finances', data)

export const updateFinance = (data: TUpdateFinanceRequest) => {
  const { id, ...rest } = data
  return updateShared('finances', id, rest)
}

export const pinFinance = async (data: TPinFinanceRequest) => {
  const { finance, isPinned } = data
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const pinnedBy = new Set(finance.pinnedBy || [])
  if (isPinned) {
    pinnedBy.add(auth.currentUser.uid)
  } else {
    pinnedBy.delete(auth.currentUser.uid)
  }

  const reference = doc(firestore, 'finances', finance.id)
  return await updateDoc(reference, {
    pinnedBy: [...pinnedBy],
  })
}

export const deleteFinance = async (finance: TFinanceResponse) => {
  const { id } = finance
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const reference = doc(firestore, 'finances', id)
  await deleteDoc(reference)
  return finance
}

export const unlinkFinance = (finance: TFinanceResponse) =>
  unlinkShared('finances', finance)

export const setFinancePermission = (form: TFinancePermissionRequest) =>
  setSharedPermission('finances', form.finance, form.uid, form.permission, {
    allowPlain: form.allowPlain,
  })

export const subscribeToFinances: TLiveSubscription<TFinanceResponse[]> = (
  uid,
  onData,
  onError,
) => subscribeShared<TFinanceResponse>('finances', uid, onData, onError)

export const subscribeToFinance = (
  id: string,
  uid: string,
  onData: (data: TFinanceResponse | undefined) => void,
  onError: (error: unknown) => void,
) => subscribeSharedOne<TFinanceResponse>('finances', id, uid, onData, onError)
