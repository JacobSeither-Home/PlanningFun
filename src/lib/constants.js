export const CATEGORIES = [
  { id: 'out', label: 'Out & about', emoji: '🎡', color: 'var(--c-jade)' },
  { id: 'food', label: 'Food & drink', emoji: '🍜', color: 'var(--c-flamingo)' },
  { id: 'trip', label: 'Trips', emoji: '🧳', color: 'var(--c-teal)' },
  { id: 'home', label: 'At home', emoji: '🛋️', color: 'var(--c-plum)' },
  { id: 'active', label: 'Active', emoji: '🥾', color: 'var(--c-moss)' },
  { id: 'event', label: 'Shows & events', emoji: '🎟️', color: 'var(--c-gold)' },
]
export const catOf = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0]

export const SECTIONS = [
  { id: 'packing', label: 'Packing', emoji: '🎒', placeholder: 'Add something to pack' },
  { id: 'reservations', label: 'Reservations', emoji: '📞', placeholder: 'Add a reservation or ticket' },
  { id: 'meals', label: 'Meals', emoji: '🥪', placeholder: 'Add a meal or snack' },
]

export const COST = ['Free', '$', '$$', '$$$']

// The two of us. Busy times are tagged with one of these ids.
export const PEOPLE = [
  { id: 'jacob', name: 'Jacob', email: 'jacobseither@gmail.com', color: 'var(--c-jade)' },
  { id: 'caroline', name: 'Caroline', email: 'caroline.francescangeli@gmail.com', color: 'var(--c-flamingo)' },
]
export const personOf = (id) => PEOPLE.find((p) => p.id === id) || PEOPLE[0]
export const personForEmail = (email) => PEOPLE.find((p) => p.email === (email || '').toLowerCase()) || PEOPLE[0]

// For a busy entry and a day ('yyyy-MM-dd'): the part of that day it covers.
// Multi-day entries use the start time on the first day and the end time on the last;
// days in between are full. Returns fractions of the day (0..1) plus a label.
const frac = (t) => { const [h, m] = t.split(':').map(Number); return (h * 60 + m) / 1440 }
const fmt12 = (t) => {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}${m ? ':' + String(m).padStart(2, '0') : ''}${h >= 12 ? 'pm' : 'am'}`
}
export function busySlice(b, day) {
  const end = b.end && b.end >= b.start ? b.end : b.start
  const first = day === b.start, last = day === end
  const from = first && b.from ? b.from : ''
  const to = last && b.to ? b.to : ''
  let s = from ? frac(from) : 0
  let e = to ? frac(to) : 1
  if (e <= s) e = Math.min(1, s + 0.06)
  const label = from && to ? `${fmt12(from)}–${fmt12(to)}`
    : from ? `From ${fmt12(from)}` : to ? `Until ${fmt12(to)}` : 'All day'
  return { s, e, contL: !first, contR: !last, label, multi: end !== b.start }
}
