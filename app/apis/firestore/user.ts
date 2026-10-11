import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile as updateProfileAuth,
  type User,
} from 'firebase/auth'
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

import { auth, firestore } from '~/lib/configs/firebase'
import {
  TCurrencyFormatRequest,
  TUpdateAppearanceRequest,
  TUpdateHealthSettingsRequest,
  TUpdateNavigationRequest,
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

// Keeps `userLookup/{email}` pointing at this account, so others can find it
// to share with: created for accounts made before it existed, and moved when
// the email changes. Usually nothing to write. A failure only means not being
// findable for now, so it never blocks loading the app.
const syncEmailLookup = async (user: User, lookupEmail?: string) => {
  if (!firestore) return
  const email = user.email?.toLowerCase()
  if (!email || email === lookupEmail) return
  if (lookupEmail) {
    try {
      await deleteDoc(doc(firestore, 'userLookup', lookupEmail))
    } catch {
      // Already gone, or filed by an older version: the new entry still
      // takes over below.
    }
  }
  try {
    await setDoc(doc(firestore, 'userLookup', email), { uid: user.uid })
    await updateDoc(doc(firestore, 'users', user.uid), { lookupEmail: email })
  } catch {
    // Tried again on the next load.
  }
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
  await syncEmailLookup(user, data?.lookupEmail as string | undefined)
  return {
    ...data,
    uid: snap.id,
  } as TUserResponse
}

// Finding someone by email goes through `userLookup/{email}`, which only
// holds their id and can only be read one entry at a time: profiles can't
// be listed, so nobody can download everyone's email and name.
export const fetchUsersByEmail = async (email: string) => {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.')
  }
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  const normalized = email.trim().toLowerCase()
  if (!normalized || normalized === auth.currentUser?.email?.toLowerCase())
    return []
  const lookup = await getDoc(doc(firestore, 'userLookup', normalized))
  const uid = lookup.data()?.uid as string | undefined
  if (!uid) return []
  const profile = await getDoc(doc(firestore, 'users', uid))
  return profile.exists()
    ? [{ ...profile.data(), uid: profile.id } as TUserResponse]
    : []
}

// Profiles of the given users, read one by one (profiles can't be listed).
export const fetchUsersByIds = async (uids: string[]) => {
  if (!firestore) {
    throw new Error('Firebase Firestore is not initialized.')
  }
  const database = firestore
  const snaps = await Promise.all(
    uids.map((uid) => getDoc(doc(database, 'users', uid))),
  )
  return snaps
    .filter((snap) => snap.exists())
    .map((snap) => ({ ...snap.data(), uid: snap.id }) as TUserResponse)
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

export const updateNavigation = async (data: TUpdateNavigationRequest) => {
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

export const updateHealthSettings = async (
  data: TUpdateHealthSettingsRequest,
) => {
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
