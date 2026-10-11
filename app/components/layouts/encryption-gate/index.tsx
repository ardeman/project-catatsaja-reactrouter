import { ReactNode, useEffect, useRef, useState } from 'react'

import { LoadingScreen } from '~/components/base/loading-screen'
import { useEncryptOwnItems } from '~/lib/hooks/use-encrypt-own-items'
import { useEncryptionSession } from '~/lib/hooks/use-encryption-session'
import { useUserData } from '~/lib/hooks/use-get-user'
import { restoreSession } from '~/lib/utils/encryption-session'

import { SetupEncryption } from './setup'
import { Unlock } from './unlock'

export { RecoveryCode, SetupEncryption } from './setup'

// The signed-in app behind end-to-end encryption. People who use it see
// their items once this device is unlocked; new accounts set it up first;
// everyone else goes straight in, as before.
export const EncryptionGate = ({ children }: { children: ReactNode }) => {
  const { data: userData } = useUserData()
  const session = useEncryptionSession()
  const encryptOwnItems = useEncryptOwnItems()
  const [isFinishingSetup, setIsFinishingSetup] = useState(false)
  const encryptedFor = useRef<string>(undefined)
  const uid = userData?.uid
  const hasKeys = !!userData?.publicKey
  const isUnlocked = session.status === 'unlocked' && session.uid === uid

  useEffect(() => {
    if (uid && hasKeys) void restoreSession(uid)
  }, [uid, hasKeys])

  // Once per unlocked visit: the person's own plain items, encrypted where
  // everyone with access can read them encrypted.
  useEffect(() => {
    if (!uid || !hasKeys || !isUnlocked || encryptedFor.current === uid) return
    encryptedFor.current = uid
    void encryptOwnItems()
  }, [uid, hasKeys, isUnlocked, encryptOwnItems])

  if (!userData) return children

  if (isFinishingSetup || (!hasKeys && userData.encryptionRequired))
    return (
      <div className="flex flex-1 items-start justify-center p-4 md:items-center md:p-8">
        <section className="glass-surface w-full max-w-md rounded-2xl border p-6">
          <SetupEncryption
            isRequired
            onCreated={() => setIsFinishingSetup(true)}
            onDone={() => setIsFinishingSetup(false)}
          />
        </section>
      </div>
    )

  if (!hasKeys) return children

  if (isUnlocked) return children

  // Checking whether this browser kept the key.
  if (session.status === 'unknown' || session.uid !== uid)
    return (
      <LoadingScreen
        isLoading
        classname="min-h-fit flex-1"
      />
    )

  return <Unlock />
}
