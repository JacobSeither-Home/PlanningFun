import { useState } from 'react'
import { useBackend } from '../lib/hooks'

const MESSAGES = {
  'auth/invalid-credential': 'That email and password don’t match. Check both and try again.',
  'auth/invalid-email': 'That doesn’t look like an email address.',
  'auth/email-already-in-use': 'That email already has an account. Sign in instead.',
  'auth/weak-password': 'Use at least 6 characters for the password.',
  'auth/too-many-requests': 'Too many tries. Wait a minute, then try again.',
  'auth/network-request-failed': 'No connection. Check your internet and try again.',
}

export default function SignIn() {
  const be = useBackend()
  const [mode, setMode] = useState('in')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      if (mode === 'in') await be.signIn(email.trim(), pw)
      else await be.signUp(email.trim(), pw, name.trim())
    } catch (ex) {
      setErr(MESSAGES[ex.code] || ex.message)
    } finally { setBusy(false) }
  }

  return (
    <div className="signin">
      <form className="signin-card" onSubmit={submit}>
        <img src="./icon.svg" alt="" width="72" height="72" />
        <h1>PlanningFun</h1>
        <p className="muted">Ideas, plans and the watch list, shared between the two of you.</p>
        {mode === 'up' && (
          <label className="field">
            <span>Your first name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" required />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'} minLength={6} required />
        </label>
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn primary wide" disabled={busy}>
          {busy ? 'One sec…' : mode === 'in' ? 'Sign in' : 'Create account'}
        </button>
        <button type="button" className="link" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setErr('') }}>
          {mode === 'in' ? 'First time here? Create an account' : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
