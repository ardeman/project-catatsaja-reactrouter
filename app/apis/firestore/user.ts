import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile as updateProfileAuth,
  type User,
} from 'firebase/auth'
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'

import { auth, firestore } from '~/lib/configs/firebase'
import {
  TCurrencyFormatRequest,
  TUpdateAppearanceRequest,
  TUpdateProfileRequest,
} from '~/lib/types/settings'
import { TSignInRequest, TSignUpRequest, TUserResponse } from '~/lib/types/user'
import { waitForAuth } from '~/lib/utils/wait-for-auth'

// Function to fetch user data from Firestore
// Creates the profile document when it is missing, e.g. when sign-up stopped
// halfway. Without it the account cannot be found for sharing or create
// anything (the rules require it).
const ensureUserProfile = async (user: User) => {
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  const reference = doc(firestore, 'users', user.uid)
  const snap = await getDoc(reference)
  if (snap.exists()) return snap
  await setDoc(reference, {
    displayName: user.displayName || user.email?.split('@')[0] || '',
    email: user.email,
    photoURL: user.photoURL || '',
    createdAt: new Date(),
  })
  return await getDoc(reference)
}

export const fetchUserData = async () => {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.')
  }
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  const user = auth.currentUser ?? (await waitForAuth())
  if (!user) {
    throw new Error('No authenticated user found.')
  }

  const snap = await ensureUserProfile(user)
  const data = snap.data()
  return {
    ...data,
    uid: snap.id,
  } as TUserResponse
}

export const fetchUsersByEmail = async (email: string) => {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.')
  }
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }

  const usersReference = collection(firestore, 'users')
  const usersQuery = query(
    usersReference,
    where('email', '==', email),
    where('email', '!=', auth.currentUser?.email),
  )
  const snap = await getDocs(usersQuery)

  return snap.docs.map((document) => {
    const data = document.data()
    return {
      ...data,
      uid: document.id,
    } as TUserResponse
  })
}

// Profiles of the given users only, in batches of 30 (Firestore's `in` limit).
export const fetchUsersByIds = async (uids: string[]) => {
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  const database = firestore
  const batches: string[][] = []
  for (let index = 0; index < uids.length; index += 30) {
    batches.push(uids.slice(index, index + 30))
  }
  const snaps = await Promise.all(
    batches.map((batch) =>
      getDocs(
        query(collection(database, 'users'), where(documentId(), 'in', batch)),
      ),
    ),
  )
  return snaps.flatMap((snap) =>
    snap.docs.map(
      (document) => ({ ...document.data(), uid: document.id }) as TUserResponse,
    ),
  )
}

export const updateProfile = async (userData: TUpdateProfileRequest) => {
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const reference = doc(firestore, 'users', auth?.currentUser.uid)
  return await updateDoc(reference, {
    ...userData,
    updatedAt: new Date(),
  })
}

export const updateAppearance = async (data: TUpdateAppearanceRequest) => {
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const reference = doc(firestore, 'users', auth.currentUser.uid)
  return await updateDoc(reference, {
    ...data,
    updatedAt: new Date(),
  })
}

export const updateCurrencyFormat = async (data: TCurrencyFormatRequest) => {
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const reference = doc(firestore, 'users', auth.currentUser.uid)
  return await updateDoc(reference, {
    currencyFormat: data,
    updatedAt: new Date(),
  })
}

export const login = async (userData: TSignInRequest) => {
  const { email, password } = userData
  if (!auth || !firestore) {
    throw new Error('Firebase is not initialized.')
  }

  // Sign in with email and password
  const result = await signInWithEmailAndPassword(auth, email, password)
  const user = result.user

  if (user) {
    const snap = await ensureUserProfile(user)
    const userData = snap.data()

    // Update the email in Firestore if it's different
    if (userData && user.email && userData.email !== user.email) {
      return await updateDoc(snap.ref, {
        email,
        updatedAt: new Date(),
      })
    }
  }
}

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider()
  if (!auth || !firestore) {
    throw new Error('Firebase is not initialized.')
  }

  // Sign in with Google
  const result = await signInWithPopup(auth, provider)
  const user = result.user

  if (user) {
    await ensureUserProfile(user)
  }
}

export const register = async (userData: TSignUpRequest) => {
  const { email, password, displayName, language, theme, size } = userData
  if (!auth || !firestore) {
    throw new Error('Firebase is not initialized.')
  }
  // Create the user with Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  )
  const user = userCredential.user

  if (user) {
    // Update the user's profile with the display name
    await updateProfileAuth(user, {
      displayName,
    })

    // Store user data in Firestore first: the account is unusable without it
    await setDoc(doc(firestore, 'users', user.uid), {
      displayName,
      email,
      language,
      theme,
      size,
      createdAt: new Date(),
    })

    // A failed verification email must not fail the sign-up; it can be sent
    // again from the account settings.
    try {
      await sendEmailVerification(user)
    } catch {
      // ignored on purpose
    }
  } else {
    throw new Error('No user is currently signed in.')
  }
}
