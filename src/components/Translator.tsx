import { useEffect, useRef, useState } from 'react'
import { UploadCard } from './UploadCard'
import { ResultCard } from './ResultCard'
import { useTranslate } from '../hooks/useTranslate'
import type { JobStep } from '../lib/api'

type Submitted = { file: File; url: string }

export function Translator() {
  const { state, run, reset } = useTranslate()
  const [submitted, setSubmitted] = useState<Submitted | null>(null)
  const submittedRef = useRef<Submitted | null>(null)
  submittedRef.current = submitted

  useEffect(() => {
    return () => {
      if (submittedRef.current) URL.revokeObjectURL(submittedRef.current.url)
    }
  }, [])

  const handleSubmit = (file: File, src: string, tgt: string) => {
    if (submitted) URL.revokeObjectURL(submitted.url)
    setSubmitted({ file, url: URL.createObjectURL(file) })
    run(file, src, tgt)
  }

  const handleReset = () => {
    if (submitted) URL.revokeObjectURL(submitted.url)
    setSubmitted(null)
    reset()
  }

  const loading = state.kind === 'loading'
  const externalError = state.kind === 'error' ? state.message : null
  const externalRateLimit = state.kind === 'error' ? state.rateLimit : undefined

  return (
    <section className="mx-auto w-full max-w-[1320px] px-6 py-10 md:py-14">
      <div className="mb-8 flex items-baseline justify-between">
        <h1 className="font-display text-[clamp(28px,3.4vw,40px)] leading-none tracking-tight text-ink">
          Workspace
        </h1>
        <p className="hidden md:block font-mono text-[10px] uppercase tracking-[0.24em] text-ink-muted">
          one page at a time · max 10 mb
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        <UploadCard
          onSubmit={handleSubmit}
          loading={loading}
          externalError={externalError}
          externalRateLimit={externalRateLimit}
        />
        {state.kind === 'success' && submitted ? (
          <ResultCard
            result={state.data}
            originalUrl={submitted.url}
            originalName={submitted.file.name}
            onReset={handleReset}
          />
        ) : (
          <PendingCard
            kind={
              state.kind === 'loading'
                ? 'loading'
                : state.kind === 'error'
                ? 'error'
                : 'idle'
            }
            step={state.kind === 'loading' ? state.step : undefined}
          />
        )}
      </div>
    </section>
  )
}

function PendingCard({ kind, step }: { kind: 'idle' | 'loading' | 'error'; step?: JobStep }) {
  const phaseLabel = (() => {
    if (kind !== 'loading') {
      return kind === 'error' ? 'see the message on the left' : 'drop a page on the left'
    }
    switch (step) {
      case 'ocr':
        return 'detect · running ocr'
      case 'translate':
        return 'translate · llm working'
      case 'typeset':
        return 'render · typesetting'
      default:
        return 'queued · waiting for worker'
    }
  })()

  return (
    <div className="border border-dashed border-rule rounded-card grid place-items-center text-center min-h-[480px] p-8 bg-surface/50">
      <div className="max-w-[28ch]">
        <div className="mx-auto h-14 w-14 rounded-full border border-rule-strong grid place-items-center mb-6">
          {kind === 'loading' ? (
            <span className="block h-3 w-3 rounded-full bg-vermilion animate-pulse" />
          ) : (
            <span className="font-display text-[22px] leading-none">02</span>
          )}
        </div>
        <p className="font-display text-[24px] leading-tight text-ink">
          {kind === 'loading'
            ? 'Working on it…'
            : kind === 'error'
            ? 'Something went sideways'
            : 'Awaiting a page'}
        </p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted">
          {phaseLabel}
        </p>
      </div>
    </div>
  )
}
