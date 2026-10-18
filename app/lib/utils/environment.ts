export const environment = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY as string,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env
    .VITE_FIREBASE_AUTH_DOMAIN as string,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env
    .VITE_FIREBASE_STORAGE_BUCKET as string,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env
    .VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID as string,
  VITE_FIREBASE_MEASUREMENT_ID: import.meta.env
    .VITE_FIREBASE_MEASUREMENT_ID as string,

  VITE_GRAVATAR_API_KEY: import.meta.env.VITE_GRAVATAR_API_KEY as string,

  // The public key of the web push key pair (Cloud Messaging); push
  // notifications are off without it.
  VITE_FCM_VAPID_KEY: import.meta.env.VITE_FCM_VAPID_KEY as string | undefined,

  // Development only: 'true' connects to the local Firebase emulators
  // (`pnpm emulators`) instead of the real project.
  VITE_USE_EMULATORS: import.meta.env.VITE_USE_EMULATORS as string | undefined,

  // reCAPTCHA Enterprise site key for Firebase App Check; App Check is off
  // without it.
  VITE_APP_CHECK_SITE_KEY: import.meta.env.VITE_APP_CHECK_SITE_KEY as
    string | undefined,
  // Development only: a registered debug token shared by local browsers.
  VITE_APP_CHECK_DEBUG_TOKEN: import.meta.env.DEV
    ? (import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN as string | undefined)
    : undefined,

  // Set by `vite.config.ts` for each build (not in `.env`): compared with
  // `/version.json` to tell when a newer version is deployed.
  VITE_BUILD_ID: import.meta.env.VITE_BUILD_ID as string,
}
