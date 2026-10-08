import { format, parseISO } from 'date-fns'
import { catOf, COST } from '../lib/constants'

// An activity drawn as a ticket stub. The stub color is the category.
export default function Ticket({ activity: a, onOpen, compact, dragProps, dragging }) {
  const cat = catOf(a.category)
  const items = a.items || []
  const left = items.filter((i) => !i.done).length
  return (
    <button
      type="button"
      className={`ticket${compact ? ' compact' : ''}${a.done ? ' done' : ''}${dragging ? ' dragging' : ''}`}
      style={{ '--cat': cat.color }}
      onClick={() => onOpen?.(a.id)}
      {...dragProps}
    >
      <span className="ticket-stub" aria-hidden="true">{cat.emoji}</span>
      <span className="ticket-body">
        <span className="ticket-title">{a.title}</span>
        {!compact && (
          <span className="ticket-meta">
            {a.date && <span>{format(parseISO(a.date), 'EEE MMM d')}{a.time ? `, ${fmtTime(a.time)}` : ''}</span>}
            {!a.date && <span>{cat.label}</span>}
            {a.location && <span>{a.location}</span>}
            {a.cost != null && a.cost !== '' && <span>{COST[a.cost]}</span>}
            {items.length > 0 && <span>{left ? `${left} to do` : 'All set'}</span>}
          </span>
        )}
      </span>
    </button>
  )
}

export function fmtTime(t) {
  const [h, m] = t.split(':').map(Number)
  const ap = h >= 12 ? 'pm' : 'am'
  const hh = h % 12 || 12
  return m ? `${hh}:${String(m).padStart(2, '0')}${ap}` : `${hh}${ap}`
}
