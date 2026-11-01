import { forwardRef, useId } from 'react'

const Input = forwardRef(function Input({ label, hint, error, className = '', multiline = false, ...rest }, ref) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  const Tag = multiline ? 'textarea' : 'input'
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <Tag
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        rows={multiline ? 3 : undefined}
        className={`w-full rounded-xl border bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-[#8C8B84] focus-visible:outline-offset-0 ${error ? 'border-[#C0392B]' : 'border-border hover:border-sand'}`}
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-helper text-[#9B2C20]">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-helper text-ink-muted">{hint}</p>
      ) : null}
    </div>
  )
})

export default Input
