// Monthly color themes. Only the accent pair, the wallpaper fan and the page tint
// change; text, buttons, gold trim, the nav, and category/person colors stay fixed.
// Accent "a" carries white text (today's date, add button) so each is >= 4.5:1 on white.

export const DEFAULT_THEME = { name: 'Classic', a: '#D63A72', b: '#C9A14A', light: '#FFEAF1', dark: '#0A2620', words: 'flamingo & gold' }

export const MONTH_THEMES = [
  { name: 'January', a: '#2C6A93', b: '#8FA6BF', light: '#EDF3F8', dark: '#0D1F2C', words: 'ice blue & silver' },
  { name: 'February', a: '#B52A55', b: '#D98AA5', light: '#FCEAF0', dark: '#250C16', words: 'rose & claret' },
  { name: 'March', a: '#237347', b: '#C9A21B', light: '#EDF6EC', dark: '#0C2216', words: 'shamrock & daffodil' },
  { name: 'April', a: '#7446AE', b: '#7FB069', light: '#F3EEFA', dark: '#1A1326', words: 'lilac & spring green' },
  { name: 'May', a: '#B83469', b: '#6FA35A', light: '#FDEEF3', dark: '#240F19', words: 'peony & leaf' },
  { name: 'June', a: '#8F5E00', b: '#4F9AD6', light: '#FBF4E2', dark: '#211808', words: 'sunflower & sky' },
  { name: 'July', a: '#0E6E77', b: '#F08A65', light: '#E8F5F4', dark: '#0A2224', words: 'teal & coral' },
  { name: 'August', a: '#B4511A', b: '#4E9A6E', light: '#FCEFE4', dark: '#24140A', words: 'tangerine & palm' },
  { name: 'September', a: '#8C6513', b: '#C26A4E', light: '#F8F0E0', dark: '#21180B', words: 'goldenrod & brick' },
  { name: 'October', a: '#B6501A', b: '#8E4A91', light: '#FBEDE3', dark: '#1E1120', words: 'pumpkin & plum' },
  { name: 'November', a: '#A3263F', b: '#8FAA7E', light: '#F6EEE9', dark: '#20120F', words: 'cranberry & sage' },
  { name: 'December', a: '#A8213A', b: '#3E8E62', light: '#EEF4EF', dark: '#0C1F15', words: 'berry & holly' },
]

const fan = (color) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='28' viewBox='0 0 56 28'><g fill='none' stroke='${color}' stroke-width='1.1'><path d='M1 28a27 27 0 0 1 54 0'/><path d='M9 28a19 19 0 0 1 38 0'/><path d='M17 28a11 11 0 0 1 22 0'/><path d='M28 28V17M28 28l-8-9M28 28l8-9'/></g></svg>`,
  )}")`

export function themeFor(month, enabled) {
  return enabled ? MONTH_THEMES[month] : DEFAULT_THEME
}

// Appearance: 'auto' follows the phone/computer setting; 'light' or 'dark' forces it.
export const loadAppearance = () => {
  try { return localStorage.getItem('pf:appearance') || 'auto' } catch { return 'auto' }
}
export const saveAppearance = (v) => {
  try { localStorage.setItem('pf:appearance', v) } catch { /* private mode */ }
}
export function applyAppearance(v) {
  const root = document.documentElement
  if (v === 'light' || v === 'dark') root.setAttribute('data-theme', v)
  else root.removeAttribute('data-theme')
}
const isDark = () => {
  const forced = document.documentElement.getAttribute('data-theme')
  return forced ? forced === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyTheme(t) {
  const s = document.documentElement.style
  s.setProperty('--m-a', t.a)
  s.setProperty('--m-b', t.b)
  s.setProperty('--m-light', t.light)
  s.setProperty('--m-dark', t.dark)
  s.setProperty('--fan', fan(t.b))
  // keep the phone's status bar in step with the page
  const dark = isDark()
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    // with a forced appearance, both tags carry the same color
    const forced = document.documentElement.getAttribute('data-theme')
    m.setAttribute('content', forced ? (dark ? t.dark : t.light) : m.media.includes('dark') ? t.dark : t.light)
  })
  return dark
}

// Per-device preference (each of you can turn it off on your own phone).
export const loadMonthColors = () => {
  try { return localStorage.getItem('pf:monthColors') !== 'off' } catch { return true }
}
export const saveMonthColors = (on) => {
  try { localStorage.setItem('pf:monthColors', on ? 'on' : 'off') } catch { /* private mode */ }
}
