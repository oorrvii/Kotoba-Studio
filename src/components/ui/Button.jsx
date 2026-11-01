import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-vermilion text-white hover:bg-vermilion-dark active:bg-vermilion-dark border border-transparent',
  secondary: 'bg-surface text-ink border border-border hover:bg-surface-muted',
  tertiary: 'bg-transparent text-ink border border-transparent hover:bg-surface-muted',
  dangerSolid: 'bg-[#9B2C20] text-white hover:bg-[#7F2218] border border-transparent',
  danger: 'bg-surface text-[#9B2C20] border border-[#E3B7B0] hover:bg-[#FBEFED]',
}
const sizes = {
  md: 'min-h-[44px] px-4 text-[15px]',
  sm: 'min-h-[36px] px-3 text-sm',
  lg: 'min-h-[52px] px-6 text-base',
}

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, icon: Icon, className = '', children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {children}
    </button>
  )
})

export default Button
