import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)
const styles = {
  success: { icon: CheckCircle2, color: 'text-sage-dark' },
  error: { icon: AlertCircle, color: 'text-[#9B2C20]' },
  info: { icon: Info, color: 'text-ink-muted' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const push = useCallback((type, message) => {
    const id = crypto.randomUUID()
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => dismiss(id), type === 'error' ? 8000 : 4500)
  }, [dismiss])

  const api = useMemo(() => ({
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map(({ id, type, message }) => {
          const { icon: Icon, color } = styles[type]
          return (
            <div key={id} role={type === 'error' ? 'alert' : 'status'} className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-pop">
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} aria-hidden="true" />
              <p className="flex-1 text-[15px]">{message}</p>
              <button type="button" onClick={() => dismiss(id)} aria-label="Dismiss notification" className="-m-2 flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
