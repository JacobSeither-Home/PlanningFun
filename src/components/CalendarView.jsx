import { useMemo, useState } from 'react'
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth,
  isToday, parseISO, startOfMonth, startOfWeek,
} from 'date-fns'
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, KeyboardSensor, pointerWithin, rectIntersection,
  useDraggable, useDroppable, useSensor, useSensors,
} from '@dnd-kit/core'
import Ticket from './Ticket'
import Sheet from './Sheet'
import { useBackend } from '../lib/hooks'
import { catOf } from '../lib/constants'

const ymd = (d) => format(d, 'yyyy-MM-dd')
// Drop on whatever is under the finger/pointer; fall back to overlap for keyboard drags.
const collide = (args) => { const hit = pointerWithin(args); return hit.length ? hit : rectIntersection(args) }

export default function CalendarView({ activities, onOpen, onAdd }) {
  const be = useBackend()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState(() => ymd(new Date()))
  const [dragId, setDragId] = useState(null)
  const [picking, setPicking] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  const days = useMemo(() => eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  }), [month])

  const byDay = useMemo(() => {
    const m = {}
    activities.filter((a) => a.date).forEach((a) => { (m[a.date] ||= []).push(a) })
    Object.values(m).forEach((l) => l.sort((x, y) => (x.time || '99').localeCompare(y.time || '99')))
    return m
  }, [activities])

  const ideas = activities.filter((a) => !a.date && !a.done)
    .sort((x, y) => (y.createdAt || 0) - (x.createdAt || 0))
  const dragging = activities.find((a) => a.id === dragId)

  const onDragEnd = ({ active, over }) => {
    setDragId(null)
    if (!over) return
    const a = activities.find((x) => x.id === active.id)
    if (!a) return
    if (over.id === 'tray') { if (a.date) be.update('activities', a.id, { date: null, time: '' }); return }
    const date = String(over.id).replace('day:', '')
    if (a.date !== date) be.update('activities', a.id, { date })
    setSelected(date)
  }

  const dayItems = byDay[selected] || []

  return (
    <DndContext sensors={sensors} collisionDetection={collide} onDragStart={(e) => setDragId(e.active.id)} onDragEnd={onDragEnd} onDragCancel={() => setDragId(null)}>
      <div className="view cal-view">
        <header className="view-head">
          <h1>{format(month, 'MMMM')} <span className="muted">{format(month, 'yyyy')}</span></h1>
          <div className="row">
            <button className="icon-btn" onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button className="btn small ghost" onClick={() => { setMonth(startOfMonth(new Date())); setSelected(ymd(new Date())) }}>Today</button>
            <button className="icon-btn" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </header>

        <div className="cal-layout">
          <Tray ideas={ideas} onOpen={onOpen} dragId={dragId} />

          <div className="cal-main">
            <div className="cal-grid" role="grid" aria-label={format(month, 'MMMM yyyy')}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="cal-dow" role="columnheader">{d}</div>
              ))}
              {days.map((d) => (
                <Day key={ymd(d)} date={d} items={byDay[ymd(d)] || []} inMonth={isSameMonth(d, month)}
                  selected={selected === ymd(d)} onSelect={setSelected} onOpen={onOpen} dragId={dragId} />
              ))}
            </div>

            <section className="agenda" aria-live="polite">
              <div className="agenda-head">
                <h2>{format(parseISO(selected), 'EEEE, MMMM d')}</h2>
                <div className="row">
                  {ideas.length > 0 && <button className="btn small" onClick={() => setPicking(true)}>Pick an idea</button>}
                  <button className="btn small primary" onClick={() => onAdd(selected)}>New</button>
                </div>
              </div>
              {dayItems.length ? (
                <div className="tickets">
                  {dayItems.map((a) => <Ticket key={a.id} activity={a} onOpen={onOpen} />)}
                </div>
              ) : (
                <p className="muted">Nothing planned. Pick one of your ideas or add something new.</p>
              )}
            </section>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {dragging && <div className="overlay-ticket"><Ticket activity={dragging} compact /></div>}
      </DragOverlay>

      {picking && (
        <Sheet title="Pick an idea" onClose={() => setPicking(false)}>
          <h2 className="sheet-title">Plan for {format(parseISO(selected), 'EEE, MMM d')}</h2>
          <div className="tickets">
            {ideas.map((a) => (
              <Ticket key={a.id} activity={a} onOpen={(id) => { be.update('activities', id, { date: selected }); setPicking(false) }} />
            ))}
          </div>
        </Sheet>
      )}
    </DndContext>
  )
}

function Tray({ ideas, onOpen, dragId }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'tray' })
  return (
    <aside ref={setNodeRef} className={`tray${isOver ? ' over' : ''}`} aria-label="Unscheduled ideas">
      <h2>Someday</h2>
      <p className="muted small">Drag onto a day. Drag back here to unschedule.</p>
      <div className="tickets">
        {ideas.map((a) => <DraggableTicket key={a.id} activity={a} onOpen={onOpen} hidden={dragId === a.id} />)}
        {!ideas.length && <p className="muted small">No unscheduled ideas.</p>}
      </div>
    </aside>
  )
}

function DraggableTicket({ activity, onOpen, compact, hidden }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: activity.id })
  return (
    <div ref={setNodeRef} style={{ opacity: hidden ? 0.3 : 1 }}>
      <Ticket activity={activity} onOpen={onOpen} compact={compact} dragProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

function Day({ date, items, inMonth, selected, onSelect, onOpen, dragId }) {
  const id = ymd(date)
  const { setNodeRef, isOver } = useDroppable({ id: `day:${id}` })
  return (
    <div
      ref={setNodeRef}
      role="gridcell"
      aria-selected={selected}
      className={`cal-day${inMonth ? '' : ' out'}${isToday(date) ? ' today' : ''}${selected ? ' sel' : ''}${isOver ? ' over' : ''}`}
      onClick={() => onSelect(id)}
    >
      <button className="cal-num" onClick={(e) => { e.stopPropagation(); onSelect(id) }}
        aria-label={`${format(date, 'EEEE, MMMM d')}${items.length ? `, ${items.length} planned` : ''}`}>
        {format(date, 'd')}
      </button>
      <div className="cal-items">
        {items.slice(0, 3).map((a) => (
          <DraggableTicket key={a.id} activity={a} onOpen={onOpen} compact hidden={dragId === a.id} />
        ))}
        {items.length > 3 && <span className="more">+{items.length - 3}</span>}
      </div>
      <div className="cal-dots" aria-hidden="true">
        {items.slice(0, 4).map((a) => <i key={a.id} style={{ background: catOf(a.category).color }} />)}
      </div>
    </div>
  )
}
