import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile as updateProfileAuth,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

import { auth, firestore } from '~/lib/configs' // Assuming your Firestore is configured here
import {
  TSignInRequest,
  TSignUpRequest,
  TUpdateProfileRequest,
} from '~/lib/types'

// Function to fetch user data from Firestore
export const fetchUserData = async () => {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.')
  }
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  const user = auth.currentUser
  if (!user) {
    throw new Error('No authenticated user found.')
  }

  const ref = doc(firestore, 'users', user.uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    throw new Error('User data not found in Firestore.')
  }

  return snap.data()
}

export const updateProfile = async (userData: TUpdateProfileRequest) => {
  const { ...rest } = userData
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  if (!auth?.currentUser) {
    throw new Error('No user is currently signed in.')
  }
  const ref = doc(firestore, 'users', auth?.currentUser.uid)
  return await updateDoc(ref, {
    ...rest,
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
    const ref = doc(firestore, 'users', user.uid)
    const snap = await getDoc(ref)
    const userData = snap.data()

    // Update the email in Firestore if it's different
    if (userData && user.email && userData.email !== user.email) {
      return await updateDoc(ref, {
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
    // Check if user exists in Firestore
    const ref = doc(firestore, 'users', user.uid)
    const snap = await getDoc(ref)

    // If user data doesn't exist, store it
    if (!snap.exists()) {
      await setDoc(ref, {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL || '',
        createdAt: new Date(),
      })
    }
  }
}

export const register = async (userData: TSignUpRequest) => {
  const { email, password, displayName } = userData
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
      displayName: displayName,
    })

    // Send email verification
    await sendEmailVerification(user)

    // Store user data in Firestore
    await setDoc(doc(firestore, 'users', user.uid), {
      displayName: displayName,
      email: email,
      createdAt: new Date(),
    })
  } else {
    throw new Error('No user is currently signed in.')
  }
}
