import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import Sheet from './Sheet'
import { useBackend } from '../lib/hooks'
import { CATEGORIES } from '../lib/constants'

// Fast add: type, pick a category, Enter. Stays open so you can add several.
export default function QuickAdd({ initial, onClose, onCreated }) {
  const be = useBackend()
  const [kind, setKind] = useState(initial.kind)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('out')
  const [watchKind, setWatchKind] = useState('movie')
  const [added, setAdded] = useState([])

  const save = async (e) => {
    e?.preventDefault()
    const t = title.trim()
    if (!t) return
    setTitle('')
    if (kind === 'idea') {
      const id = await be.add('activities', {
        title: t, category, date: initial.date || null, time: '', done: false, items: [],
      })
      setAdded((a) => [t, ...a].slice(0, 4))
      if (initial.date) onCreated(id, 'idea')
    } else {
      await be.add('watch', { title: t, kind: watchKind, where: '', watched: false })
      setAdded((a) => [t, ...a].slice(0, 4))
    }
  }

  return (
    <Sheet title="Add" onClose={onClose}>
      <form onSubmit={save} className="quick">
        <div className="seg" role="tablist" aria-label="What are you adding?">
          <button type="button" role="tab" aria-selected={kind === 'idea'} onClick={() => setKind('idea')}>Activity idea</button>
          <button type="button" role="tab" aria-selected={kind === 'watch'} onClick={() => setKind('watch')}>Movie or show</button>
        </div>

        <input
          data-autofocus
          className="quick-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={kind === 'idea' ? 'Picnic at Pinnacle Mountain…' : 'Title…'}
          aria-label={kind === 'idea' ? 'Activity' : 'Title'}
          enterKeyHint="done"
        />

        {kind === 'idea' ? (
          <div className="chips" role="radiogroup" aria-label="Category">
            {CATEGORIES.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={category === c.id}
                className="chip" style={{ '--cat': c.color }} onClick={() => setCategory(c.id)}>
                <span aria-hidden="true">{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="chips" role="radiogroup" aria-label="Type">
            {[['movie', '🎬 Movie'], ['show', '📺 Show']].map(([id, l]) => (
              <button key={id} type="button" role="radio" aria-checked={watchKind === id}
                className="chip" style={{ '--cat': 'var(--c-flamingo)' }} onClick={() => setWatchKind(id)}>{l}</button>
            ))}
          </div>
        )}

        {initial.date && kind === 'idea' && (
          <p className="muted">Goes on {format(parseISO(initial.date), 'EEEE, MMMM d')}.</p>
        )}

        <button className="btn primary wide" disabled={!title.trim()}>
          {kind === 'idea' ? (initial.date ? 'Add to calendar' : 'Add idea') : 'Add to watch list'}
        </button>

        {added.length > 0 && (
          <ul className="added" aria-live="polite">
            {added.map((t, i) => <li key={i + t}>Added “{t}”</li>)}
          </ul>
        )}
      </form>
    </Sheet>
  )
}
