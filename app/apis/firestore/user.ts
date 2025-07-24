import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithRedirect,
  updateProfile as updateProfileAuth,
} from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'

import { auth, firestore } from '~/lib/configs/firebase'
import {
  TUpdateAppearanceRequest,
  TUpdateProfileRequest,
} from '~/lib/types/settings'
import { TSignInRequest, TSignUpRequest, TUserResponse } from '~/lib/types/user'
import { waitForAuth } from '~/lib/utils/wait-for-auth'

// Function to fetch user data from Firestore
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

  const reference = doc(firestore, 'users', user.uid)
  const snap = await getDoc(reference)

  if (!snap.exists()) {
    const newUser = {
      displayName: user.displayName ?? '',
      email: user.email ?? '',
      photoURL: user.photoURL || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await setDoc(reference, newUser)
    return { ...newUser, uid: user.uid } as unknown as TUserResponse
  }

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

export const fetchUsers = async () => {
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }

  const usersReference = collection(firestore, 'users')
  const snap = await getDocs(usersReference)

  return snap.docs.map((document) => {
    const data = document.data()
    return {
      ...data,
      uid: document.id,
    } as TUserResponse
  })
}

export const updateProfile = async (userData: TUpdateProfileRequest) => {
  const { ...rest } = userData
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const reference = doc(firestore, 'users', auth?.currentUser.uid)
  return await updateDoc(reference, {
    ...rest,
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

export const login = async (userData: TSignInRequest) => {
  const { email, password } = userData
  if (!auth || !firestore) {
    throw new Error('Firebase is not initialized.')
  }

  // Sign in with email and password
  const result = await signInWithEmailAndPassword(auth, email, password)
  const user = result.user

  if (user) {
    // Check if user exists in Firestore
    const reference = doc(firestore, 'users', user.uid)
    const snap = await getDoc(reference)
    const userData = snap.data()

    // Update the email in Firestore if it's different
    if (userData && user.email && userData.email !== user.email) {
      return await updateDoc(reference, {
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

  // Sign in with Google using redirect
  await signInWithRedirect(auth, provider)
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

    // Send email verification
    await sendEmailVerification(user)

    // Store user data in Firestore
    await setDoc(doc(firestore, 'users', user.uid), {
      displayName,
      email,
      language,
      theme,
      size,
      createdAt: new Date(),
    })
  } else {
    throw new Error('No user is currently signed in.')
  }
}
