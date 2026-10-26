// The journal: plans whose dates have passed (or that were marked done), with
// whether we went, how it was, and notes for next time. Fields on an activity:
// went: true | false (unset = not answered yet), rating: one of RATINGS ids,
// journalNotes: text.
import { format } from 'date-fns'
import { lastDay } from './when'

export const RATINGS = [
  { id: 'loved', icon: '😍', label: 'Loved it' },
  { id: 'good', icon: '🙂', label: 'Good' },
  { id: 'meh', icon: '😐', label: 'Meh' },
  { id: 'nope', icon: '👎', label: 'Not again' },
]
export const ratingOf = (id) => RATINGS.find((r) => r.id === id)

const todayStr = () => format(new Date(), 'yyyy-MM-dd')

// A maybe whose every option is already over.
export const maybeExpired = (a, today = todayStr()) =>
  !a.date && (a.options || []).length > 0 && a.options.every((o) => lastDay(o) < today)

// Belongs in the journal rather than Coming up / Maybe / Someday.
export const inJournal = (a, today = todayStr()) =>
  !!a.done || (!!a.date && lastDay(a) < today) || maybeExpired(a, today)

// The day it happened (or would have), for sorting and "last time" notes.
export const journalDay = (a) => a.date ? lastDay(a) : (a.options || []).map(lastDay).sort().pop() || ''

// Other times we went to the same or a similar thing, newest first.
// Similar = same name, one name inside the other ("Symphony" / "Arkansas Symphony
// Holiday Pops"), or sharing a distinctive word. Generic words don't count.
const norm = (t = '') => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const GENERIC = new Set(('the a an and of at in on to for with our my at by from up out ' +
  'night day dinner lunch brunch breakfast drinks date trip weekend party show concert festival fest event ' +
  'park game games walk visit tour class new old little big best first last time').split(' '))
const words = (t) => norm(t).split(' ').filter((w) => w.length >= 4 && !GENERIC.has(w))
export function sameish(x, y) {
  const a = norm(x), b = norm(y)
  if (!a || !b) return false
  if (a === b) return true
  if (Math.min(a.length, b.length) >= 5 && (a.includes(b) || b.includes(a))) return true
  const wb = new Set(words(y))
  return words(x).some((w) => wb.has(w))
}
export const pastVisits = (all, a) =>
  all.filter((x) => x.id !== a.id && x.went === true && sameish(x.title, a.title))
    .sort((x, y) => journalDay(y).localeCompare(journalDay(x)))

// For the Add screen: things we went to that look like what's being typed, or that
// happened around this date (within 10 days) in an earlier year.
export function hintsFor(all, title, date) {
  const went = all.filter((x) => x.went === true)
  const byName = title.trim().length >= 3 ? went.filter((x) => sameish(x.title, title)) : []
  const near = (d) => {
    if (!date || !d || d.slice(0, 4) >= date.slice(0, 4)) return false
    const t = new Date(`${date.slice(0, 4)}-${d.slice(5)}T12:00`)
    return Math.abs(t - new Date(`${date}T12:00`)) <= 10 * 864e5
  }
  const byDate = went.filter((x) => !byName.includes(x) && near(journalDay(x)))
  const sort = (l) => l.sort((x, y) => journalDay(y).localeCompare(journalDay(x)))
  return { byName: sort(byName).slice(0, 2), byDate: sort(byDate).slice(0, 1) }
}
