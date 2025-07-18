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
}
