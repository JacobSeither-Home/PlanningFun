import { useState } from 'react'
import Sheet from './Sheet'
import { useBackend } from '../lib/hooks'
import { MONTH_THEMES } from '../lib/theme'
import { SECTIONS } from '../lib/constants'
import { search, details } from '../lib/tmdb'

export default function SettingsSheet({ user, monthColors, setMonthColors, templates, settings, watch, onClose }) {
  const be = useBackend()
  const now = MONTH_THEMES[new Date().getMonth()]
  const savedKey = settings?.tmdbKey || ''
  const [key, setKey] = useState(savedKey)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  const saveKey = async () => {
    setStatus('')
    const k = key.trim()
    if (k) {
      try { await search(k, 'Casablanca') } catch (e) { setStatus(e.message); return }
    }
    await be.set('settings', 'shared', { tmdbKey: k })
    setStatus(k ? 'Saved. New titles will show posters and where to watch.' : 'Removed.')
  }

  const lookUpAll = async () => {
    const k = savedKey
    const todo = watch.filter((w) => !w.tmdbId)
    if (!k || !todo.length) return
    setBusy(true); let found = 0
    for (const [i, w] of todo.entries()) {
      setStatus(`Looking up ${i + 1} of ${todo.length}…`)
      try {
        const [m] = await search(k, w.title)
        if (m) {
          const d = await details(k, m)
          // don't overwrite a where-to-watch you typed yourself
          await be.update('watch', w.id, { ...d, where: w.where || d.where, kind: w.kind || d.kind })
          found++
        }
      } catch (e) { setStatus(e.message); setBusy(false); return }
    }
    setBusy(false)
    setStatus(`Matched ${found} of ${todo.length} titles.`)
  }

  return (
    <Sheet title="Settings" onClose={onClose}>
      <h2 className="sheet-title">Settings</h2>

      <section className="set-sec">
        <h3>Monthly colors</h3>
        <p className="muted small">Each month gets its own accent colors. The menu stays the same.
          This month: {now.words}. Applies on this device only.</p>
        <div className="row">
          <div className="seg small" role="radiogroup" aria-label="Monthly colors">
            <button role="radio" aria-checked={monthColors} onClick={() => setMonthColors(true)}>On</button>
            <button role="radio" aria-checked={!monthColors} onClick={() => setMonthColors(false)}>Off</button>
          </div>
          <span className="swatches" aria-hidden="true">
            {MONTH_THEMES.map((t) => <i key={t.name} title={t.name} style={{ background: t.a, boxShadow: `inset 0 -6px 0 ${t.b}` }} />)}
          </span>
        </div>
      </section>

      <section className="set-sec">
        <h3>Saved checklists</h3>
        {templates.length ? (
          <ul className="tpl-list">
            {templates.map((t) => (
              <li key={t.id}>
                <span><b>{t.name}</b> <span className="muted small">{SECTIONS.find((s) => s.id === t.section)?.label}, {t.items.length} items</span></span>
                <button className="icon-btn" aria-label={`Delete ${t.name}`} onClick={() => be.remove('templates', t.id)}>
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">None yet. In any activity’s Packing, Reservations or Meals list, tap “Save this list” to reuse it later.</p>
        )}
      </section>

      <section className="set-sec">
        <h3>Watch list lookups</h3>
        <p className="muted small">
          Paste a free TMDB key to get posters and where each title is streaming. Get one at{' '}
          <a className="link" href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">themoviedb.org</a>{' '}
          (free account, then Settings → API). Shared between you both.
        </p>
        <div className="row">
          <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="TMDB API key or read access token" aria-label="TMDB key" autoComplete="off" spellCheck="false" />
          <button className="btn small primary" onClick={saveKey} disabled={key.trim() === savedKey}>Save</button>
        </div>
        {savedKey && watch.some((w) => !w.tmdbId) && (
          <button className="btn small" disabled={busy} onClick={lookUpAll}>Look up posters for current titles</button>
        )}
        {status && <p className="small" role="status">{status}</p>}
        <p className="muted tiny">Posters and info from TMDB. Streaming data from JustWatch via TMDB. This app uses the TMDB API but is not endorsed or certified by TMDB.</p>
      </section>

      <section className="set-sec">
        <h3>Account</h3>
        <p className="small">Signed in as {user.displayName || user.email}</p>
        {be.mode === 'firebase' && <button className="btn small" onClick={() => be.signOut()}>Sign out</button>}
      </section>
    </Sheet>
  )
}
