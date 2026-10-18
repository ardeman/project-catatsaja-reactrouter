import { initializeApp } from 'firebase-admin/app'
import { setGlobalOptions } from 'firebase-functions/v2'

// Cloud Functions that send push notifications (invitations, health
// reminders). They run beside the Firestore database (asia-southeast2), as
// its triggers must, and never read what an item says.
initializeApp()

setGlobalOptions({ region: 'asia-southeast2', maxInstances: 5 })
