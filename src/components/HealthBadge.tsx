import { useEffect, useState } from 'react'
import { checkHealth } from '../lib/api'
import type { HealthResponse } from '../lib/api'

type Status = 'pending' | 'healthy' | 'degraded' | 'down'

export function HealthBadge() {
  const [status, setStatus] = useState<Status>('pending')
  const [info, setInfo] = useState<HealthResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    let timer: number | undefined

    const tick = async () => {
      const ctrl = new AbortController()
      try {
        const data = await checkHealth(ctrl.signal)
        if (cancelled) return
        setInfo(data)
        setStatus(data.alloc_mb > 400 ? 'degraded' : 'healthy')
      } catch {
        if (cancelled) return
        setStatus('down')
        setInfo(null)
      }
      if (!cancelled) timer = window.setTimeout(tick, 30_000)
    }
    tick()
    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  const dotClass =
    status === 'healthy'
      ? 'bg-emerald-600'
      : status === 'degraded'
      ? 'bg-amber-500'
      : status === 'down'
      ? 'bg-vermilion'
      : 'bg-ink-muted'

  const label =
    status === 'healthy'
      ? 'API · ok'
      : status === 'degraded'
      ? 'API · degraded'
      : status === 'down'
      ? 'API · offline'
      : 'API · checking'

  const tooltip =
    status === 'healthy' && info
      ? `${info.alloc_mb} MB allocated · ${info.goroutines} goroutines · ${info.num_gc} GC cycles`
      : status === 'degraded' && info
      ? `${info.alloc_mb} MB allocated — close to 512 MB cap`
      : status === 'down'
      ? 'API unreachable'
      : 'Checking API…'

  return (
    <div
      className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted"
      title={tooltip}
    >
      <span className={`relative inline-block h-1.5 w-1.5 rounded-full ${dotClass}`}>
        {status === 'healthy' && (
          <span className={`absolute inset-0 rounded-full ${dotClass} opacity-50 animate-ping`} />
        )}
      </span>
      <span>{label}</span>
    </div>
  )
}
