type TAuthError = {
  code: string
  message?: string
  action?: string
}

export const authError: TAuthError[] = [
  {
    code: 'auth/email-already-in-use',
    action: 'signin',
  },
  {
    code: 'auth/invalid-credential',
    message: 'Invalid credential',
  },
  {
    code: 'auth/weak-password',
    message: 'Weak password',
  },
  {
    code: 'auth/popup-closed-by-user',
    message: 'Popup closed by user',
  },
  {
    code: 'auth/too-many-requests',
    message:
      'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.',
  },
  {
    code: 'auth/requires-recent-login',
    message: 'You need to sign in again to complete this operation.',
  },
  {
    code: 'auth/credential-already-in-use',
    message: 'Credential already in use',
  },
]
