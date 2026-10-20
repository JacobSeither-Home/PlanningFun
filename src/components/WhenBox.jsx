import { useEffect, useState } from 'react'
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import TimePicker from './TimePicker'
import DatePicker from './DatePicker'
import Votes, { agreed } from './Votes'
import { useBackend } from '../lib/hooks'
import { uid } from '../lib/store'
import { openIcs } from '../lib/ics'
import { LENGTHS, fmtTime, inferLength, isMulti, lastDay, withLength } from '../lib/when'

const sortOpts = (o) => [...(o || [])].sort((x, y) => (x.date + (x.time || '')).localeCompare(y.date + (y.time || '')))
const short = (d) => format(parseISO(d), 'EEE, MMM d')

// Top of an activity: Booked (start/end) or Maybe (several possible spans to choose from).
export default function WhenBox({ a }) {
  const be = useBackend()
  const save = (patch) => be.update('activities', a.id, patch)
  const options = sortOpts(a.options)
  const derived = a.date ? 'booked' : options.length ? 'maybe' : null
  const [mode, setMode] = useState(derived || 'booked')
  useEffect(() => { if (derived) setMode(derived) }, [derived])
  // the "add an option" fields live here so they survive switching modes
  const [draft, setDraft] = useState({ date: '', time: '', length: '' })
  const span = (o) => ({ date: o.date, time: o.time || '', endDate: o.endDate && o.endDate > o.date ? o.endDate : null, endTime: o.endTime || '' })

  // Choose = decided: book it and drop the other options.
  const choose = (o) => save({ ...span(o), options: [], bookedFrom: null })

  // Switching modes never loses anything:
  // Booked -> Maybe: the booked dates become (or update) an option.
  const toMaybe = () => {
    if (mode === 'maybe') return
    if (a.date) {
      const cur = span(a)
      const all = a.options || []
      const opts = a.bookedFrom && all.some((o) => o.id === a.bookedFrom)
        ? all.map((o) => (o.id === a.bookedFrom ? { ...o, ...cur, length: '' } : o))
        : [{ id: uid(), ...cur }, ...all]
      save({ date: null, time: '', endDate: null, endTime: '', bookedFrom: null, options: opts })
    }
    setDraft({ date: '', time: '', length: '' })
    setMode('maybe')
  }
  // Maybe -> Booked: book the favorite option (or the one typed in) but keep the rest saved.
  const toBooked = () => {
    if (mode === 'booked') return
    if (draft.date && !options.length) {
      save(span({ ...draft, ...withLength(draft, draft.length) }))
    } else if (options.length) {
      const o = options.find(agreed) || options[0]
      save({ ...span(o), bookedFrom: o.id })
    }
    setMode('booked')
  }
  const others = a.date ? (a.options || []).filter((o) => o.id !== a.bookedFrom) : []

  return (
    <section className="when" aria-label="When">
      <div className="when-head">
        <h3>When</h3>
        <div className="seg small" role="radiogroup" aria-label="Booked or maybe">
          <button type="button" role="radio" aria-checked={mode === 'booked'} onClick={toBooked}>Booked</button>
          <button type="button" role="radio" aria-checked={mode === 'maybe'} onClick={toMaybe}>Maybe</button>
        </div>
      </div>

      {mode === 'booked' ? (
        <>
          <div className="when-grid">
            <div className="field">
              <span>Starts</span>
              <DatePicker label="Start date" value={a.date || ''} clearable emptyLabel="Pick a date" onChange={(v) => {
                if (!v) { save({ date: null, time: '', endDate: null, endTime: '' }); return }
                // moving the start moves a multi-day end with it, so the length stays the same
                const len = a.date && isMulti(a) ? differenceInCalendarDays(parseISO(a.endDate), parseISO(a.date)) : 0
                save({ date: v, endDate: len > 0 ? format(addDays(parseISO(v), len), 'yyyy-MM-dd') : null })
              }} />
            </div>
            <div className="field">
              <span>Start time</span>
              <TimePicker label="Start time" value={a.time || ''} disabled={!a.date}
                emptyLabel={a.date ? 'Any time' : 'Pick a date first'} onChange={(time) => save({ time })} />
            </div>
            <div className="field">
              <span>Ends <span className="muted">(for multi-day)</span></span>
              <DatePicker label="End date" value={a.endDate || ''} disabled={!a.date} clearable emptyLabel={a.date ? 'Same day' : 'Pick a start first'}
                min={a.date ? format(addDays(parseISO(a.date), 1), 'yyyy-MM-dd') : undefined} openTo={a.date || undefined} mark={a.date || undefined}
                onChange={(v) => save({ endDate: v && v > a.date ? v : null })} />
            </div>
            <div className="field">
              <span>End time</span>
              <TimePicker label="End time" value={a.endTime || ''} disabled={!a.date} emptyLabel="Optional"
                onChange={(endTime) => save({ endTime })} />
            </div>
          </div>
          {others.length > 0 && (
            <p className="muted small">{others.length} other {others.length === 1 ? 'option is' : 'options are'} saved. Switch to Maybe to see {others.length === 1 ? 'it' : 'them'}.</p>
          )}
          {a.date && (
            <div className="date-links">
              {isMulti(a) && <span className="muted small">{Math.round((parseISO(lastDay(a)) - parseISO(a.date)) / 864e5) + 1} days</span>}
              <button type="button" className="link make-maybe" onClick={() => openIcs(a)}>Add to phone calendar</button>
              <button type="button" className="link make-maybe" onClick={() => save({ date: null, time: '', endDate: null, endTime: '' })}>Clear dates</button>
            </div>
          )}
        </>
      ) : (
        <MaybeOptions a={a} options={options} save={save} choose={choose} draft={draft} setDraft={setDraft} />
      )}
    </section>
  )
}

