import type { Region } from '../lib/api'

type Props = { regions: Region[] }

export function RegionList({ regions }: Props) {
  if (regions.length === 0) {
    return (
      <div className="grid place-items-center py-16 text-center">
        <div>
          <p className="font-display text-[22px] text-ink-soft">No text regions</p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted">
            ocr did not find any text on this page
          </p>
        </div>
      </div>
    )
  }

  return (
    <ol className="divide-y divide-rule">
      {regions.map((r, idx) => (
        <li
          key={idx}
          className="grid grid-cols-[2.25rem_1fr_1fr_2rem] gap-3 items-start py-3 px-2 hover:bg-paper-deep/40"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted mt-1 tabular-nums">
            {String(idx + 1).padStart(2, '0')}
          </span>
          <p className="text-[14px] text-ink-soft leading-snug" lang="ja">
            {r.original}
          </p>
          <p className="text-[14px] text-ink leading-snug">{r.translated}</p>
          <button
            type="button"
            aria-label="Copy translation"
            onClick={() => navigator.clipboard?.writeText(r.translated)}
            className="text-ink-muted hover:text-vermilion transition-colors mt-0.5 justify-self-end"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="5" y="5" width="9" height="9" rx="1.5" />
              <path d="M3 11V3a1 1 0 011-1h7" />
            </svg>
          </button>
        </li>
      ))}
    </ol>
  )
}
