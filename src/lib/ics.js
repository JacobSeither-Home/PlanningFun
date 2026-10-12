// Build a calendar file (.ics) for one activity so it can be added to the
// phone's own Calendar app, with a reminder alert.
const esc = (s = '') => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')
const pad = (n) => String(n).padStart(2, '0')
const dateOnly = (d) => d.replace(/-/g, '')
const stamp = (dt) => `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`

export function activityIcs(a) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PlanningFun//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${a.id}@planningfun`, `DTSTAMP:${stamp(new Date())}`]
  if (a.time) {
    // floating local time, 2 hours long by default
    const [y, mo, d] = a.date.split('-').map(Number)
    const [h, mi] = a.time.split(':').map(Number)
    const start = new Date(y, mo - 1, d, h, mi)
    const end = new Date(start.getTime() + 2 * 3600e3)
    const loc = (t) => `${t.getFullYear()}${pad(t.getMonth() + 1)}${pad(t.getDate())}T${pad(t.getHours())}${pad(t.getMinutes())}00`
    lines.push(`DTSTART:${loc(start)}`, `DTEND:${loc(end)}`)
  } else {
    const [y, mo, d] = a.date.split('-').map(Number)
    const next = new Date(y, mo - 1, d + 1)
    lines.push(`DTSTART;VALUE=DATE:${dateOnly(a.date)}`, `DTEND;VALUE=DATE:${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`)
  }
  lines.push(`SUMMARY:${esc(a.title)}`)
  if (a.location) lines.push(`LOCATION:${esc(a.location)}`)
  const desc = [a.notes, a.link].filter(Boolean).join('\n')
  if (desc) lines.push(`DESCRIPTION:${esc(desc)}`)
  if (a.link) lines.push(`URL:${/^https?:/i.test(a.link) ? a.link : 'https://' + a.link}`)
  // reminder: 1 hour before a timed plan, 9am the day before an all-day one
  lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(a.title)}`, `TRIGGER:${a.time ? '-PT1H' : '-PT15H'}`, 'END:VALARM')
  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n')
}

export function openIcs(a) {
  const text = activityIcs(a)
  const name = `${(a.title || 'plan').replace(/[^\w\- ]+/g, '').trim().slice(0, 40) || 'plan'}.ics`
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (ios) {
    // iOS opens calendar files directly and offers "Add to Calendar"
    window.location.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(text)}`
    return
  }
  const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
