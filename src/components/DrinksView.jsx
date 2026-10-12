import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useBackend } from '../lib/hooks'
import {
  avgScore, drinkTitle, fmtScore, kindOf, ratingList, scoreColor, scoreFace, scoreWord, KIND_EMOJI,
} from '../lib/drinks'

export default function DrinksView({ drinks, kinds, kind, setKind, onOpen, tryPlaces = [] }) {
  const be = useBackend()
  const [sort, setSort] = useState('best')
  const [q, setQ] = useState('')
  const [addingKind, setAddingKind] = useState(false)

  const list = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return drinks
      .filter((d) => !kind || d.kind === kind)
      .filter((d) => !ql || `${d.name || ''} ${d.place || ''} ${d.type || ''}`.toLowerCase().includes(ql))
      .map((d) => ({ d, avg: avgScore(d) }))
      .sort((a, b) =>
        sort === 'best'
          ? (b.avg ?? 0) - (a.avg ?? 0) || (b.d.date || '').localeCompare(a.d.date || '')
          : (b.d.date || '').localeCompare(a.d.date || '') || (b.d.createdAt || 0) - (a.d.createdAt || 0),
      )
  }, [drinks, kind, sort, q])

  const current = kind && kinds.find((k) => k.id === kind)
  const canRemoveKind = current?.custom && !drinks.some((d) => d.kind === kind)

  return (
    <div className="view">
      <header className="view-head">
        <h1>Drinks</h1>
        <div className="seg small" role="radiogroup" aria-label="Sort">
          <button role="radio" aria-checked={sort === 'best'} onClick={() => setSort('best')}>Best first</button>
          <button role="radio" aria-checked={sort === 'new'} onClick={() => setSort('new')}>Newest</button>
          <button role="radio" aria-checked={sort === 'places'} onClick={() => setSort('places')}>Places</button>
        </div>
      </header>

      <div className="toolbar">
        <input type="search" className="search" placeholder="Search drinks or places" value={q}
          onChange={(e) => setQ(e.target.value)} aria-label="Search drinks or places" />
        <div className="chips scroll" role="radiogroup" aria-label="Drink type">
          <button className="chip" role="radio" aria-checked={!kind} onClick={() => setKind(null)} style={{ '--cat': 'var(--ink)' }}>All</button>
          {kinds.map((k) => (
            <button key={k.id} className="chip" role="radio" aria-checked={kind === k.id}
              style={{ '--cat': 'var(--c-flamingo)' }} onClick={() => setKind(kind === k.id ? null : k.id)}>
              <span aria-hidden="true">{k.emoji}</span> {k.label}
            </button>
          ))}
          <button className="chip add-chip" onClick={() => setAddingKind(true)} aria-expanded={addingKind}>+ New type</button>
        </div>
        {addingKind && <NewKind onDone={(id) => { setAddingKind(false); if (id) setKind(id) }} />}
        {canRemoveKind && (
          <p className="muted small">
            <button className="link" onClick={() => { be.remove('drinkKinds', kind); setKind(null) }}>Remove this type</button>
          </p>
        )}
      </div>

      {sort === 'places' ? (
        <Places list={list} kinds={kinds} tryPlaces={tryPlaces} onPick={(place) => { setQ(place); setSort('best') }} />
      ) : list.length ? (
        <ol className="drink-list">
          {list.map(({ d, avg }, i) => (
            <DrinkRow key={d.id} drink={d} avg={avg} kind={kindOf(kinds, d.kind)}
              crown={sort === 'best' && i === 0 && avg != null} onOpen={onOpen} />
          ))}
        </ol>
      ) : (
        <div className="empty">
          <p>{q
            ? 'No drinks match that search.'
            : current
              ? `No ${current.label} ratings yet. Tap + after your next one.`
              : 'Tap + after your next round to rate it. Your favorites will rise to the top.'}</p>
        </div>
      )}
    </div>
  )
}

function DrinkRow({ drink: d, avg, kind, crown, onOpen }) {
  const ratings = ratingList(d)
  return (
    <li>
      <button className="drink-row" onClick={() => onOpen(d.id)}>
        <span className="score" style={{ '--score': avg != null ? scoreColor(avg) : 'var(--sunken)' }}>
          {avg != null ? (
            <>
              <span className="score-num">{fmtScore(avg)}</span>
              <span className="score-word">{scoreWord(avg)}</span>
            </>
          ) : <span className="score-word">Not rated</span>}
        </span>
        <span className="drink-body">
          <span className="drink-title">
            {crown && <span className="crown" aria-label="Top pick">👑 </span>}
            <span aria-hidden="true">{kind.emoji}</span> {drinkTitle(d, kind)}
          </span>
          <span className="ticket-meta">
            {d.place && <span>{d.place}</span>}
            {d.type && d.name && <span>{d.type}</span>}
            {d.date && <span>{format(parseISO(d.date), 'MMM d, yyyy')}</span>}
          </span>
          {ratings.length > 1 && (
            <span className="who-rated">
              {ratings.map((r) => (
                <span key={r.uid}>{r.name} <b>{r.score}</b> {scoreFace(r.score)}</span>
              ))}
            </span>
          )}
        </span>
        {d.thumb && <img className="drink-thumb" src={d.thumb} alt="" width="56" height="56" loading="lazy" />}
      </button>
    </li>
  )
}

