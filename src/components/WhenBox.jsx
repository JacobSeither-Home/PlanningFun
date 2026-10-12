import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import TimePicker from './TimePicker'
import Votes from './Votes'
import { useBackend } from '../lib/hooks'
import { uid } from '../lib/store'
import { openIcs } from '../lib/ics'
import { isMulti, lastDay } from '../lib/when'

const sortOpts = (o) => [...(o || [])].sort((x, y) => (x.date + (x.time || '')).localeCompare(y.date + (y.time || '')))
const short = (d) => format(parseISO(d), 'EEE, MMM d')

// Top of an activity: Booked (start/end) or Maybe (several possible spans to choose from).
export default function WhenBox({ a }) {
  const be = useBackend()
  const save = (patch) => be.update('activities', a.id, patch)
  const options = sortOpts(a.options)
  const derived = a.date ? 'booked' : options.length ? 'maybe' : null
  const [mode, setMode] = useState(derived || 'booked')
  const [hint, setHint] = useState('')
  useEffect(() => { if (derived) setMode(derived) }, [derived])

  const choose = (o) => {
    save({ date: o.date, time: o.time || '', endDate: o.endDate || null, endTime: o.endTime || '', options: [] })
    setHint('')
  }
  const toMaybe = () => {
    setHint('')
    if (a.date) {
      save({
        date: null, time: '', endDate: null, endTime: '',
        options: [{ id: uid(), date: a.date, time: a.time || '', endDate: a.endDate || null, endTime: a.endTime || '' }, ...(a.options || [])],
      })
    }
    setMode('maybe')
  }
  const toBooked = () => {
    if (options.length === 1) choose(options[0])
    else if (options.length > 1) setHint('Tap Choose on the option you picked.')
    else setMode('booked')
  }

  return (
    <section className="when" aria-label="When">
      <div className="when-head">
        <h3>When</h3>
        <div className="seg small" role="radiogroup" aria-label="Booked or maybe">
          <button type="button" role="radio" aria-checked={mode === 'booked'} onClick={toBooked}>Booked</button>
          <button type="button" role="radio" aria-checked={mode === 'maybe'} onClick={toMaybe}>Maybe</button>
        </div>
      </div>
      {hint && <p className="small when-hint" role="status">{hint}</p>}

      {mode === 'booked' ? (
        <>
          <div className="when-grid">
            <div className="field">
              <label htmlFor="when-start">Starts</label>
              <input id="when-start" type="date" value={a.date || ''} onChange={(e) => {
                const v = e.target.value || null
                save(v
                  ? { date: v, ...(a.endDate && a.endDate <= v ? { endDate: null } : {}) }
                  : { date: null, time: '', endDate: null, endTime: '' })
              }} />
            </div>
            <div className="field">
              <span>Start time</span>
              <TimePicker label="Start time" value={a.time || ''} disabled={!a.date}
                emptyLabel={a.date ? 'Any time' : 'Pick a date first'} onChange={(time) => save({ time })} />
            </div>
            <div className="field">
              <label htmlFor="when-end">Ends <span className="muted">(for multi-day)</span></label>
              <input id="when-end" type="date" value={a.endDate || ''} min={a.date || undefined} disabled={!a.date}
                onChange={(e) => { const v = e.target.value; save({ endDate: v && v > a.date ? v : null }) }} />
            </div>
            <div className="field">
              <span>End time</span>
              <TimePicker label="End time" value={a.endTime || ''} disabled={!a.date} emptyLabel="Optional"
                onChange={(endTime) => save({ endTime })} />
            </div>
          </div>
          {a.date && (
            <div className="date-links">
              {isMulti(a) && <span className="muted small">{Math.round((parseISO(lastDay(a)) - parseISO(a.date)) / 864e5) + 1} days</span>}
              <button type="button" className="link make-maybe" onClick={() => openIcs(a)}>Add to phone calendar</button>
              <button type="button" className="link make-maybe" onClick={() => save({ date: null, time: '', endDate: null, endTime: '' })}>Clear dates</button>
            </div>
          )}
        </>
      ) : (
        <MaybeOptions a={a} options={options} save={save} choose={choose} />
      )}
    </section>
  )
}

function MaybeOptions({ a, options, save, choose }) {
  const last = options[options.length - 1]
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [end, setEnd] = useState('')
  const [k, setK] = useState(0)
  const start = date || last?.date || ''
  const add = () => {
    if (!start) return
    save({ options: [...options, { id: uid(), date: start, time, endDate: end && end > start ? end : null, endTime: '' }] })
    setTime(''); setEnd(''); setK((n) => n + 1)
  }
  return (
    <>
      <p className="muted small">Add each date or time you’re choosing between. They show faded on the calendar until you choose one.</p>
      {options.length > 0 && (
        <ul className="maybe-list">
          {options.map((o) => (
            <li key={o.id}>
              <span className="maybe-when">
                {short(o.date)}{isMulti(o) && <span className="maybe-thru"> – {short(lastDay(o))}</span>}
              </span>
              <div className="maybe-time">
                <TimePicker label={`Time on ${format(parseISO(o.date), 'MMM d')}`} value={o.time || ''} emptyLabel="Any time"
                  onChange={(t) => save({ options: options.map((x) => (x.id === o.id ? { ...x, time: t } : x)) })} />
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
          <span>Starts</span>
          <input type="date" value={start} onChange={(e) => setDate(e.target.value)} aria-label="Possible start date" />
        </div>
        <div className="field">
          <span>Time</span>
          <TimePicker key={k} label="Possible time" value={time} onChange={setTime} emptyLabel="Any time" />
        </div>
        <div className="field">
          <span>Through <span className="muted">(optional)</span></span>
          <input type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} aria-label="Possible end date" />
        </div>
        <button type="button" className="btn small" disabled={!start} onClick={add}>
          {options.length ? 'Add another option' : 'Add option'}
        </button>
      </div>
      {options.length > 0 && (
        <button type="button" className="link make-maybe" onClick={() => save({ options: [] })}>Not doing it, clear the options</button>
      )}
    </>
  )
}
