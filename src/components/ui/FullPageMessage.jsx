import { Loader2 } from 'lucide-react'

export default function FullPageMessage({ icon: Icon, title, description, loading = false, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-md text-center" role={loading ? 'status' : undefined} aria-label={loading ? 'Loading' : undefined}>
        {loading ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-vermilion" aria-hidden="true" />
        ) : (
          Icon && (
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-vermilion-soft text-vermilion">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
          )
        )}
        {title && <h1 className="text-section-title">{title}</h1>}
        {description && <p className="mt-2 text-[15px] text-ink-muted">{description}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  )
}
