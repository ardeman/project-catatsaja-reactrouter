import {
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore'

import { auth, firestore } from '~/lib/configs/firebase'
import {
  deriveFromPassword,
  deriveFromSecret,
  fromBase64,
  generateKeyPair,
  normalizeRecoveryCode,
  openPrivateKey,
  openPrivateKeyForResealing,
  PBKDF2_ITERATIONS,
  randomBytes,
  sealPrivateKey,
  TBytes,
  toBase64,
  TSealed,
} from '~/lib/utils/crypto'
import { startSession } from '~/lib/utils/encryption-session'

// The private key, sealed three ways. In `users/{uid}/keys/main`, which
// only its owner can read. The public key is on the profile, for others.
type TPasswordSeal = TSealed & { salt: string; iterations: number }

export type TPasskeySeal = TSealed & {
  // The credential id (base64url) and the PRF input it was sealed with.
  id: string
  salt: string
  createdAt: number
}

export type TKeyring = {
  v: 1
  publicKey: string
  passphrase: TPasswordSeal
  recovery: TPasswordSeal
  passkeys?: TPasskeySeal[]
}

const requireUser = () => {
  if (!firestore) throw new Error('Firebase Firestore is not initialized.')
  const user = auth?.currentUser
  if (!user) throw new Error('No user is currently signed in.')
  return { database: firestore, uid: user.uid }
}

const keyringReference = () => {
  const { database, uid } = requireUser()
  return doc(database, 'users', uid, 'keys', 'main')
}

export const fetchKeyring = async () => {
  const snap = await getDoc(keyringReference())
  return snap.exists() ? (snap.data() as TKeyring) : undefined
}

const sealWithPassword = async (
  privateKey: CryptoKey,
  password: string,
): Promise<TPasswordSeal> => {
  const salt = randomBytes(16)
  const sealed = await sealPrivateKey(
    privateKey,
    await deriveFromPassword(password, salt),
  )
  return { ...sealed, salt: toBase64(salt), iterations: PBKDF2_ITERATIONS }
}

const openWithPassword = async (seal: TPasswordSeal, password: string) =>
  openPrivateKey(
    seal,
    await deriveFromPassword(password, fromBase64(seal.salt), seal.iterations),
  )

// Turning encryption on: a new key pair, sealed with the passphrase and the
// recovery code; the public key on the profile. This device is unlocked.
export const createKeyring = async (
  passphrase: string,
  recoveryCode: string,
) => {
  const { database, uid } = requireUser()
  const pair = await generateKeyPair()
  const keyring: TKeyring = {
    v: 1,
    publicKey: pair.publicKeyBase64,
    passphrase: await sealWithPassword(pair.privateKey, passphrase),
    recovery: await sealWithPassword(
      pair.privateKey,
      normalizeRecoveryCode(recoveryCode),
    ),
  }
  await setDoc(keyringReference(), keyring)
  await updateDoc(doc(database, 'users', uid), {
    publicKey: pair.publicKeyBase64,
  })
  // Use a non-extractable copy from here on.
  await startSession(
    uid,
    await openWithPassword(keyring.passphrase, passphrase),
    keyring.publicKey,
  )
  return keyring
}

export const unlockWithPassphrase = async (passphrase: string) => {
  const { uid } = requireUser()
  const keyring = await fetchKeyring()
  if (!keyring) throw new Error('encryption/not-set-up')
  try {
    await startSession(
      uid,
      await openWithPassword(keyring.passphrase, passphrase),
      keyring.publicKey,
    )
  } catch {
    throw new Error('encryption/wrong-passphrase')
  }
}

// The recovery code opens the key once; a new passphrase is set with it
// (the old one is the reason it was needed).
export const recoverWithCode = async (
  recoveryCode: string,
  newPassphrase: string,
) => {
  const { uid } = requireUser()
  const keyring = await fetchKeyring()
  if (!keyring) throw new Error('encryption/not-set-up')
  const code = normalizeRecoveryCode(recoveryCode)
  let extractable: CryptoKey
  try {
    extractable = await openPrivateKeyForResealing(
      keyring.recovery,
      await deriveFromPassword(
        code,
        fromBase64(keyring.recovery.salt),
        keyring.recovery.iterations,
      ),
    )
  } catch {
    throw new Error('encryption/wrong-recovery-code')
  }
  const passphrase = await sealWithPassword(extractable, newPassphrase)
  await updateDoc(keyringReference(), { passphrase })
  await startSession(
    uid,
    await openWithPassword(passphrase, newPassphrase),
    keyring.publicKey,
  )
}

// A new passphrase, given the current one.
export const changePassphrase = async (current: string, next: string) => {
  const keyring = await fetchKeyring()
  if (!keyring) throw new Error('encryption/not-set-up')
  let extractable: CryptoKey
  try {
    extractable = await openPrivateKeyForResealing(
      keyring.passphrase,
      await deriveFromPassword(
        current,
        fromBase64(keyring.passphrase.salt),
        keyring.passphrase.iterations,
      ),
    )
  } catch {
    throw new Error('encryption/wrong-passphrase')
  }
  await updateDoc(keyringReference(), {
    passphrase: await sealWithPassword(extractable, next),
  })
}

// A new recovery code replaces the old one (given the passphrase).
export const replaceRecoveryCode = async (
  passphrase: string,
  recoveryCode: string,
) => {
  const keyring = await fetchKeyring()
  if (!keyring) throw new Error('encryption/not-set-up')
  let extractable: CryptoKey
  try {
    extractable = await openPrivateKeyForResealing(
      keyring.passphrase,
      await deriveFromPassword(
        passphrase,
        fromBase64(keyring.passphrase.salt),
        keyring.passphrase.iterations,
      ),
    )
  } catch {
    throw new Error('encryption/wrong-passphrase')
  }
  await updateDoc(keyringReference(), {
    recovery: await sealWithPassword(
      extractable,
      normalizeRecoveryCode(recoveryCode),
    ),
  })
}

// --- Passkeys -------------------------------------------------------------

// The private key opened with the passphrase, readable once to seal it
// another way (a passkey). Checks the passphrase before anything else.
export const openForResealing = async (passphrase: string) => {
  const keyring = await fetchKeyring()
  if (!keyring) throw new Error('encryption/not-set-up')
  try {
    return await openPrivateKeyForResealing(
      keyring.passphrase,
      await deriveFromPassword(
        passphrase,
        fromBase64(keyring.passphrase.salt),
        keyring.passphrase.iterations,
      ),
    )
  } catch {
    throw new Error('encryption/wrong-passphrase')
  }
}

// Seals the key with a passkey's PRF output.
export const addPasskeySeal = async (
  extractable: CryptoKey,
  passkey: { id: string; salt: TBytes; secret: TBytes },
) => {
  const keyring = await fetchKeyring()
  if (!keyring) throw new Error('encryption/not-set-up')
  const sealed = await sealPrivateKey(
    extractable,
    await deriveFromSecret(passkey.secret, passkey.salt),
  )
  const seal: TPasskeySeal = {
    ...sealed,
    id: passkey.id,
    salt: toBase64(passkey.salt),
    createdAt: Date.now(),
  }
  await updateDoc(keyringReference(), {
    passkeys: [...(keyring.passkeys ?? []), seal],
  })
}

export const unlockWithPasskeySecret = async (
  keyring: TKeyring,
  seal: TPasskeySeal,
  secret: TBytes,
) => {
  const { uid } = requireUser()
  try {
    await startSession(
      uid,
      await openPrivateKey(
        seal,
        await deriveFromSecret(secret, fromBase64(seal.salt)),
      ),
      keyring.publicKey,
    )
  } catch {
    throw new Error('encryption/passkey-failed')
  }
}

export const removePasskeys = async () => {
  await updateDoc(keyringReference(), { passkeys: deleteField() })
}

// Turning encryption off (after the person's own items are plain again):
// the sealed keys and the public key go, and new accounts' "must set up"
// mark with them.
export const removeKeyring = async () => {
  const { database, uid } = requireUser()
  await updateDoc(doc(database, 'users', uid), {
    publicKey: deleteField(),
    encryptionRequired: false,
  })
  await deleteDoc(keyringReference())
}

// --- Public keys ----------------------------------------------------------

// The public keys of the given people (undefined: not turned on).
export const fetchPublicKeys = async (uids: string[]) => {
  const { database } = requireUser()
  const entries = await Promise.all(
    [...new Set(uids)].map(async (uid) => {
      const snap = await getDoc(doc(database, 'users', uid))
      return [uid, snap.data()?.publicKey as string | undefined] as const
    }),
  )
  return new Map(entries)
}
