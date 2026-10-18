import { initializeApp } from 'firebase-admin/app'
import { setGlobalOptions } from 'firebase-functions/v2'

// Every function runs beside the Firestore database (asia-southeast2), as
// its triggers must. Imported first by `index.ts`.
initializeApp()

setGlobalOptions({ region: 'asia-southeast2', maxInstances: 5 })
