import { useState } from 'react'
import {
  addDays, addMonths, endOfMonth, endOfWeek, format, isSameMonth, parseISO, startOfMonth, startOfWeek,
} from 'date-fns'

const ymd = (d) => format(d, 'yyyy-MM-dd')

// Tap-only date picker. Replaces the phone's native date field, whose calendar
// on iPhone could close the instant it opened.
// value/onChange use 'yyyy-MM-dd' or ''. `min` greys out earlier days; `openTo`
// is the month to show when empty (an end date opens on its start date's month);
// `mark` highlights a reference day (the start date).
export default function DatePicker({
  value, onChange, label = 'Date', disabled, emptyLabel = 'Pick a date', min, openTo, mark, clearable,
}) {
  const [open, setOpen] = useState(false)
  const today = ymd(new Date())
  const [month, setMonth] = useState(() => startOfMonth(parseISO(value || openTo || ymd(new Date()))))
  const toggle = () => {
    if (!open) setMonth(startOfMonth(parseISO(value || openTo || ymd(new Date()))))
    setOpen(!open)
  }
  const pick = (d) => { onChange(d); setOpen(false) }

  const days = []
  for (let d = startOfWeek(startOfMonth(month)); d <= endOfWeek(endOfMonth(month)); d = addDays(d, 1)) days.push(d)

  return (
    <div className="tp dp">
      <button type="button" className={`tp-value${value ? ' set' : ''}`} disabled={disabled}
        aria-expanded={open} aria-label={`${label}: ${value ? format(parseISO(value), 'EEEE, MMMM d, yyyy') : 'none'}`}
        onClick={toggle}>
        {value ? format(parseISO(value), value.slice(0, 4) === today.slice(0, 4) ? 'EEE, MMM d' : 'EEE, MMM d, yyyy') : emptyLabel}
      </button>
      {open && !disabled && (
        <div className="tp-panel dp-panel">
          <div className="dp-head">
            <button type="button" className="icon-btn" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <b>{format(month, 'MMMM yyyy')}</b>
            <button type="button" className="icon-btn" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
          <div className="dp-grid" role="grid" aria-label={format(month, 'MMMM yyyy')}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} className="dp-dow" aria-hidden="true">{d}</span>)}
            {days.map((d) => {
              const id = ymd(d)
              const off = !!min && id < min
              return (
                <button key={id} type="button" disabled={off}
                  className={`${isSameMonth(d, month) ? '' : 'out'}${id === today ? ' today' : ''}${id === mark ? ' mark' : ''}`}
                  aria-pressed={id === value} aria-label={format(d, 'EEEE, MMMM d')}
                  onClick={() => pick(id)}>
                  {format(d, 'd')}
                </button>
              )
            })}
          </div>
          <div className="tp-row">
            <button type="button" className="link" disabled={!!min && today < min}
              onClick={() => { setMonth(startOfMonth(new Date())); if (!min || today >= min) pick(today) }}>Today</button>
            <span className="row">
              {clearable && value && <button type="button" className="link" onClick={() => pick('')}>Clear</button>}
              <button type="button" className="btn small" onClick={() => setOpen(false)}>Close</button>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
