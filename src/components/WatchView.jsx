import { useEffect, useRef, useState } from 'react'
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useBackend } from '../lib/hooks'
import { autoMatch, details, genres, poster, search } from '../lib/tmdb'
import WatchSheet from './WatchSheet'

// Our order: a dragged title gets a `rank`; anything never dragged uses -createdAt,
// so new titles still land on top and existing lists keep their current order.
const rankOf = (i) => (typeof i.rank === 'number' ? i.rank : -(i.createdAt || 0))
const byRank = (x, y) => rankOf(x) - rankOf(y)
const sortTitle = (t = '') => t.replace(/^(the|a|an)\s+/i, '').toLowerCase()
const byTitle = (x, y) => sortTitle(x.title).localeCompare(sortTitle(y.title))
const SORTS = [['ours', 'Our order'], ['az', 'A–Z'], ['genre', 'Genre']]
const loadSort = () => { try { return localStorage.getItem('pf:watchSort') || 'ours' } catch { return 'ours' } }

export default function WatchView({ items, onSurprise, tmdbKey }) {
  const be = useBackend()
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('movie')
  const [tab, setTab] = useState('todo')
  const [filter, setFilter] = useState('all')
  const [sort, setSortState] = useState(loadSort)
  const [openId, setOpenId] = useState(null)
  const opened = items.find((i) => i.id === openId)
  const setSort = (v) => { try { localStorage.setItem('pf:watchSort', v) } catch { /* private mode */ } setSortState(v) }

  // titles matched before genres were saved: fill them in quietly, once each
  const filled = useRef(new Set())
  useEffect(() => {
    if (sort !== 'genre' || !tmdbKey) return
    const todo = items.filter((i) => i.tmdbId && i.mediaType && !i.genres && !filled.current.has(i.id))
    if (!todo.length) return
    todo.forEach((i) => filled.current.add(i.id))
    ;(async () => {
      for (const i of todo) {
        try { await be.update('watch', i.id, { genres: await genres(tmdbKey, i.mediaType, i.tmdbId) }) } catch { /* try next time */ }
      }
    })()
  }, [sort, tmdbKey, items, be])

  const [hits, setHits] = useState([])
  const timer = useRef()
  // suggestions from TMDB as you type (only when a key is set in Settings)
  useEffect(() => {
    clearTimeout(timer.current)
    const q = title.trim()
    if (!tmdbKey || q.length < 2) { setHits([]); return }
    timer.current = setTimeout(() => { search(tmdbKey, q).then(setHits).catch(() => setHits([])) }, 300)
    return () => clearTimeout(timer.current)
  }, [title, tmdbKey])

  const add = async (e) => {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    setTitle(''); setHits([])
    const id = await be.add('watch', { title: t, kind, where: '', watched: false })
    autoMatch(be, tmdbKey, id, t)
  }
  const addHit = async (h) => {
    setTitle(''); setHits([])
    const d = await details(tmdbKey, h).catch(() => ({ kind: h.mediaType === 'tv' ? 'show' : 'movie' }))
    await be.add('watch', { title: h.title, where: '', watched: false, ...d })
  }

  const todo = items.filter((i) => !i.watched)
  const list = items
    .filter((i) => (tab === 'todo' ? !i.watched : i.watched))
    .filter((i) => filter === 'all' || i.kind === filter)
    .sort(sort === 'az' ? byTitle : tab === 'todo' || sort === 'genre' ? byRank : (x, y) => (y.updatedAt || 0) - (x.updatedAt || 0))
  if (tab === 'done' && sort === 'genre') list.sort((x, y) => (y.updatedAt || 0) - (x.updatedAt || 0))
  const draggable = tab === 'todo' && sort === 'ours'

  // genre groups: each title under its first genre, groups A–Z, untagged last
  const groups = sort === 'genre' ? Object.entries(list.reduce((m, i) => {
    const g = i.genres?.[0] || 'No genre yet'; (m[g] ||= []).push(i); return m
  }, {})).sort(([a], [b]) => (a === 'No genre yet') - (b === 'No genre yet') || a.localeCompare(b)) : null

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const from = list.findIndex((i) => i.id === active.id)
    const to = list.findIndex((i) => i.id === over.id)
    const moved = arrayMove(list, from, to)
    // new rank sits between its new neighbors, so only the moved title is saved
    const prev = moved[to - 1], next = moved[to + 1]
    const rank = prev && next ? (rankOf(prev) + rankOf(next)) / 2 : prev ? rankOf(prev) + 1000 : rankOf(next) - 1000
    be.update('watch', active.id, { rank })
  }

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
        {hits.length > 0 && (
          <ul className="tmdb-hits" aria-label="Matches">
            {hits.map((h) => (
              <li key={h.mediaType + h.tmdbId}>
                <button type="button" onClick={() => addHit(h)}>
                  {poster(h.poster) ? <img src={poster(h.poster)} alt="" width="34" height="51" loading="lazy" /> : <span className="poster-blank" aria-hidden="true">{h.mediaType === 'tv' ? '📺' : '🎬'}</span>}
                  <span><b>{h.title}</b> <span className="muted">{[h.year, h.mediaType === 'tv' ? 'Show' : 'Movie'].filter(Boolean).join(', ')}</span></span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>

      <div className="watch-tools">
        <div className="seg small" role="tablist">
          <button role="tab" aria-selected={tab === 'todo'} onClick={() => setTab('todo')}>To watch <span className="count">{todo.length}</span></button>
          <button role="tab" aria-selected={tab === 'done'} onClick={() => setTab('done')}>Watched</button>
        </div>
        <div className="watch-tools-r">
          <div className="seg small" role="radiogroup" aria-label="Show">
            {[['all', 'All'], ['movie', 'Movies'], ['show', 'Shows']].map(([id, l]) => (
              <button key={id} role="radio" aria-checked={filter === id} onClick={() => setFilter(id)}>{l}</button>
            ))}
          </div>
          <label className="sort-pill">
            <span className="sr-only">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map(([id, l]) => <option key={id} value={id}>{l}</option>)}
            </select>
          </label>
        </div>
      </div>
      {draggable && list.length > 1 && <p className="muted small watch-hint">Drag a poster to reorder. Top is next up.</p>}
      {sort === 'genre' && !tmdbKey && <p className="muted small watch-hint">Genres come from TMDB. Add a key in Settings to fill them in.</p>}

      {list.length ? (
        groups ? (
          groups.map(([g, rows]) => (
            <section key={g} className="watch-group">
              <h2 className="watch-genre">{g} <span className="count">{rows.length}</span></h2>
              <ul className="watch-list">{rows.map((i) => <WatchRow key={i.id} item={i} onOpen={setOpenId} />)}</ul>
            </section>
          ))
        ) : draggable ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={list.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <ul className="watch-list">{list.map((i) => <SortableRow key={i.id} item={i} onOpen={setOpenId} />)}</ul>
            </SortableContext>
          </DndContext>
        ) : (
          <ul className="watch-list">{list.map((i) => <WatchRow key={i.id} item={i} onOpen={setOpenId} />)}</ul>
        )
      ) : (
        <div className="empty">
          <p>{tab === 'todo' ? 'Nothing queued. Add a movie or show you both want to see.' : 'Nothing marked watched yet.'}</p>
        </div>
      )}
      {opened && <WatchSheet item={opened} tmdbKey={tmdbKey} onClose={() => setOpenId(null)} />}
    </div>
  )
}

function SortableRow({ item, onOpen }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  return (
    <WatchRow item={item} onOpen={onOpen} rowRef={setNodeRef} dragging={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      handle={{ ref: setActivatorNodeRef, ...attributes, ...listeners, 'aria-label': `Reorder ${item.title}`, 'aria-roledescription': 'sortable' }} />
  )
}

function WatchRow({ item: i, onOpen, rowRef, style, handle, dragging }) {
  const be = useBackend()
  const [where, setWhere] = useState(i.where || '')
  useEffect(() => setWhere(i.where || ''), [i.where])
  const art = i.poster
    ? <img className="watch-poster" src={poster(i.poster, 'w154')} alt="" loading="lazy" draggable="false" />
    : <span className="watch-poster blank" aria-label={i.kind === 'show' ? 'Show' : 'Movie'}>{i.kind === 'show' ? '📺' : '🎬'}</span>
  return (
    <li ref={rowRef} style={style} className={`watch-row${i.watched ? ' is-done' : ''}${dragging ? ' is-dragging' : ''}`}>
      {/* poster runs the full height of the row, edge to edge; in Our order it's the drag handle */}
      {handle
        ? <button type="button" className="watch-grip" {...handle} onClick={() => onOpen(i.id)}>{art}<span className="grip-dots" aria-hidden="true" /></button>
        : <button type="button" className="watch-grip static" tabIndex={-1} aria-hidden="true" onClick={() => onOpen(i.id)}>{art}</button>}
      <div className="check">
        <label className="watch-box">
          <input type="checkbox" checked={i.watched} aria-label={`Watched ${i.title}`}
            onChange={() => be.update('watch', i.id, { watched: !i.watched })} />
          <span className="box" aria-hidden="true" />
        </label>
        <button type="button" className="check-text watch-title" onClick={() => onOpen(i.id)} aria-label={`${i.title}, details`}>
          {i.title}{i.year && <span className="watch-year"> {i.year}</span>}
          {i.genres?.length > 0 && <span className="watch-genres">{i.genres.slice(0, 3).join(' · ')}</span>}
        </button>
      </div>
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
