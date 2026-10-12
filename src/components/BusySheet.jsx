import { useState } from 'react'
import Sheet from './Sheet'
import TimePicker from './TimePicker'
import { useBackend } from '../lib/hooks'
import { PEOPLE, personForEmail } from '../lib/constants'

// Add or edit a time when one of us is busy on our own.
export default function BusySheet({ busy, date, onClose }) {
  const be = useBackend()
  const me = be.me()
  const [f, setF] = useState(() => ({
    person: busy?.person || personForEmail(me?.email).id,
    start: busy?.start || date,
    end: busy?.end || busy?.start || date,
    from: busy?.from || '',
    to: busy?.to || '',
    note: busy?.note || '',
  }))
  const [allDay, setAllDay] = useState(busy ? !busy.from : true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = (patch) => setF((x) => ({ ...x, ...patch }))
  const valid = f.start && f.end >= f.start

  const save = async () => {
    if (!valid) return
    const data = {
      person: f.person, start: f.start, end: f.end,
      from: allDay ? '' : f.from, to: allDay ? '' : f.to, note: f.note.trim(),
    }
    if (busy) await be.update('busy', busy.id, data)
    else await be.add('busy', data)
    onClose()
  }

  return (
    <Sheet
      title={busy ? 'Edit busy time' : 'Mark busy'}
      onClose={onClose}
      footer={confirmDelete ? (
        <>
          <span className="muted">Delete this busy time?</span>
          <button className="btn ghost" onClick={() => setConfirmDelete(false)}>Keep it</button>
          <button className="btn danger" onClick={async () => { onClose(); await be.remove('busy', busy.id) }}>Delete</button>
        </>
      ) : (
        <>
          {busy && <button className="btn ghost" onClick={() => setConfirmDelete(true)}>Delete</button>}
          <button className="btn primary" disabled={!valid} onClick={save}>{busy ? 'Save changes' : 'Save busy time'}</button>
        </>
      )}
    >
      <h2 className="sheet-title">{busy ? 'Edit busy time' : 'Mark busy'}</h2>

      <div className="field">
        <span id="busy-who">Who’s busy</span>
        <div className="chips" role="radiogroup" aria-labelledby="busy-who">
          {PEOPLE.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={f.person === p.id}
              className="chip" style={{ '--cat': p.color }} onClick={() => set({ person: p.id })}>{p.name}</button>
          ))}
        </div>
      </div>

      <label className="field">
        <span>What</span>
        <input value={f.note} onChange={(e) => set({ note: e.target.value })} placeholder="Work trip, book club, dentist…" />
      </label>

      <div className="grid2">
        <label className="field">
          <span>From</span>
          <input type="date" value={f.start} onChange={(e) => {
            const start = e.target.value
            set({ start, end: !f.end || f.end < start ? start : f.end })
          }} />
        </label>
        <label className="field">
          <span>Through</span>
          <input type="date" value={f.end} min={f.start} onChange={(e) => set({ end: e.target.value })} />
        </label>
      </div>

      <div className="field">
        <span id="busy-when">Hours</span>
        <div className="seg small" role="radiogroup" aria-labelledby="busy-when">
          <button type="button" role="radio" aria-checked={allDay} onClick={() => setAllDay(true)}>All day</button>
          <button type="button" role="radio" aria-checked={!allDay} onClick={() => setAllDay(false)}>Set times</button>
        </div>
      </div>
      {!allDay && (
        <div className="grid2">
          <div className="field">
            <span>Starts</span>
            <TimePicker label="Starts" value={f.from} onChange={(from) => set({ from })} />
          </div>
          <div className="field">
            <span>Ends</span>
            <TimePicker label="Ends" value={f.to} onChange={(to) => set({ to })} />
          </div>
        </div>
      )}
    </Sheet>
  )
}
