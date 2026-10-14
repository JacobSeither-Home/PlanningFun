// Holidays and our special days, worked out from rules so nothing is stored.
// Federal holidays follow 5 U.S.C. § 6103(a); the rest are common US observances.

// Our own days, every year. Add more here: { md: 'MM-DD', name, icon }.
export const SPECIAL_DAYS = [
  { md: '11-01', name: 'Caroline’s birthday', icon: '🎂' },
]

const pad = (n) => String(n).padStart(2, '0')
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`
// nth weekday of a month (n = -1 for last); weekday 0 = Sunday
function nth(y, m, weekday, n) {
  if (n > 0) {
    const first = new Date(y, m - 1, 1).getDay()
    return iso(y, m, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7)
  }
  const lastDate = new Date(y, m, 0).getDate()
  const last = new Date(y, m - 1, lastDate).getDay()
  return iso(y, m, lastDate - ((last - weekday + 7) % 7))
}
// Western Easter (anonymous Gregorian algorithm)
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451)
  return iso(y, Math.floor((h + l - 7 * m + 114) / 31), ((h + l - 7 * m + 114) % 31) + 1)
}

const cache = {}
function forYear(y) {
  if (cache[y]) return cache[y]
  const list = [
    // federal
    [iso(y, 1, 1), 'New Year’s Day', '🎆'],
    [nth(y, 1, 1, 3), 'MLK Day', '★'],
    [nth(y, 2, 1, 3), 'Presidents’ Day', '★'],
    [nth(y, 5, 1, -1), 'Memorial Day', '★'],
    [iso(y, 6, 19), 'Juneteenth', '★'],
    [iso(y, 7, 4), 'Independence Day', '🎆'],
    [nth(y, 9, 1, 1), 'Labor Day', '★'],
    [nth(y, 10, 1, 2), 'Columbus Day', '★'],
    [iso(y, 11, 11), 'Veterans Day', '★'],
    [nth(y, 11, 4, 4), 'Thanksgiving', '🦃'],
    [iso(y, 12, 25), 'Christmas', '🎄'],
    // observances
    [iso(y, 2, 14), 'Valentine’s Day', '♥'],
    [iso(y, 3, 17), 'St. Patrick’s Day', '☘'],
    [easter(y), 'Easter', '🐣'],
    [nth(y, 5, 0, 2), 'Mother’s Day', '💐'],
    [nth(y, 6, 0, 3), 'Father’s Day', '👔'],
    [iso(y, 10, 31), 'Halloween', '🎃'],
    [iso(y, 12, 24), 'Christmas Eve', '🎄'],
    [iso(y, 12, 31), 'New Year’s Eve', '🥂'],
  ]
  const map = {}
  for (const [d, name, icon] of list) (map[d] ||= []).push({ name, icon })
  return (cache[y] = map)
}

// Everything special about one day ('yyyy-MM-dd').
export function dayInfo(day) {
  const holidays = forYear(Number(day.slice(0, 4)))[day] || []
  const special = SPECIAL_DAYS.filter((s) => s.md === day.slice(5))
  return { holidays, special }
}
