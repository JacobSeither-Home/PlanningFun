import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import Sheet from './Sheet'
import { useBackend } from '../lib/hooks'
import { kindOf, ratingList, scoreColor, scoreFace, scoreWord } from '../lib/drinks'

// Add a new drink (drink = null) or edit one. You set your own rating;
// the other person's rating shows alongside it.
export default function DrinkSheet({ drink, drinks, kinds, initialKind, onClose }) {
  const be = useBackend()
  const me = be.me()
  const [f, setF] = useState(() => ({
    kind: drink?.kind || initialKind || kinds[0].id,
    name: drink?.name || '',
    place: drink?.place || '',
    type: drink?.type || '',
    date: drink?.date || format(new Date(), 'yyyy-MM-dd'),
    price: drink?.price ?? '',
    notes: drink?.notes || '',
  }))
  const [score, setScore] = useState(drink?.ratings?.[me.uid]?.score || null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const kind = kindOf(kinds, f.kind)
  const others = drink ? ratingList(drink).filter((r) => r.uid !== me.uid) : []

  const places = useMemo(() => uniq(drinks.map((d) => d.place)), [drinks])
  const types = useMemo(
    () => uniq([...drinks.filter((d) => d.kind === f.kind).map((d) => d.type), ...kind.types]),
    [drinks, f.kind, kind],
  )

  const save = async (e) => {
    e?.preventDefault()
    if (!score) return
    const data = {
      kind: f.kind, name: f.name.trim(), place: f.place.trim(), type: f.type.trim(),
      date: f.date || null, price: f.price === '' ? null : Number(f.price), notes: f.notes.trim(),
    }
    const mine = { name: me.name, score }
    if (drink) await be.update('drinks', drink.id, { ...data, [`ratings.${me.uid}`]: mine })
    else await be.add('drinks', { ...data, ratings: { [me.uid]: mine } })
    onClose()
  }

  return (
    <Sheet
      title={drink ? 'Edit drink' : 'Rate a drink'}
      onClose={onClose}
      footer={confirmDelete ? (
        <>
          <span className="muted">Delete this rating for both of you?</span>
          <button className="btn ghost" onClick={() => setConfirmDelete(false)}>Keep it</button>
          <button className="btn danger" onClick={async () => { onClose(); await be.remove('drinks', drink.id) }}>Delete</button>
        </>
      ) : (
        <>
          {drink && <button className="btn ghost" onClick={() => setConfirmDelete(true)}>Delete</button>}
          {!score && <span className="muted">Pick a score to save</span>}
          <button className="btn primary" disabled={!score} onClick={save}>{drink ? 'Save changes' : 'Save rating'}</button>
        </>
      )}
    >
      <h2 className="sheet-title">{drink ? 'Edit drink' : 'Rate a drink'}</h2>
      <form onSubmit={save} className="drink-form">
        <div className="chips scroll" role="radiogroup" aria-label="Drink type">
          {kinds.map((k) => (
            <button key={k.id} type="button" role="radio" aria-checked={f.kind === k.id}
              className="chip" style={{ '--cat': 'var(--c-flamingo)' }} onClick={() => setF({ ...f, kind: k.id })}>
              <span aria-hidden="true">{k.emoji}</span> {k.label}
            </button>
          ))}
        </div>

        <div className="grid2">
          <label className="field">
            <span>Where</span>
            <input data-autofocus value={f.place} onChange={set('place')} list="drink-places" placeholder="Bar or restaurant" />
          </label>
          <label className="field">
            <span>{kind.typeLabel}</span>
            <input value={f.type} onChange={set('type')} list="drink-types"
              placeholder={kind.types.slice(0, 2).join(', ') || 'Optional'} />
          </label>
        </div>
        <label className="field">
          <span>Name on the menu</span>
          <input value={f.name} onChange={set('name')} placeholder="Optional" />
        </label>

        <fieldset className="rate">
          <legend>Your rating</legend>
          <div className="rate-readout" aria-live="polite" style={{ '--score': score ? scoreColor(score) : 'var(--sunken)' }}>
            {score ? (
              <>
                <span className="rate-face" aria-hidden="true">{scoreFace(score)}</span>
                <span className="rate-num">{score}</span>
                <span className="rate-word">{scoreWord(score)}</span>
              </>
            ) : <span className="rate-word muted">Tap a number</span>}
          </div>
          <div className="rate-scale" role="radiogroup" aria-label="Score from 1, gross, to 10, awesome">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" role="radio" aria-checked={score === n}
                aria-label={`${n}, ${scoreWord(n)}`}
                style={{ '--score': scoreColor(n) }} onClick={() => setScore(n)}>{n}</button>
            ))}
          </div>
          <div className="rate-ends" aria-hidden="true"><span>🤢 Gross</span><span>Awesome 🤩</span></div>
          {others.map((r) => (
            <p key={r.uid} className="muted small">{r.name} gave it {r.score}, {scoreWord(r.score).toLowerCase()} {scoreFace(r.score)}</p>
          ))}
        </fieldset>

        <div className="grid2">
          <label className="field">
            <span>Date</span>
            <input type="date" value={f.date} onChange={set('date')} />
          </label>
          <label className="field">
            <span>Price</span>
            <input type="number" inputMode="decimal" min="0" step="0.5" value={f.price} onChange={set('price')} placeholder="$" />
          </label>
        </div>
        <label className="field">
          <span>Notes</span>
          <textarea rows={2} value={f.notes} onChange={set('notes')} placeholder="Too sweet, great orange peel, ask for Eric…" />
        </label>

        <datalist id="drink-places">{places.map((p) => <option key={p} value={p} />)}</datalist>
        <datalist id="drink-types">{types.map((t) => <option key={t} value={t} />)}</datalist>
      </form>
    </Sheet>
  )
}

const uniq = (arr) => [...new Set(arr.map((s) => (s || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
