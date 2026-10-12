import { useBackend } from '../lib/hooks'
import { PEOPLE, personForEmail } from '../lib/constants'

export const agreed = (o) => PEOPLE.every((p) => o.votes?.[p.id])

// "Works for me" hearts on a maybe option. You can tap your own; the other person's shows.
export default function Votes({ activity, option }) {
  const be = useBackend()
  const me = personForEmail(be.me()?.email).id
  const toggle = () => {
    const options = (activity.options || []).map((o) =>
      o.id === option.id ? { ...o, votes: { ...(o.votes || {}), [me]: !o.votes?.[me] } } : o)
    be.update('activities', activity.id, { options })
  }
  return (
    <span className={`votes${agreed(option) ? ' both' : ''}`}>
      {PEOPLE.map((p) => {
        const on = !!option.votes?.[p.id]
        const props = { className: `vote${on ? ' on' : ''}`, style: { '--who': p.color } }
        return p.id === me ? (
          <button key={p.id} type="button" {...props} aria-pressed={on} onClick={toggle}
            aria-label={on ? `${p.name}: works for me (tap to undo)` : `${p.name}: tap if this works for you`}>
            {on ? '♥' : '♡'} {p.name[0]}
          </button>
        ) : (
          <span key={p.id} {...props} aria-label={`${p.name}: ${on ? 'works' : 'no answer yet'}`}>{on ? '♥' : '♡'} {p.name[0]}</span>
        )
      })}
    </span>
  )
}
