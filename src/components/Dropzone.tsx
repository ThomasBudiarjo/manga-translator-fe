import { useCallback, useRef, useState } from 'react'

const ACCEPT = ['image/jpeg', 'image/png']
const MAX_BYTES = 10 * 1024 * 1024

type Props = {
  file: File | null
  previewUrl: string | null
  onChange: (file: File, previewUrl: string) => void
  onClear: () => void
  onError: (msg: string) => void
  disabled?: boolean
}

export function Dropzone({ file, previewUrl, onChange, onClear, onError, disabled }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      const f = files[0]
      if (!ACCEPT.includes(f.type)) {
        onError('Only JPEG or PNG images are supported.')
        return
      }
      if (f.size > MAX_BYTES) {
        onError('That file is over 10 MB. Try a smaller image.')
        return
      }
      const url = URL.createObjectURL(f)
      onChange(f, url)
    },
    [onChange, onError],
  )

  if (file && previewUrl) {
    return (
      <div className="relative">
        <div className="aspect-[3/4] w-full overflow-hidden rounded-card border border-rule bg-paper-deep grid place-items-center">
          <img src={previewUrl} alt={file.name} className="max-h-full max-w-full object-contain" />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[12px] truncate text-ink-soft">{file.name}</div>
            <div className="font-mono text-[10px] text-ink-muted uppercase tracking-[0.2em] mt-0.5">
              {(file.size / 1024).toFixed(0)} KB · {f_type_label(file.type)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted hover:text-vermilion transition-colors disabled:opacity-40"
          >
            Replace ↻
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragEnter={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      onClick={() => inputRef.current?.click()}
      className={`relative grid place-items-center text-center cursor-pointer aspect-[3/4] w-full rounded-card border border-dashed transition-colors px-6 select-none ${
        isDragging
          ? 'border-vermilion bg-vermilion-soft'
          : 'border-rule hover:border-ink-soft bg-paper-deep/40'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(',')}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div>
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-ink text-paper">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M12 4v12m0 0l-4-4m4 4l4-4M5 20h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="font-display text-[22px] leading-tight text-ink">Drop a manga page</p>
        <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
          or click · jpeg/png · up to 10 mb
        </p>
      </div>
    </div>
  )
}

function f_type_label(t: string): string {
  if (t === 'image/jpeg') return 'JPEG'
  if (t === 'image/png') return 'PNG'
  return t
}
