import { useEffect, useMemo, useState } from 'react'
import { getBackend } from './lib/store'
import { BackendContext, useBackend, useCollection } from './lib/hooks'
import SignIn from './components/SignIn'
import IdeasView from './components/IdeasView'
import CalendarView from './components/CalendarView'
import WatchView from './components/WatchView'
import QuickAdd from './components/QuickAdd'
import ActivitySheet from './components/ActivitySheet'
import Surprise from './components/Surprise'
import DrinksView from './components/DrinksView'
import DrinkSheet from './components/DrinkSheet'
import BusySheet from './components/BusySheet'
import { allKinds } from './lib/drinks'

const TABS = [
  { id: 'ideas', label: 'Ideas', icon: '💡' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'drinks', label: 'Drinks', icon: '🥃' },
  { id: 'watch', label: 'Watch', icon: '🍿' },
]

const tabFromHash = () => {
  const h = window.location.hash.replace('#', '')
  return TABS.some((t) => t.id === h) ? h : 'ideas'
}

export default function App() {
  const [be, setBe] = useState(null)
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    let unsub = () => {}
    getBackend().then((b) => { setBe(b); unsub = b.onUser((u) => setUser(u || null)) })
    return () => unsub()
  }, [])

  if (!be || user === undefined) return <div className="splash" aria-label="Loading" />
  return (
    <BackendContext.Provider value={be}>
      {user ? <Shell user={user} /> : <SignIn />}
    </BackendContext.Provider>
  )
}

function Shell({ user }) {
  const [tab, setTab] = useState(tabFromHash)
  const [adding, setAdding] = useState(null) // { kind: 'idea'|'watch', date? }
  const [openId, setOpenId] = useState(null)
  const [surprise, setSurprise] = useState(null) // { kind, items }
  const { rows: activities, error } = useCollection('activities')
  const { rows: watch } = useCollection('watch')
  const { rows: drinks } = useCollection('drinks')
  const { rows: busy } = useCollection('busy')
  const [busySheet, setBusySheet] = useState(null) // { id } to edit, { date } to add
  const { rows: customKinds } = useCollection('drinkKinds')
  const kinds = useMemo(() => allKinds(customKinds), [customKinds])
  const [drinkSheet, setDrinkSheet] = useState(null) // { id } to edit, {} to add
  const [drinkKind, setDrinkKind] = useState(null) // Drinks tab filter; new ratings start with it
  const be = useBackend()

  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const go = (id) => { window.location.hash = id; setTab(id) }

  const open = useMemo(() => activities.find((a) => a.id === openId), [activities, openId])

  const addNew = () => {
    if (tab === 'drinks') setDrinkSheet({})
    else setAdding({ kind: tab === 'watch' ? 'watch' : 'idea' })
  }

  // Keyboard: "n" adds something new
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'n' || e.metaKey || e.ctrlKey || adding || openId || surprise || drinkSheet || busySheet) return
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return
      e.preventDefault()
      addNew()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tab, adding, openId, surprise, drinkSheet, busySheet])

  return (
    <div className="shell">
      <nav className="nav" aria-label="Sections">
        <div className="brand" aria-hidden="true">
          <img src="./icon.svg" alt="" width="34" height="34" />
          <span>PlanningFun</span>
        </div>
        {TABS.map((t) => (
          <button
            key={t.id}
            className="nav-item"
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => go(t.id)}
          >
            <span className="nav-icon" aria-hidden="true">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
        <div className="nav-foot">
          <span className="who">{user.displayName || user.email}</span>
          {be.mode === 'firebase' && <button className="link" onClick={() => be.signOut()}>Sign out</button>}
        </div>
      </nav>

      <main className="main">
        {be.mode === 'demo' && (
          <p className="banner">Demo mode: everything is saved in this browser only, until Firebase is connected.</p>
        )}
        {error && <p className="banner warn">Can’t load shared data: {error.code === 'permission-denied' ? 'this account isn’t on the allowed list in the Firestore rules.' : error.message}</p>}

        {tab === 'ideas' && (
          <IdeasView
            activities={activities}
            onOpen={setOpenId}
            onSurprise={(items) => setSurprise({ kind: 'idea', items })}
          />
        )}
        {tab === 'calendar' && (
          <CalendarView
            activities={activities}
            busy={busy}
            onOpen={setOpenId}
            onAdd={(date) => setAdding({ kind: 'idea', date })}
            onBusy={setBusySheet}
          />
        )}
        {tab === 'drinks' && (
          <DrinksView drinks={drinks} kinds={kinds} kind={drinkKind} setKind={setDrinkKind} onOpen={(id) => setDrinkSheet({ id })} />
        )}
        {tab === 'watch' && (
          <WatchView items={watch} onSurprise={(items) => setSurprise({ kind: 'watch', items })} />
        )}
      </main>

      <button
        className="fab"
        onClick={addNew}
        aria-label={tab === 'watch' ? 'Add to watch list' : tab === 'drinks' ? 'Rate a drink' : 'Add an idea'}
        title="Add (N)"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
      </button>

      {adding && (
        <QuickAdd
          initial={adding}
          onClose={() => setAdding(null)}
          onCreated={(id, kind) => { setAdding(null); if (kind === 'idea' && id && adding.openAfter) setOpenId(id) }}
        />
      )}
      {busySheet && (busySheet.date || busy.some((b) => b.id === busySheet.id)) && (
        <BusySheet
          key={busySheet.id || busySheet.date}
          busy={busySheet.id ? busy.find((b) => b.id === busySheet.id) : null}
          date={busySheet.date}
          onClose={() => setBusySheet(null)}
        />
      )}
      {drinkSheet && (
        <DrinkSheet
          key={drinkSheet.id || 'new'}
          drink={drinkSheet.id ? drinks.find((d) => d.id === drinkSheet.id) : null}
          drinks={drinks}
          kinds={kinds}
          initialKind={drinkKind}
          onClose={() => setDrinkSheet(null)}
        />
      )}
      {open && <ActivitySheet activity={open} onClose={() => setOpenId(null)} onOpen={setOpenId} />}
      {surprise && (
        <Surprise
          {...surprise}
          onClose={() => setSurprise(null)}
          onPick={(item) => {
            setSurprise(null)
            if (surprise.kind === 'idea') setOpenId(item.id)
          }}
        />
      )}
    </div>
  )
}

