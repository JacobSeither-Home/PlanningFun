import { useEffect, useRef } from 'react'

// Bottom sheet on phones, centered panel on wider screens.
export default function Sheet({ title, onClose, children, footer, labelledBy }) {
  const ref = useRef(null)
  useEffect(() => {
    const prev = document.activeElement
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const first = ref.current?.querySelector('[data-autofocus]') || ref.current
    first?.focus()
    document.body.classList.add('locked')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('locked')
      prev?.focus?.()
    }
  }, [onClose])

  return (
    <div className="sheet-wrap" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
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
