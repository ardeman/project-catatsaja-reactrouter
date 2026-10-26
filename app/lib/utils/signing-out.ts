// Signing out closes the Firestore connection before the page reloads. From
// then on the app must not react to the person being signed out: navigating
// to the sign-in page would mount pages whose listeners fail on the closed
// connection and flash an error before the reload.
const state = { isSigningOut: false }

export const startSigningOut = () => {
  state.isSigningOut = true
}

export const stopSigningOut = () => {
  state.isSigningOut = false
}

export const signingOut = () => state.isSigningOut
