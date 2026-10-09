// Paste the web app config from Firebase Console → Project settings → Your apps.
// These values identify the project; they are not passwords. Access is controlled
// by firestore.rules (only the emails listed there can read or write data).
// While apiKey is empty the app runs in demo mode and saves to this browser only.
export const firebaseConfig = {
  apiKey: 'AIzaSyBtQ_P_ghxiCf2XOH6lTDKsuX-QmkvRk3o',
  authDomain: 'planningfun.firebaseapp.com',
  projectId: 'planningfun',
  storageBucket: 'planningfun.firebasestorage.app',
  messagingSenderId: '397750274410',
  appId: '1:397750274410:web:e57398c9fb90218e7efd13',
}

export const firebaseEnabled = Boolean(firebaseConfig.apiKey)
