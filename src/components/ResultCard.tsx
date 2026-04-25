import { useState } from 'react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { RegionList } from './RegionList'
import type { TranslateSuccess } from '../hooks/useTranslate'

type Tab = 'translated' | 'original' | 'regions'

type Props = {
  result: TranslateSuccess
  originalUrl: string
  originalName: string
  onReset: () => void
}

export function ResultCard({ result, originalUrl, originalName, onReset }: Props) {
  const [tab, setTab] = useState<Tab>('translated')

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'translated', label: 'Translated' },
    { key: 'original', label: 'Original' },
    { key: 'regions', label: 'Regions', count: result.regions.length },
  ]

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = result.imageUrl
    a.download = `translated-${originalName.replace(/\.[^.]+$/, '')}.png`
    a.target = '_blank'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <Card className="p-6 md:p-8 flex flex-col">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-[28px] leading-none">Result</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted">
          step 02
        </span>
      </div>

      {result.warning && (
        <div className="mb-5 flex items-start gap-3 border-l-2 border-warning bg-warning-soft px-4 py-3 text-[13px] text-ink-soft">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-warning mt-0.5">
            note
          </span>
          <span>{result.warning}</span>
        </div>
      )}

      <div className="flex border-b border-rule mb-5 -mx-1">
        {tabs.map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`relative px-4 py-3 text-[12px] uppercase tracking-[0.2em] font-medium transition-colors ${
                active ? 'text-ink' : 'text-ink-muted hover:text-ink-soft'
              }`}
            >
              {t.label}
              {typeof t.count === 'number' && (
                <span className="ml-2 font-mono text-[10px] text-ink-muted tabular-nums">
                  {String(t.count).padStart(2, '0')}
                </span>
              )}
              {active && <span className="absolute -bottom-px left-0 right-0 h-[2px] bg-ink" />}
            </button>
          )
        })}
      </div>

      <div className="flex-1 min-h-0">
        {tab === 'translated' && (
          <div className="bg-paper-deep rounded-card p-3 grid place-items-center">
            <img
              src={result.imageUrl}
              alt="Translated manga page"
              className="max-h-[68vh] max-w-full object-contain"
            />
          </div>
        )}
        {tab === 'original' && (
          <div className="bg-paper-deep rounded-card p-3 grid place-items-center">
            <img
              src={originalUrl}
              alt="Original manga page"
              className="max-h-[68vh] max-w-full object-contain"
            />
          </div>
        )}
        {tab === 'regions' && (
          <div className="max-h-[68vh] overflow-auto">
            <RegionList regions={result.regions} />
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 pt-5 border-t border-rule">
        <Button variant="ghost" size="sm" onClick={onReset}>
          ← Start over
        </Button>
        <Button onClick={handleDownload}>
          Download PNG
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M8 3v8m0 0l-3-3m3 3l3-3M3 13h10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Button>
      </div>
    </Card>
  )
}
