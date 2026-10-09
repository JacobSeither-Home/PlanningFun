// Drink types and the 1–10 rating scale (1 = gross, 10 = awesome).

export const DEFAULT_KINDS = [
  {
    id: 'old-fashioned', label: 'Old Fashioned', emoji: '🥃', typeLabel: 'Spirit',
    types: ['Bourbon', 'Rye', 'Smoked', 'Brandy', 'Rum', 'Mezcal'],
  },
  {
    id: 'beer', label: 'Beer', emoji: '🍺', typeLabel: 'Type',
    types: ['IPA', 'Hazy IPA', 'Pale Ale', 'Lager', 'Pilsner', 'Amber', 'Wheat', 'Sour', 'Stout', 'Porter'],
  },
]

export const KIND_EMOJI = ['🍸', '🍹', '🥃', '🍺', '🍷', '🥂', '🍾', '🍶', '🧉', '🍋']

// Custom types live in the shared 'drinkKinds' collection.
export const allKinds = (custom) => [
  ...DEFAULT_KINDS,
  ...custom
    .slice()
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .map((k) => ({ typeLabel: 'Type', types: [], ...k, custom: true })),
]

export const kindOf = (kinds, id) =>
  kinds.find((k) => k.id === id) || { id, label: 'Drink', emoji: '🍸', typeLabel: 'Type', types: [] }

const WORDS = ['Gross', 'Yuck', 'Bad', 'Meh', 'Fine', 'Decent', 'Good', 'Great', 'Amazing', 'Awesome']
const FACES = ['🤢', '🤢', '😬', '😬', '😐', '😐', '🙂', '😋', '🤩', '🤩']
// Bile green for gross, through gray, to hot pink for awesome. Text on these is always dark ink.
const COLORS = ['#8FA83A', '#A3AE4E', '#B5B36E', '#BDB79A', '#B9B6C4', '#C8A6DA', '#D894D9', '#E77EC6', '#F46CAC', '#FF5C8A']

export const scoreWord = (n) => WORDS[Math.round(n) - 1]
export const scoreFace = (n) => FACES[Math.round(n) - 1]
export const scoreColor = (n) => COLORS[Math.round(n) - 1]

export const ratingList = (drink) =>
  Object.entries(drink.ratings || {})
    .map(([uid, r]) => ({ uid, ...r }))
    .filter((r) => r.score >= 1)

export const avgScore = (drink) => {
  const r = ratingList(drink)
  return r.length ? r.reduce((s, x) => s + x.score, 0) / r.length : null
}

export const fmtScore = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

export const drinkTitle = (d, kind) => d.name || [d.type, kind.label].filter(Boolean).join(' ')
