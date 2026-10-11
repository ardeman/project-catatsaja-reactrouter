import { fromBase64, randomBytes, TBytes } from './crypto'

// Passkeys unlock the private key through the WebAuthn PRF extension: a
// passkey gives the same secret for the same input, which seals the key.
// No server checks the passkey (it isn't a sign-in), so challenges are just
// random bytes. Needs a recent browser (Chrome, Safari 18 / iOS 18).

const fromBase64Url = (text: string): TBytes =>
  fromBase64(text.replaceAll('-', '+').replaceAll('_', '/'))

export const canUsePasskeys = () =>
  typeof globalThis.PublicKeyCredential === 'function' &&
  typeof navigator.credentials?.create === 'function'

type TPrfResults = { results?: { first?: ArrayBuffer } }

const prfSecret = (credential: Credential | null) => {
  const results = (
    credential as PublicKeyCredential | null
  )?.getClientExtensionResults() as { prf?: TPrfResults } | undefined
  const first = results?.prf?.results?.first
  return first ? new Uint8Array(first) : undefined
}

// The secret of a passkey for a given input (asks for the fingerprint, face
// or device PIN).
const evaluate = async (ids: string[], salts: Map<string, TBytes>) => {
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: randomBytes(32),
      rpId: location.hostname,
      userVerification: 'required',
      allowCredentials: ids.map((id) => ({
        type: 'public-key',
        id: fromBase64Url(id),
      })),
      extensions: {
        prf: {
          evalByCredential: Object.fromEntries(
            ids.map((id) => [id, { first: salts.get(id) ?? new Uint8Array() }]),
          ),
        },
      } as AuthenticationExtensionsClientInputs,
    },
  })
  const secret = prfSecret(credential)
  if (!credential || !secret) throw new Error('encryption/passkey-unsupported')
  return { id: (credential as PublicKeyCredential).id, secret }
}

// A new passkey for unlocking, and its secret.
export const createPasskey = async (user: {
  uid: string
  email: string
  displayName: string
}) => {
  const salt = randomBytes(32)
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: randomBytes(32),
      rp: { name: 'Catat Saja', id: location.hostname },
      user: {
        id: new TextEncoder().encode(user.uid),
        name: user.email,
        displayName: user.displayName || user.email,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
      extensions: {
        prf: { eval: { first: salt } },
      } as AuthenticationExtensionsClientInputs,
    },
  })
  if (!credential) throw new Error('encryption/passkey-unsupported')
  const id = (credential as PublicKeyCredential).id
  const extension = (
    credential as PublicKeyCredential
  ).getClientExtensionResults() as { prf?: { enabled?: boolean } & TPrfResults }
  if (extension.prf?.enabled === false)
    throw new Error('encryption/passkey-unsupported')
  // Some passkeys give the secret when created, others only when used.
  let secret = prfSecret(credential)
  if (!secret) {
    const evaluated = await evaluate([id], new Map([[id, salt]]))
    secret = evaluated.secret
  }
  return { id, salt, secret }
}

// Unlocking: the secret of whichever of the person's passkeys they use.
export const readPasskeySecret = (passkeys: { id: string; salt: string }[]) =>
  evaluate(
    passkeys.map((passkey) => passkey.id),
    new Map(passkeys.map((passkey) => [passkey.id, fromBase64(passkey.salt)])),
  )
