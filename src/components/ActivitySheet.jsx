import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import Sheet from './Sheet'
import TimePicker from './TimePicker'
import { optionText } from './Ticket'
import Votes from './Votes'
import { openIcs } from '../lib/ics'
import { useBackend } from '../lib/hooks'
import { uid } from '../lib/store'
import { CATEGORIES, SECTIONS, COST, catOf } from '../lib/constants'

// Full detail for one activity. Every change saves right away.
export default function ActivitySheet({ activity: a, onClose, onOpen, templates = [] }) {
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
              }}>Duplicate</button>
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
        <div className="field">
          <label htmlFor="activity-date">Date</label>
          <div className="row">
            <input id="activity-date" type="date" value={a.date || ''} onChange={(e) => save({ date: e.target.value || null })} />
            {a.date && <button type="button" className="link" onClick={() => save({ date: null, time: '' })}>Clear</button>}
          </div>
          {a.date && (
            <div className="date-links">
              <button type="button" className="link make-maybe" onClick={() => openIcs(a)}>Add to phone calendar</button>
              <button type="button" className="link make-maybe"
                onClick={() => save({ date: null, time: '', options: [{ id: uid(), date: a.date, time: a.time || '' }, ...(a.options || [])] })}>
                Not sure yet? Make it a maybe
              </button>
            </div>
          )}
        </div>
        <div className="field">
          <span>Time</span>
          <TimePicker value={a.time || ''} disabled={!a.date} emptyLabel={a.date ? 'Add a time' : 'Pick a date first'}
            onChange={(time) => save({ time })} />
        </div>
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

      {!a.date && <MaybeDates a={a} save={save} />}

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
          templates={templates.filter((t) => t.section === section)}
          items={items}
          setItems={setItems}
        />
      </section>
    </Sheet>
  )
}

function Checklist({ section, items, setItems, templates }) {
  const be = useBackend()
  const [text, setText] = useState('')
  const [mode, setMode] = useState(null) // 'use' | 'save'
  const [name, setName] = useState('')
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
      <div className="tpl-links">
        {templates.length > 0 && <button type="button" className="link" aria-expanded={mode === 'use'} onClick={() => setMode(mode === 'use' ? null : 'use')}>Use a saved list</button>}
        {mine.length > 0 && <button type="button" className="link" aria-expanded={mode === 'save'} onClick={() => { setMode(mode === 'save' ? null : 'save'); setName('') }}>Save this list</button>}
      </div>
      {mode === 'use' && (
        <div className="chips">
          {templates.map((t) => (
            <button key={t.id} type="button" className="chip" onClick={() => {
              const have = new Set(mine.map((i) => i.text.toLowerCase()))
              const add = t.items.filter((x) => !have.has(x.toLowerCase()))
                .map((x) => ({ id: uid(), section: section.id, text: x, detail: '', done: false }))
              setItems([...items, ...add]); setMode(null)
            }}>{t.name} <span className="muted">{t.items.length}</span></button>
          ))}
        </div>
      )}
      {mode === 'save' && (
        <form className="row" onSubmit={async (e) => {
          e.preventDefault()
          if (!name.trim()) return
          await be.add('templates', { name: name.trim(), section: section.id, items: mine.map((i) => i.text) })
          setMode(null)
        }}>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Name it, like Weekend trip" aria-label="List name" />
          <button className="btn small primary" disabled={!name.trim()}>Save list</button>
        </form>
      )}
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

// Possible dates for an activity we haven't committed to. Each shows faded on the calendar.
function MaybeDates({ a, save }) {
  const options = [...(a.options || [])].sort((x, y) => (x.date + (x.time || '')).localeCompare(y.date + (y.time || '')))
  // the next option starts on the most recent option's date, so a second time that day is one tap
  const lastDate = options.length ? options[options.length - 1].date : ''
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [pickerKey, setPickerKey] = useState(0)
  const newDate = date || lastDate
  const add = () => {
    if (!newDate) return
    save({ options: [...options, { id: uid(), date: newDate, time }] })
    setTime(''); setPickerKey((k) => k + 1)
  }
  return (
    <section className="maybe-box" aria-label="Possible dates">
      <div className="maybe-head">
        <h3>Possible dates</h3>
        <span className="muted small">Not booked yet. Add each date or time you're choosing between; they show faded on the calendar until you choose one.</span>
      </div>
      {options.length > 0 && (
        <ul className="maybe-list">
          {options.map((o) => (
            <li key={o.id}>
              <span className="maybe-when">{format(parseISO(o.date), 'EEE, MMM d')}<Votes activity={a} option={o} /></span>
              <div className="maybe-time">
                <TimePicker label={`Time on ${format(parseISO(o.date), 'MMM d')}`} value={o.time || ''} emptyLabel="Any time"
                  onChange={(time) => save({ options: options.map((x) => (x.id === o.id ? { ...x, time } : x)) })} />
              </div>
              <button type="button" className="btn small primary"
                onClick={() => save({ date: o.date, time: o.time || '', options: [] })}>Choose</button>
              <button type="button" className="icon-btn" aria-label={`Remove ${optionText(o)}`}
                onClick={() => save({ options: options.filter((x) => x.id !== o.id) })}>
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="maybe-add">
        <input type="date" value={newDate} onChange={(e) => setDate(e.target.value)} aria-label="Possible date" />
        <TimePicker key={pickerKey} label="Possible time" value={time} onChange={setTime} emptyLabel="Any time" />
        <button type="button" className="btn small" disabled={!newDate} onClick={add}>
          {options.length ? 'Add another option' : 'Add option'}
        </button>
      </div>
      {options.length > 0 && (
        <button type="button" className="link" onClick={() => save({ options: [] })}>Not doing it, clear the dates</button>
      )}
    </section>
  )
}
