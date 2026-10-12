import { useState } from 'react'
import { fmtTime } from './Ticket'

// Tap-only time picker. Replaces the phone's native time wheel, which on
// iPhone could pass a stray tap through to the date field and open the calendar.
// value/onChange use 'HH:mm' (24-hour) or '' for no time.
export default function TimePicker({ value, onChange, label = 'Time', disabled, emptyLabel = 'Add a time' }) {
  const [open, setOpen] = useState(false)
  const [h, m] = value ? value.split(':').map(Number) : [null, 0]
  const [hour, setHour] = useState(h == null ? null : (h % 12 || 12))
  const [min, setMin] = useState(m)
  const [pm, setPm] = useState(h == null ? true : h >= 12)

  const commit = (nh = hour, nm = min, npm = pm) => {
    if (nh == null) return
    const h24 = (nh % 12) + (npm ? 12 : 0)
    onChange(`${String(h24).padStart(2, '0')}:${String(nm).padStart(2, '0')}`)
  }
  const pick = (patch) => {
    const nh = patch.hour ?? hour, nm = patch.min ?? min, npm = patch.pm ?? pm
    if ('hour' in patch) setHour(nh)
    if ('min' in patch) setMin(nm)
    if ('pm' in patch) setPm(npm)
    commit(nh, nm, npm)
  }

  return (
    <div className="tp">
      <button type="button" className={`tp-value${value ? ' set' : ''}`} disabled={disabled}
        aria-expanded={open} aria-label={`${label}: ${value ? fmtTime(value) : 'none'}`}
        onClick={() => setOpen(!open)}>
        {value ? fmtTime(value) : emptyLabel}
      </button>
      {open && !disabled && (
        <div className="tp-panel">
          <div className="tp-hours" role="radiogroup" aria-label="Hour">
            {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={hour === n} onClick={() => pick({ hour: n })}>{n}</button>
            ))}
          </div>
          <div className="tp-row">
            <div className="seg small" role="radiogroup" aria-label="Minutes">
              {[0, 15, 30, 45].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={min === n} onClick={() => pick({ min: n })}>:{String(n).padStart(2, '0')}</button>
              ))}
            </div>
            <div className="seg small" role="radiogroup" aria-label="AM or PM">
              <button type="button" role="radio" aria-checked={!pm} onClick={() => pick({ pm: false })}>am</button>
              <button type="button" role="radio" aria-checked={pm} onClick={() => pick({ pm: true })}>pm</button>
            </div>
          </div>
          <div className="tp-row end">
            {value && <button type="button" className="link" onClick={() => { onChange(''); setHour(null); setOpen(false) }}>No time</button>}
            <button type="button" className="btn small primary" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  )
}
