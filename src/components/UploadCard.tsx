import { useEffect, useState } from 'react'
import type { RateLimitInfo } from '../lib/api'
import { formatRetryAfter } from '../lib/format'
import { Dropzone } from './Dropzone'
import { LanguagePicker } from './LanguagePicker'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

const STORAGE_KEY = 'mangaku.langs.v1'
const UPGRADE_MAILTO =
  'mailto:thomas@cryowerx.com?subject=Upgrade%20manga-translator%20plan&body=Hi%2C%20I%27d%20like%20to%20upgrade%20my%20plan.'

type Props = {
  onSubmit: (file: File, src: string, tgt: string) => void
  loading: boolean
  externalError?: string | null
  externalRateLimit?: RateLimitInfo
}

export function UploadCard({ onSubmit, loading, externalError, externalRateLimit }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [src, setSrc] = useState('ja')
  const [tgt, setTgt] = useState('id')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as { src?: string; tgt?: string }
        if (parsed.src) setSrc(parsed.src)
        if (parsed.tgt) setTgt(parsed.tgt)
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ src, tgt }))
    } catch {
      /* ignore */
    }
  }, [src, tgt])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setError(null)
  }

  const handleSubmit = () => {
    if (!file) return
    setError(null)
    onSubmit(file, src, tgt)
  }

  const displayError = error ?? externalError ?? null

  return (
    <Card className="p-6 md:p-8">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="font-display text-[28px] leading-none">Upload</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted">
          step 01
        </span>
      </div>

      <Dropzone
        file={file}
        previewUrl={previewUrl}
        onChange={(f, url) => {
          if (previewUrl) URL.revokeObjectURL(previewUrl)
          setFile(f)
          setPreviewUrl(url)
          setError(null)
        }}
        onClear={handleClear}
        onError={(msg) => setError(msg)}
        disabled={loading}
      />

      <div className="mt-7 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] sm:items-end gap-4">
        <LanguagePicker id="src-lang" label="From" value={src} onChange={setSrc} disabled={loading} />
        <span aria-hidden className="hidden sm:flex items-center justify-center pb-3 font-display text-[24px] text-ink-muted">
          →
        </span>
        <LanguagePicker id="tgt-lang" label="To" value={tgt} onChange={setTgt} disabled={loading} />
      </div>

      {externalRateLimit ? (
        <RateLimitBanner info={externalRateLimit} />
      ) : displayError ? (
        <div className="mt-6 flex items-start gap-3 border-l-2 border-vermilion bg-vermilion-soft px-4 py-3 text-[13px] text-ink-soft">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-vermilion-deep mt-0.5">
            err
          </span>
          <span>{displayError}</span>
        </div>
      ) : null}

      <div className="mt-7 flex items-center justify-between gap-4">
        <p className="hidden sm:block font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted">
          ~10s per page
        </p>
        <Button onClick={handleSubmit} disabled={!file || loading} size="lg">
          {loading ? 'Translating…' : 'Translate page'}
          {!loading && (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M3 8h10m0 0l-4-4m4 4l-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </Button>
      </div>
    </Card>
  )
}

function RateLimitBanner({ info }: { info: RateLimitInfo }) {
  const wait = formatRetryAfter(info.retryAfter)
  const planLabel = info.plan.charAt(0).toUpperCase() + info.plan.slice(1)
  const quota = info.limit !== null ? `${info.limit} / hr` : 'hourly quota'

  return (
    <div className="mt-6 border-l-2 border-warning bg-warning-soft px-4 py-4 text-[13px] text-ink-soft">
      <div className="flex items-start gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-warning mt-0.5">
          limit
        </span>
        <div className="flex-1">
          <p className="font-display text-[18px] leading-tight text-ink">
            Hourly translation limit reached
          </p>
          <p className="mt-1.5 text-ink-soft">
            {planLabel} plan · {quota}. Try again in <span className="font-mono text-ink">{wait}</span>.
          </p>
          {info.upgradeable && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href={UPGRADE_MAILTO}
                className="inline-flex items-center justify-center gap-2 rounded-button font-medium uppercase tracking-tight transition-colors duration-150 bg-ink text-paper hover:bg-vermilion h-8 px-3 text-[12px]"
              >
                Upgrade plan
                <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M3 8h10m0 0l-4-4m4 4l-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted">
                more translations, fewer waits
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
