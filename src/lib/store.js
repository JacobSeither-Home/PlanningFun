// One small data API with two backends:
//  - Firebase: shared, real-time, cached offline on each device
//  - Demo: localStorage only (used until Firebase config is filled in)
import { firebaseConfig, firebaseEnabled } from './firebaseConfig'

const SPACE = 'main' // both people share spaces/main/...

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

/* ---------------- demo backend ---------------- */
function demoBackend() {
  const key = (c) => `pf:${c}`
  const listeners = {}
  const read = (c) => {
    try { return JSON.parse(localStorage.getItem(key(c)) || '[]') } catch { return [] }
  }
  const write = (c, rows) => {
    try { localStorage.setItem(key(c), JSON.stringify(rows)) } catch { /* storage full or blocked */ }
    ;(listeners[c] || []).forEach((fn) => fn(rows))
  }
  const user = { uid: 'demo', email: 'demo@planningfun', displayName: 'You' }
  return {
    mode: 'demo',
    onUser(cb) { cb(user); return () => {} },
    me: () => ({ uid: user.uid, name: user.displayName }),
    async signIn() {}, async signUp() {}, async signOut() {},
    subscribe(c, cb) {
      ;(listeners[c] ||= []).push(cb)
      cb(read(c))
      return () => { listeners[c] = listeners[c].filter((f) => f !== cb) }
    },
    async add(c, data) {
      const row = { id: uid(), createdAt: Date.now(), updatedAt: Date.now(), createdBy: user.email, ...data }
      write(c, [...read(c), row])
      return row.id
    },
    async update(c, id, patch) {
      write(c, read(c).map((r) => (r.id === id ? applyPatch(r, { ...patch, updatedAt: Date.now() }) : r)))
    },
    async remove(c, id) { write(c, read(c).filter((r) => r.id !== id)) },
  }
}

// Same semantics as Firestore updateDoc: 'a.b' keys set a nested field.
function applyPatch(row, patch) {
  const out = structuredClone(row)
  for (const [k, v] of Object.entries(patch)) {
    const path = k.split('.')
    let o = out
    path.slice(0, -1).forEach((p) => { o = o[p] = { ...(o[p] || {}) } })
    o[path.at(-1)] = v
  }
  return out
}

/* ---------------- firebase backend ---------------- */
async function firebaseBackend() {
  const { initializeApp } = await import('firebase/app')
  const {
    getAuth, onAuthStateChanged, signInWithEmailAndPassword,
    createUserWithEmailAndPassword, signOut, updateProfile,
  } = await import('firebase/auth')
  const {
    initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
    collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc,
  } = await import('firebase/firestore')

  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })
  const col = (c) => collection(db, 'spaces', SPACE, c)
  const who = () => auth.currentUser?.displayName || auth.currentUser?.email || ''

  return {
    mode: 'firebase',
    onUser: (cb) => onAuthStateChanged(auth, cb),
    me: () => {
      const u = auth.currentUser
      return u ? { uid: u.uid, name: u.displayName || (u.email || '').split('@')[0] } : null
    },
    signIn: (email, pw) => signInWithEmailAndPassword(auth, email, pw),
    async signUp(email, pw, name) {
      const cred = await createUserWithEmailAndPassword(auth, email, pw)
      if (name) await updateProfile(cred.user, { displayName: name })
    },
    signOut: () => signOut(auth),
    subscribe(c, cb, onError) {
      return onSnapshot(
        col(c),
        (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => onError?.(err),
      )
    },
    async add(c, data) {
      const ref = await addDoc(col(c), { createdAt: Date.now(), updatedAt: Date.now(), createdBy: who(), ...data })
      return ref.id
    },
    update: (c, id, patch) => updateDoc(doc(col(c), id), { ...patch, updatedAt: Date.now() }),
    remove: (c, id) => deleteDoc(doc(col(c), id)),
  }
}

let backendPromise
export const getBackend = () =>
  (backendPromise ||= firebaseEnabled ? firebaseBackend() : Promise.resolve(demoBackend()))