function NewKind({ onDone }) {
  const be = useBackend()
  const [label, setLabel] = useState('')
  const [emoji, setEmoji] = useState('🍸')
  const save = async (e) => {
    e.preventDefault()
    const l = label.trim()
    if (!l) return
    const id = await be.add('drinkKinds', { label: l, emoji })
    onDone(id)
  }
  return (
    <form className="new-kind" onSubmit={save}>
      <input data-autofocus autoFocus value={label} onChange={(e) => setLabel(e.target.value)}
        placeholder="Sazerac, margarita, wine…" aria-label="New drink type" />
      <div className="emoji-pick" role="radiogroup" aria-label="Icon">
        {KIND_EMOJI.map((em) => (
          <button key={em} type="button" role="radio" aria-checked={emoji === em} onClick={() => setEmoji(em)}>{em}</button>
        ))}
      </div>
      <div className="row">
        <button type="button" className="btn small ghost" onClick={() => onDone(null)}>Cancel</button>
        <button className="btn small primary" disabled={!label.trim()}>Add type</button>
      </div>
    </form>
  )
}

// Drinks grouped by bar, best first, plus a shared "want to try" list.
function Places({ list, kinds, tryPlaces, onPick }) {
  const be = useBackend()
  const [name, setName] = useState('')
  const places = useMemo(() => {
    const m = new Map()
    list.forEach(({ d, avg }) => {
      const label = (d.place || '').trim()
      if (!label) return
      const k = label.toLowerCase()
      const p = m.get(k) || { label, rows: [] }
      p.rows.push({ d, avg }); m.set(k, p)
    })
    return [...m.values()].map((p) => {
      const rated = p.rows.filter((r) => r.avg != null)
      const avg = rated.length ? rated.reduce((s, r) => s + r.avg, 0) / rated.length : null
      const best = [...rated].sort((a, b) => b.avg - a.avg)[0]
      return { ...p, avg, best }
    }).sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0))
  }, [list])
  const visited = new Set(places.map((p) => p.label.toLowerCase()))

  return (
    <>
      {places.length ? (
        <ol className="drink-list">
          {places.map((p) => (
            <li key={p.label}>
              <button className="drink-row" onClick={() => onPick(p.label)}>
                <span className="score" style={{ '--score': p.avg != null ? scoreColor(p.avg) : 'var(--sunken)' }}>
                  {p.avg != null
                    ? <><span className="score-num">{fmtScore(Math.round(p.avg * 10) / 10)}</span><span className="score-word">{scoreWord(p.avg)}</span></>
                    : <span className="score-word">Not rated</span>}
                </span>
                <span className="drink-body">
                  <span className="drink-title">{p.label}</span>
                  <span className="ticket-meta">
                    <span>{p.rows.length} {p.rows.length === 1 ? 'drink' : 'drinks'}</span>
                    {p.best && <span>Best: {drinkTitle(p.best.d, kindOf(kinds, p.best.d.kind))} ({fmtScore(p.best.avg)})</span>}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="empty"><p>Rate a drink with a bar name and it’ll show up here, ranked.</p></div>
      )}

      <section className="group try-places">
        <h2>Want to try</h2>
        <form className="row" onSubmit={async (e) => {
          e.preventDefault()
          if (!name.trim()) return
          await be.add('tryPlaces', { name: name.trim() }); setName('')
        }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="A bar or brewery you’ve heard about" aria-label="Place to try" enterKeyHint="done" />
          <button className="btn small" disabled={!name.trim()}>Add</button>
        </form>
        {tryPlaces.length > 0 && (
          <ul className="try-list">
            {[...tryPlaces].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).map((t) => (
              <li key={t.id}>
                <span>{t.name}{visited.has(t.name.trim().toLowerCase()) && <span className="tried"> rated ✓</span>}</span>
                <button className="icon-btn" aria-label={`Remove ${t.name}`} onClick={() => be.remove('tryPlaces', t.id)}>
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
