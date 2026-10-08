// Paste the web app config from Firebase Console → Project settings → Your apps.
// These values identify the project; they are not passwords. Access is controlled
// by firestore.rules (only the emails listed there can read or write data).
// While apiKey is empty the app runs in demo mode and saves to this browser only.
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
}

export const firebaseEnabled = Boolean(firebaseConfig.apiKey)
