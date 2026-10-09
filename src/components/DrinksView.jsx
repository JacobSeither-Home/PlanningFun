import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useBackend } from '../lib/hooks'
import {
  avgScore, drinkTitle, fmtScore, kindOf, ratingList, scoreColor, scoreFace, scoreWord, KIND_EMOJI,
} from '../lib/drinks'

export default function DrinksView({ drinks, kinds, kind, setKind, onOpen }) {
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
        </div>
      </header>

      <div className="toolbar">
        <input type="search" className="search" placeholder="Search drinks or places" value={q}
          onChange={(e) => setQ(e.target.value)} aria-label="Search drinks or places" />
        <div className="chips scroll" role="radiogroup" aria-label="Drink type">
          <button className="chip" role="radio" aria-checked={!kind} onClick={() => setKind(null)} style={{ '--cat': 'var(--ink)' }}>All</button>
          {kinds.map((k) => (
            <button key={k.id} className="chip" role="radio" aria-checked={kind === k.id}
              style={{ '--cat': 'var(--grape)' }} onClick={() => setKind(kind === k.id ? null : k.id)}>
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

      {list.length ? (
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
