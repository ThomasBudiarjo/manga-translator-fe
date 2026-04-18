import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/react'
import { ApiError, checkHealth, translateImage } from '../lib/api'
import type { TranslateJsonResponse } from '../lib/api'

export type TranslateState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; data: TranslateJsonResponse; resultUrl: string }
  | { kind: 'error'; message: string }

const TIMEOUT_MS = 130_000

function base64ToBlob(b64: string, mime: string): Blob {
  const bin = atob(b64)
  const len = bin.length
  const buf = new Uint8Array(len)
  for (let i = 0; i < len; i++) buf[i] = bin.charCodeAt(i)
  return new Blob([buf], { type: mime })
}

export function useTranslate() {
  const { getToken } = useAuth()
  const [state, setState] = useState<TranslateState>({ kind: 'idle' })
  const abortRef = useRef<AbortController | null>(null)
  const resultUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
    }
  }, [])

  const run = useCallback(
    async (file: File, srcLang: string, tgtLang: string) => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      const timeout = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS)

      setState({ kind: 'loading' })
      try {
        const token = await getToken()
        try {
          await checkHealth(ctrl.signal)
        } catch {
          if (ctrl.signal.aborted) return
          setState({
            kind: 'error',
            message: "Couldn't reach the server. Check your connection.",
          })
          window.clearTimeout(timeout)
          return
        }
        const data = await translateImage({ file, srcLang, tgtLang, token, signal: ctrl.signal })
        const blob = base64ToBlob(data.image, 'image/png')
        const resultUrl = URL.createObjectURL(blob)
        if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
        resultUrlRef.current = resultUrl
        setState({ kind: 'success', data, resultUrl })
      } catch (err) {
        const message =
          err instanceof ApiError ? err.friendly : 'Something went wrong. Please try again.'
        setState({ kind: 'error', message })
      } finally {
        window.clearTimeout(timeout)
      }
    },
    [getToken],
  )

  const reset = useCallback(() => {
    abortRef.current?.abort()
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
    resultUrlRef.current = null
    setState({ kind: 'idle' })
  }, [])

  return { state, run, reset }
}
