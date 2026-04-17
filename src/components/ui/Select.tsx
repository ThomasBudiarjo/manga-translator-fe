import type { SelectHTMLAttributes, ReactNode } from 'react'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  children: ReactNode
}

export function Select({ label, id, className = '', children, ...rest }: Props) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      {label && (
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted">
          {label}
        </span>
      )}
      <div className="relative">
        <select
          id={id}
          {...rest}
          className={`w-full appearance-none bg-surface border border-rule rounded-button h-11 pl-3 pr-9 text-[14px] text-ink hover:border-ink-soft focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
          {children}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-ink-muted"
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </label>
  )
}
