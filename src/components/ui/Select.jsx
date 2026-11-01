import { useId } from 'react'

export default function Select({ label, error, hint, className = '', children, ...rest }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        className={`min-h-[44px] w-full rounded-xl border bg-surface px-3 text-[15px] text-ink focus-visible:outline-offset-0 ${error ? 'border-[#C0392B]' : 'border-border hover:border-sand'}`}
        {...rest}
      >
        {children}
      </select>
      {error ? <p className="mt-1.5 text-helper text-[#9B2C20]">{error}</p> : hint ? <p className="mt-1.5 text-helper text-ink-muted">{hint}</p> : null}
    </div>
  )
}
