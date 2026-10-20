import { useEffect, useState } from 'react'
import Sheet from './Sheet'
import { useBackend } from '../lib/hooks'
import { details, info, poster, search, tmdbUrl } from '../lib/tmdb'

const hm = (m) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m} min`)

// Tap a watch-list title: summary, facts, and a way to fix a wrong TMDB match.
export default function WatchSheet({ item: i, tmdbKey, onClose }) {
  const be = useBackend()
  const linked = !!(i.tmdbId && i.mediaType)
  const [facts, setFacts] = useState(null)
  const [err, setErr] = useState('')
  const [fixing, setFixing] = useState(false)

  useEffect(() => {
    setFacts(null); setErr('')
    if (!tmdbKey || !linked) return
    let live = true
    info(tmdbKey, i.mediaType, i.tmdbId)
      .then((f) => {
        if (!live) return
        setFacts(f)
        if (!i.genres) be.update('watch', i.id, { genres: f.genres })
      })
      .catch((e) => live && setErr(e.message))
    return () => { live = false }
  }, [tmdbKey, linked, i.mediaType, i.tmdbId]) // eslint-disable-line react-hooks/exhaustive-deps

  const kind = i.kind === 'show' ? 'Show' : 'Movie'
  const meta = [
    i.year, kind,
    facts?.seasons && `${facts.seasons} season${facts.seasons === 1 ? '' : 's'}`,
    facts?.runtime && (i.kind === 'show' ? `${hm(facts.runtime)} episodes` : hm(facts.runtime)),
    facts?.status === 'Ended' && 'Ended',
  ].filter(Boolean).join(' · ')
  const genres = facts?.genres || i.genres || []

  return (
    <Sheet title={i.title} onClose={onClose}>
      <div className="ws-head">
        {i.poster
          ? <img className="ws-poster" src={poster(i.poster, 'w342')} alt="" />
          : <span className="ws-poster blank" aria-hidden="true">{i.kind === 'show' ? '📺' : '🎬'}</span>}
        <div className="ws-title">
          <h2 className="sheet-title">{i.title}</h2>
          <p className="ws-meta">{meta}</p>
          {genres.length > 0 && <p className="ws-genres">{genres.map((g) => <span key={g}>{g}</span>)}</p>}
          {i.where && <p className="ws-where">📺 {i.where}</p>}
        </div>
      </div>

      <section className="ws-summary">
        {!linked ? <p className="muted">Not matched to a title on TMDB yet{tmdbKey ? ', so there’s no summary. Find it below.' : '.'}</p>
          : !tmdbKey ? <p className="muted">Add a TMDB key in Settings to see the summary.</p>
          : err ? <p className="muted">{err}</p>
          : !facts ? <p className="muted">Loading summary…</p>
          : <>
              {facts.tagline && <p className="ws-tagline">“{facts.tagline}”</p>}
              <p>{facts.overview || 'TMDB has no summary for this one.'}</p>
            </>}
      </section>

      {tmdbKey && (fixing || !linked
        ? <Rematch item={i} tmdbKey={tmdbKey} onDone={() => setFixing(false)} canCancel={linked} />
        : (
          <div className="ws-links">
            <button type="button" className="btn small" onClick={() => setFixing(true)}>Wrong title? Change match</button>
            <a className="link" href={tmdbUrl(i.mediaType, i.tmdbId)} target="_blank" rel="noreferrer">View on TMDB ↗</a>
          </div>
        ))}
      {linked && <p className="muted tiny">Summary and details from TMDB.</p>}
    </Sheet>
  )
}

function Rematch({ item: i, tmdbKey, onDone, canCancel }) {
  const be = useBackend()
  const [q, setQ] = useState(i.title)
  const [hits, setHits] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const t = q.trim()
    if (t.length < 2) { setHits([]); return }
    const h = setTimeout(() => { search(tmdbKey, t, 10).then(setHits).catch((e) => { setHits([]); setMsg(e.message) }) }, 300)
    return () => clearTimeout(h)
  }, [q, tmdbKey])

  const pick = async (h) => {
    setBusy(true); setMsg('')
    try {
      const d = await details(tmdbKey, h)
      // the old streaming info belonged to the old match; keep a typed one only if the new match has none
      await be.update('watch', i.id, { ...d, title: h.title, where: d.where || i.where || '' })
      onDone()
    } catch (e) { setMsg(e.message) }
    setBusy(false)
  }
  const unlink = () => {
    be.update('watch', i.id, { tmdbId: null, mediaType: null, poster: null, year: '', genres: null })
    onDone()
  }

  return (
    <section className="ws-fix" aria-label="Change match">
      <div className="field">
        <label htmlFor="ws-q">Search TMDB</label>
        <input id="ws-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title" autoComplete="off" data-autofocus />
      </div>
      {hits === null ? <p className="muted small">Searching…</p>
        : hits.length === 0 ? <p className="muted small">No matches. Try another spelling or add the year.</p>
        : (
          <ul className="ws-hits">
            {hits.map((h) => {
              const current = h.tmdbId === i.tmdbId && h.mediaType === i.mediaType
              return (
                <li key={h.mediaType + h.tmdbId}>
                  <button type="button" disabled={busy || current} onClick={() => pick(h)} aria-current={current || undefined}>
                    {h.poster ? <img src={poster(h.poster)} alt="" width="40" height="60" loading="lazy" /> : <span className="poster-blank" aria-hidden="true">{h.mediaType === 'tv' ? '📺' : '🎬'}</span>}
                    <span><b>{h.title}</b><span className="muted"> {[h.year, h.mediaType === 'tv' ? 'Show' : 'Movie'].filter(Boolean).join(', ')}</span>
                      {current && <span className="ws-current">Current match</span>}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      {msg && <p className="small" role="status">{msg}</p>}
      <div className="ws-links">
        {canCancel && <button type="button" className="btn small" onClick={onDone}>Cancel</button>}
        {canCancel && <button type="button" className="link" onClick={unlink}>Remove the match</button>}
      </div>
    </section>
  )
}
