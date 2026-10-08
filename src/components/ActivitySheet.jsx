import { useEffect, useState } from 'react'
import Sheet from './Sheet'
import { useBackend } from '../lib/hooks'
import { uid } from '../lib/store'
import { CATEGORIES, SECTIONS, COST, catOf } from '../lib/constants'

// Full detail for one activity. Every change saves right away.
export default function ActivitySheet({ activity: a, onClose, onOpen }) {
  const be = useBackend()
  const save = (patch) => be.update('activities', a.id, patch)
  const cat = catOf(a.category)
  const [section, setSection] = useState(
    () => SECTIONS.find((s) => (a.items || []).some((i) => i.section === s.id))?.id || 'packing',
  )
  const [confirmDelete, setConfirmDelete] = useState(false)

  const items = a.items || []
  const setItems = (next) => save({ items: next })

  return (
    <Sheet
      onClose={onClose}
      labelledBy="activity-title"
      footer={
        <>
          {confirmDelete ? (
            <>
              <span className="muted">Delete this for both of you?</span>
              <button className="btn ghost" onClick={() => setConfirmDelete(false)}>Keep it</button>
              <button className="btn danger" onClick={async () => { onClose(); await be.remove('activities', a.id) }}>Delete</button>
            </>
          ) : (
            <>
              <button className="btn ghost" onClick={() => setConfirmDelete(true)}>Delete</button>
              <button className="btn ghost" onClick={async () => {
                const id = await be.add('activities', {
                  ...strip(a), date: null, time: '', done: false,
                  items: items.map((i) => ({ ...i, id: uid(), done: false })),
                })
                onOpen(id)
              }}>Do it again</button>
              <button className={`btn ${a.done ? 'ghost' : 'primary'}`} onClick={() => save({ done: !a.done })}>
                {a.done ? 'Mark not done' : 'Mark done'}
              </button>
            </>
          )}
        </>
      }
    >
      <div className="detail-head" style={{ '--cat': cat.color }}>
        <span className="detail-emoji" aria-hidden="true">{cat.emoji}</span>
        <TextField id="activity-title" className="detail-title" value={a.title} multiline rows={1} enterSaves
          onSave={(v) => v.trim() && save({ title: v.trim().replace(/\s*\n\s*/g, ' ') })} aria-label="Title" />
      </div>

      <div className="chips scroll" role="radiogroup" aria-label="Category">
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" role="radio" aria-checked={a.category === c.id}
            className="chip" style={{ '--cat': c.color }} onClick={() => save({ category: c.id })}>
            <span aria-hidden="true">{c.emoji}</span> {c.label}
          </button>
        ))}
      </div>

      <div className="grid2">
        <label className="field">
          <span>Date</span>
          <div className="row">
            <input type="date" value={a.date || ''} onChange={(e) => save({ date: e.target.value || null })} />
            {a.date && <button className="link" onClick={() => save({ date: null, time: '' })}>Clear</button>}
          </div>
        </label>
        <label className="field">
          <span>Time</span>
          <input type="time" value={a.time || ''} disabled={!a.date} onChange={(e) => save({ time: e.target.value })} />
        </label>
        <label className="field">
          <span>Where</span>
          <TextField value={a.location || ''} onSave={(v) => save({ location: v.trim() })} placeholder="Place or address" />
        </label>
        <div className="field">
          <span id="cost-label">Cost</span>
          <div className="seg small" role="radiogroup" aria-labelledby="cost-label">
            {COST.map((c, i) => (
              <button key={c} type="button" role="radio" aria-checked={a.cost === i}
                onClick={() => save({ cost: a.cost === i ? null : i })}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <label className="field">
        <span>Link</span>
        <div className="row">
          <TextField value={a.link || ''} onSave={(v) => save({ link: v.trim() })} placeholder="Website, menu, tickets" inputMode="url" />
          {a.link && <a className="link" href={withProto(a.link)} target="_blank" rel="noreferrer">Open</a>}
        </div>
      </label>

      <label className="field">
        <span>Notes</span>
        <TextField multiline value={a.notes || ''} onSave={(v) => save({ notes: v })} placeholder="Anything to remember" />
      </label>

      <section className="plan" aria-label="Planning checklists">
        <div className="seg" role="tablist">
          {SECTIONS.map((s) => {
            const n = items.filter((i) => i.section === s.id)
            return (
              <button key={s.id} role="tab" aria-selected={section === s.id} onClick={() => setSection(s.id)}>
                <span aria-hidden="true">{s.emoji}</span> {s.label}
                {n.length > 0 && <span className="count">{n.filter((i) => i.done).length}/{n.length}</span>}
              </button>
            )
          })}
        </div>
        <Checklist
          key={section}
          section={SECTIONS.find((s) => s.id === section)}
          items={items}
          setItems={setItems}
        />
      </section>
    </Sheet>
  )
}

function Checklist({ section, items, setItems }) {
  const [text, setText] = useState('')
  const mine = items.filter((i) => i.section === section.id)
  const add = (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    setItems([...items, { id: uid(), section: section.id, text: t, detail: '', done: false }])
    setText('')
  }
  const patch = (id, p) => setItems(items.map((i) => (i.id === id ? { ...i, ...p } : i)))
  return (
    <div className="checklist">
      <ul>
        {mine.map((i) => (
          <li key={i.id} className={i.done ? 'is-done' : ''}>
            <label className="check">
              <input type="checkbox" checked={i.done} onChange={() => patch(i.id, { done: !i.done })} />
              <span className="box" aria-hidden="true" />
              <span className="check-text">{i.text}</span>
            </label>
            {section.id === 'reservations' && (
              <TextField className="detail-input" value={i.detail || ''} placeholder="Time, confirmation #"
                onSave={(v) => patch(i.id, { detail: v.trim() })} aria-label={`Details for ${i.text}`} />
            )}
            <button className="icon-btn" aria-label={`Remove ${i.text}`} onClick={() => setItems(items.filter((x) => x.id !== i.id))}>
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="row">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={section.placeholder} aria-label={section.placeholder} enterKeyHint="done" />
        <button className="btn small" disabled={!text.trim()}>Add</button>
      </form>
    </div>
  )
}

// Text input that keeps its own draft and saves on blur or Enter.
function TextField({ value, onSave, multiline, rows = 3, enterSaves, className = '', ...rest }) {
  const [v, setV] = useState(value)
  useEffect(() => setV(value), [value])
  const commit = () => { if (v !== value) onSave(v) }
  const Tag = multiline ? 'textarea' : 'input'
  return (
    <Tag
      className={className}
      value={v}
      rows={multiline ? rows : undefined}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if ((!multiline || enterSaves) && e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() } }}
      {...rest}
    />
  )
}

const withProto = (u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`)
const strip = ({ id, createdAt, updatedAt, createdBy, ...rest }) => rest
