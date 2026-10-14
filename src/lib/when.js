// Dates that may span several days. Used by booked plans (date/time → endDate/endTime)
// and by maybe options, which have the same shape.
import { addDays, addMinutes, differenceInMinutes, format, parseISO } from 'date-fns'

const ymd = (d) => format(d, 'yyyy-MM-dd')
export const lastDay = (x) => (x.endDate && x.endDate > x.date ? x.endDate : x.date)
export const isMulti = (x) => !!x.date && lastDay(x) !== x.date

// Every day a span covers, first to last (capped so bad data can't run away).
export function spanDays(x) {
  if (!x.date) return []
  const out = []
  let d = parseISO(x.date)
  const end = lastDay(x)
  for (let i = 0; i < 62; i++) {
    const s = ymd(d)
    out.push(s)
    if (s >= end) break
    d = addDays(d, 1)
  }
  return out
}

export function fmtTime(t) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}${m ? ':' + String(m).padStart(2, '0') : ''}${h >= 12 ? 'pm' : 'am'}`
}
const day = (d) => format(parseISO(d), 'EEE MMM d')

// "Sat Oct 17, 7pm–9pm" or "Fri Oct 16, 3pm – Sun Oct 18, 11am"
export function spanText(x) {
  if (!x.date) return ''
  const start = `${day(x.date)}${x.time ? `, ${fmtTime(x.time)}` : ''}`
  if (isMulti(x)) return `${start} – ${day(lastDay(x))}${x.endTime ? `, ${fmtTime(x.endTime)}` : ''}`
  return `${start}${x.endTime ? `–${fmtTime(x.endTime)}` : ''}`
}

// Short label for one day of a span, for calendar cells.
export function dayPart(x, d) {
  const first = d === x.date, last = d === lastDay(x)
  if (first && x.time) return fmtTime(x.time)
  if (!first) return last && x.endTime ? `until ${fmtTime(x.endTime)}` : '↳'
  return ''
}

// Maybe options use a length instead of an end time. The length is saved as
// `length` ('90' = minutes, 'd3' = 3 days) and turned into endDate/endTime so the
// calendar, booking and phone-calendar export keep working unchanged.
export const LENGTHS = [
  ['30', '30 min'], ['60', '1 hr'], ['90', '1½ hr'], ['120', '2 hr'], ['150', '2½ hr'], ['180', '3 hr'],
  ['240', '4 hr'], ['300', '5 hr'], ['360', '6 hr'], ['480', '8 hr'],
  ['d1', 'All day'], ['d2', '2 days'], ['d3', '3 days'], ['d4', '4 days'], ['d5', '5 days'], ['d7', '1 week'],
]
export const lengthLabel = (len) => LENGTHS.find(([v]) => v === len)?.[1] || ''

export function withLength(o, len = o.length || '') {
  const base = { length: len, endDate: null, endTime: '' }
  if (!len || !o.date) return base
  if (len.startsWith('d')) {
    const n = Number(len.slice(1))
    return { ...base, endDate: n > 1 ? ymd(addDays(parseISO(o.date), n - 1)) : null }
  }
  if (!o.time) return base // an hour length needs a start time to have an end
  const end = addMinutes(parseISO(`${o.date}T${o.time}`), Number(len))
  const endDay = ymd(end)
  return { ...base, endDate: endDay > o.date ? endDay : null, endTime: format(end, 'HH:mm') }
}

// For options saved before lengths existed: the matching length, if there is one.
export function inferLength(o) {
  if (o.length) return o.length
  if (!o.endDate && !o.endTime) return ''
  if (o.time && o.endTime) {
    const mins = differenceInMinutes(parseISO(`${lastDay(o)}T${o.endTime}`), parseISO(`${o.date}T${o.time}`))
    if (LENGTHS.some(([v]) => v === String(mins))) return String(mins)
  }
  if (!o.endTime) {
    const days = String(spanDays(o).length)
    if (LENGTHS.some(([v]) => v === 'd' + days)) return 'd' + days
  }
  return 'keep'
}
