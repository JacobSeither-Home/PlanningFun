// Dates that may span several days. Used by booked plans (date/time → endDate/endTime)
// and by maybe options, which have the same shape.
import { addDays, format, parseISO } from 'date-fns'

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