function MaybeOptions({ a, options, save, choose, draft, setDraft }) {
  const last = options[options.length - 1]
  const [k, setK] = useState(0)
  const start = draft.date || last?.date || ''
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const edit = (o, patch) => save({ options: options.map((x) => (x.id === o.id ? patchOption(x, patch) : x)) })
  const add = () => {
    if (!start) return
    const o = { id: uid(), date: start, time: draft.time }
    save({ options: [...options, { ...o, ...withLength(o, draft.length) }] })
    // keep the date and length so the next alternate is just a new time
    setDraft((d) => ({ ...d, date: start, time: '' })); setK((n) => n + 1)
  }
  return (
    <>
      <p className="muted small">Add each date and time you’re choosing between. They show faded on the calendar until you choose one.</p>
      {options.length > 0 && (
        <ul className="maybe-list">
          {options.map((o) => (
            <li key={o.id}>
              <span className="maybe-when">{short(o.date)}</span>
              <LengthSelect o={o} onChange={(length) => edit(o, { length })} />
              <div className="maybe-time">
                <TimePicker label={`Time on ${format(parseISO(o.date), 'MMM d')}`} value={o.time || ''} emptyLabel="Any time"
                  onChange={(time) => edit(o, { time })} />
              </div>
              <Votes activity={a} option={o} />
              <button type="button" className="btn small primary" onClick={() => choose(o)}>Choose</button>
              <button type="button" className="icon-btn" aria-label={`Remove option ${short(o.date)}`}
                onClick={() => save({ options: options.filter((x) => x.id !== o.id) })}>
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="maybe-add">
        <div className="field">
          <span>Date</span>
          <DatePicker label="Possible date" value={start} onChange={(date) => set({ date })} />
        </div>
        <div className="field">
          <span>Time</span>
          <TimePicker key={k} label="Possible time" value={draft.time} onChange={(time) => set({ time })} emptyLabel="Any time" />
        </div>
        <div className="field">
          <span>Length <span className="muted">(optional)</span></span>
          <select className="len-select" value={draft.length} onChange={(e) => set({ length: e.target.value })} aria-label="Possible length">
            <option value="">Not sure</option>
            {LENGTHS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <button type="button" className="btn small" disabled={!start} onClick={add}>
          {options.length ? '+ Add another date or time' : '+ Add this option'}
        </button>
      </div>
      {options.length > 0 && (
        <button type="button" className="link make-maybe" onClick={() => save({ options: [] })}>Not doing it, clear the options</button>
      )}
    </>
  )
}

// A changed time or length re-works the end; options saved with a custom end keep it.
function patchOption(o, patch) {
  const next = { ...o, ...patch }
  const len = 'length' in patch ? patch.length : o.length
  if (len === 'keep') return o
  if (len || 'length' in patch) return { ...next, ...withLength(next, len) }
  return next
}

function LengthSelect({ o, onChange }) {
  const cur = inferLength(o)
  const custom = isMulti(o) ? `Thru ${short(lastDay(o))}${o.endTime ? `, ${fmtTime(o.endTime)}` : ''}` : o.endTime ? `Until ${fmtTime(o.endTime)}` : ''
  return (
    <select className="len-select small" value={cur} onChange={(e) => onChange(e.target.value)} aria-label={`Length on ${short(o.date)}`}>
      <option value="">Length?</option>
      {cur === 'keep' && <option value="keep">{custom}</option>}
      {LENGTHS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}
