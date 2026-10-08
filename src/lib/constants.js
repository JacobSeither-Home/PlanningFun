export const CATEGORIES = [
  { id: 'out', label: 'Out & about', emoji: '🎡', color: 'var(--sky)' },
  { id: 'food', label: 'Food & drink', emoji: '🍜', color: 'var(--mango)' },
  { id: 'trip', label: 'Trips', emoji: '🧳', color: 'var(--mint)' },
  { id: 'home', label: 'At home', emoji: '🛋️', color: 'var(--grape)' },
  { id: 'active', label: 'Active', emoji: '🥾', color: 'var(--coral)' },
  { id: 'event', label: 'Shows & events', emoji: '🎟️', color: 'var(--pink)' },
]
export const catOf = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0]

export const SECTIONS = [
  { id: 'packing', label: 'Packing', emoji: '🎒', placeholder: 'Add something to pack' },
  { id: 'reservations', label: 'Reservations', emoji: '📞', placeholder: 'Add a reservation or ticket' },
  { id: 'meals', label: 'Meals', emoji: '🥪', placeholder: 'Add a meal or snack' },
]

export const COST = ['Free', '$', '$$', '$$$']
