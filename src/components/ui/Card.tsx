import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-surface border border-rule rounded-card shadow-[0_1px_0_rgba(20,17,15,0.04),0_8px_24px_-12px_rgba(20,17,15,0.08)] ${className}`}
    >
      {children}
    </div>
  )
}
