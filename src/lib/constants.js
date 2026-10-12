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
