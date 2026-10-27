import { ReactNode } from 'react'

// One card of a book's analysis: a title, maybe a subtitle and an action
// beside it, and what it shows.
export const Section = ({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}) => (
  <section className="glass-surface motion-enter grid grid-cols-1 gap-3 rounded-xl border p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      {/* Takes the free width and wraps, so a long subtitle can't widen the
          page on a phone. */}
      <div className="grid min-w-0 flex-1 basis-48 gap-0.5">
        <h2 className="text-sm font-medium">{title}</h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
    {children}
  </section>
)
