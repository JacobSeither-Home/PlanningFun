import { useMemo, useState } from 'react'
import { format, parseISO, isBefore, startOfToday } from 'date-fns'
import Ticket from './Ticket'
import { CATEGORIES } from '../lib/constants'

export default function IdeasView({ activities, onOpen, onSurprise }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState(null)
  const [showDone, setShowDone] = useState(false)

  const today = startOfToday()
  const match = (a) =>
    (!cat || a.category === cat) &&
    (!q || `${a.title} ${a.location || ''} ${a.notes || ''}`.toLowerCase().includes(q.toLowerCase()))

  const { upcoming, maybes, ideas, done } = useMemo(() => {
    const m = activities.filter(match)
    return {
      upcoming: m.filter((a) => a.date && !a.done && !isBefore(parseISO(a.date), today))
        .sort((x, y) => (x.date + (x.time || '')).localeCompare(y.date + (y.time || ''))),
      maybes: m.filter((a) => !a.date && !a.done && a.options?.length)
        .sort((x, y) => firstOpt(x).localeCompare(firstOpt(y))),
      ideas: m.filter((a) => !a.date && !a.done && !a.options?.length).sort((x, y) => (y.createdAt || 0) - (x.createdAt || 0)),
      done: m.filter((a) => a.done || (a.date && isBefore(parseISO(a.date), today)))
        .sort((x, y) => (y.date || '').localeCompare(x.date || '')),
    }
  }, [activities, q, cat])

  const unplanned = activities.filter((a) => !a.date && !a.done)

  return (
    <div className="view">
      <header className="view-head">
        <h1>Ideas</h1>
        <button className="btn dice" disabled={unplanned.length < 2}
          onClick={() => onSurprise(cat ? unplanned.filter((a) => a.category === cat) : unplanned)}
          title={unplanned.length < 2 ? 'Add at least two ideas first' : undefined}>
          🎲 Surprise us
        </button>
      </header>

      <div className="toolbar">
        <input type="search" className="search" placeholder="Search ideas" value={q}
          onChange={(e) => setQ(e.target.value)} aria-label="Search ideas" />
        <div className="chips scroll" role="radiogroup" aria-label="Filter by category">
          <button className="chip" role="radio" aria-checked={!cat} onClick={() => setCat(null)} style={{ '--cat': 'var(--ink)' }}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} className="chip" role="radio" aria-checked={cat === c.id}
              style={{ '--cat': c.color }} onClick={() => setCat(cat === c.id ? null : c.id)}>
              <span aria-hidden="true">{c.emoji}</span> {c.label}
            </button>
          ))}
        </div>
      </div>

      {upcoming.length > 0 && (
        <section className="group">
          <h2>Coming up</h2>
          <div className="tickets">
            {upcoming.map((a) => <Ticket key={a.id} activity={a} onOpen={onOpen} />)}
          </div>
        </section>
      )}

      {maybes.length > 0 && (
        <section className="group">
          <h2>Maybe <span className="muted">{maybes.length}</span></h2>
          <div className="tickets">
            {maybes.map((a) => <Ticket key={a.id} activity={a} onOpen={onOpen} />)}
          </div>
        </section>
      )}

      <section className="group">
        <h2>Someday <span className="muted">{ideas.length || ''}</span></h2>
        {ideas.length ? (
          <div className="tickets">
            {ideas.map((a) => <Ticket key={a.id} activity={a} onOpen={onOpen} />)}
          </div>
        ) : (
          <div className="empty">
            {q || cat
              ? <p>Nothing matches. Try a different search or category.</p>
              : activities.length ? <p>No undated ideas right now. Tap + to add one.</p>
              : <p>Tap + to save your first idea. Anything counts: a new taco place, a weekend trip, a board game night.</p>}
          </div>
        )}
      </section>

      {done.length > 0 && (
        <section className="group">
          <button className="disclose" aria-expanded={showDone} onClick={() => setShowDone(!showDone)}>
            <h2>Done and past <span className="muted">{done.length}</span></h2>
          </button>
          {showDone && (
            <div className="tickets">
              {done.map((a) => <Ticket key={a.id} activity={{ ...a, done: true }} onOpen={onOpen} />)}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export const fmtDay = (d) => format(parseISO(d), 'EEE MMM d')

const firstOpt = (a) => [...a.options].map((o) => o.date + (o.time || '')).sort()[0] || ''
