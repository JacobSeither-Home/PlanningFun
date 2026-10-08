import { useEffect, useRef, useState } from 'react'
import { catOf } from '../lib/constants'

// Shuffles through the candidates like a slot reel, then lands on one.
export default function Surprise({ kind, items, onClose, onPick }) {
  const [idx, setIdx] = useState(0)
  const [spinning, setSpinning] = useState(true)
  const [round, setRound] = useState(0)
  const btnRef = useRef(null)

  useEffect(() => {
    if (!items.length) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const final = Math.floor(Math.random() * items.length)
    if (reduce || items.length < 2) { setIdx(final); setSpinning(false); return }
    setSpinning(true)
    let i = Math.floor(Math.random() * items.length)
    let delay = 45
    let t
    const tick = () => {
      i = (i + 1) % items.length
      setIdx(i)
      delay *= 1.13
      if (delay > 320 && i === final) { setSpinning(false); return }
      t = setTimeout(tick, delay > 320 ? 120 : delay)
    }
    t = setTimeout(tick, delay)
    return () => clearTimeout(t)
  }, [items, round])

  useEffect(() => { if (!spinning) btnRef.current?.focus() }, [spinning])
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const item = items[idx]
  if (!item) return null
  const color = kind === 'idea' ? catOf(item.category).color : 'var(--grape)'
  const emoji = kind === 'idea' ? catOf(item.category).emoji : item.kind === 'show' ? '📺' : '🎬'

  return (
    <div className="surprise-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`surprise${spinning ? ' spinning' : ' landed'}`} style={{ '--cat': color }} role="dialog" aria-modal="true" aria-label="Surprise pick">
        <p className="surprise-kicker">{spinning ? 'Shuffling…' : kind === 'idea' ? 'How about' : 'Tonight’s pick'}</p>
        <div className="surprise-card" aria-live={spinning ? 'off' : 'assertive'}>
          <span className="surprise-emoji" aria-hidden="true">{emoji}</span>
          <span className="surprise-title" key={idx}>{item.title}</span>
        </div>
        <div className="row center">
          <button className="btn ghost" disabled={spinning} onClick={() => setRound(round + 1)}>Spin again</button>
          <button ref={btnRef} className="btn primary" disabled={spinning} onClick={() => (kind === 'idea' ? onPick(item) : onClose())}>
            {kind === 'idea' ? 'Plan it' : 'Sounds good'}
          </button>
        </div>
      </div>
    </div>
  )
}
