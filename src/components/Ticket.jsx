import { format, parseISO } from 'date-fns'
import { catOf, COST } from '../lib/constants'
import { spanText } from '../lib/when'

// An activity drawn as a ticket stub. The stub color is the category.
export default function Ticket({ activity: a, onOpen, compact, dragProps, dragging, ghost, extra }) {
  const cat = catOf(a.category)
  const items = a.items || []
  const left = items.filter((i) => !i.done).length
  const options = !a.date ? (a.options || []) : []
  const maybe = ghost || options.length > 0
  return (
    <button
      type="button"
      className={`ticket${compact ? ' compact' : ''}${a.done ? ' done' : ''}${dragging ? ' dragging' : ''}${maybe ? ' maybe' : ''}${extra ? ' ' + extra : ''}`}
      style={{ '--cat': cat.color }}
      onClick={() => onOpen?.(a.id)}
      {...dragProps}
    >
      <span className="ticket-stub" aria-hidden="true">{cat.emoji}</span>
      <span className="ticket-body">
        <span className="ticket-title">{maybe && !compact && <span className="maybe-tag">Maybe</span>}{a.title}</span>
        {!compact && (
          <span className="ticket-meta">
            {a.date && <span>{spanText(a)}</span>}
            {!a.date && !options.length && <span>{cat.label}</span>}
            {options.length > 0 && <span>{optionsText(options)}</span>}
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

// "Sat Oct 17, 2pm or Sun Oct 18, 7:30pm"
export const optionText = (o) => spanText(o)
export function optionsText(options) {
  const sorted = [...options].sort((x, y) => (x.date + (x.time || '')).localeCompare(y.date + (y.time || '')))
  return sorted.map(optionText).join(' or ')
}
