import { useState } from 'react'
import { useBackend } from '../lib/hooks'

export default function WatchView({ items, onSurprise }) {
  const be = useBackend()
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('movie')
  const [tab, setTab] = useState('todo')
  const [filter, setFilter] = useState('all')

  const add = async (e) => {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    setTitle('')
    await be.add('watch', { title: t, kind, where: '', watched: false })
  }

  const todo = items.filter((i) => !i.watched)
  const list = items
    .filter((i) => (tab === 'todo' ? !i.watched : i.watched))
    .filter((i) => filter === 'all' || i.kind === filter)
    .sort((x, y) => tab === 'todo' ? (y.createdAt || 0) - (x.createdAt || 0) : (y.updatedAt || 0) - (x.updatedAt || 0))

  return (
    <div className="view">
      <header className="view-head">
        <h1>Watch list</h1>
        <button className="btn dice" disabled={todo.length < 2}
          onClick={() => onSurprise(filter === 'all' ? todo : todo.filter((i) => i.kind === filter))}>
          🎲 Pick for tonight
        </button>
      </header>

      <form className="watch-add" onSubmit={add}>
        <div className="seg small" role="radiogroup" aria-label="Type">
          <button type="button" role="radio" aria-checked={kind === 'movie'} onClick={() => setKind('movie')}>🎬 Movie</button>
          <button type="button" role="radio" aria-checked={kind === 'show'} onClick={() => setKind('show')}>📺 Show</button>
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a title and press Enter"
          aria-label="Title to add" enterKeyHint="done" />
        <button className="btn primary small" disabled={!title.trim()}>Add</button>
      </form>

      <div className="watch-tools">
        <div className="seg small" role="tablist">
          <button role="tab" aria-selected={tab === 'todo'} onClick={() => setTab('todo')}>To watch <span className="count">{todo.length}</span></button>
          <button role="tab" aria-selected={tab === 'done'} onClick={() => setTab('done')}>Watched</button>
        </div>
        <div className="seg small" role="radiogroup" aria-label="Show">
          {[['all', 'All'], ['movie', 'Movies'], ['show', 'Shows']].map(([id, l]) => (
            <button key={id} role="radio" aria-checked={filter === id} onClick={() => setFilter(id)}>{l}</button>
          ))}
        </div>
      </div>

      {list.length ? (
        <ul className="watch-list">
          {list.map((i) => <WatchRow key={i.id} item={i} />)}
        </ul>
      ) : (
        <div className="empty">
          <p>{tab === 'todo' ? 'Nothing queued. Add a movie or show you both want to see.' : 'Nothing marked watched yet.'}</p>
        </div>
      )}
    </div>
  )
}

function WatchRow({ item: i }) {
  const be = useBackend()
  const [where, setWhere] = useState(i.where || '')
  return (
    <li className={`watch-row${i.watched ? ' is-done' : ''}`}>
      <label className="check">
        <input type="checkbox" checked={i.watched} onChange={() => be.update('watch', i.id, { watched: !i.watched })} />
        <span className="box" aria-hidden="true" />
        <span className="watch-kind" aria-label={i.kind === 'show' ? 'Show' : 'Movie'}>{i.kind === 'show' ? '📺' : '🎬'}</span>
        <span className="check-text">{i.title}</span>
      </label>
      <input className="where" value={where} placeholder="Where to watch" aria-label={`Where to watch ${i.title}`}
        onChange={(e) => setWhere(e.target.value)}
        onBlur={() => where !== (i.where || '') && be.update('watch', i.id, { where: where.trim() })}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
      <button className="icon-btn" aria-label={`Remove ${i.title}`} onClick={() => be.remove('watch', i.id)}>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </button>
    </li>
  )
}
