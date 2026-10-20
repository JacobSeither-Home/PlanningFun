import { useEffect, useRef } from 'react'

// Bottom sheet on phones, centered panel on wider screens.
export default function Sheet({ title, onClose, children, footer, labelledBy }) {
  const ref = useRef(null)
  // Parents pass a new onClose on every render; keep the latest in a ref so the
  // setup below runs once per opening. (Re-running it moved focus back to the
  // sheet on every data sync, which closed the iPhone date picker instantly.)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const prev = document.activeElement
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current() }
    window.addEventListener('keydown', onKey)
    const first = ref.current?.querySelector('[data-autofocus]') || ref.current
    first?.focus({ preventScroll: true })
    document.body.classList.add('locked')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('locked')
      prev?.focus?.({ preventScroll: true })
    }
  }, [])

  return (
    <div className="sheet-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) closeRef.current() }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy} ref={ref} tabIndex={-1}>
        <div className="sheet-grip" aria-hidden="true" />
        <button className="icon-btn sheet-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
        </button>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  )
}
