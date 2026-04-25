import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/react'
import {
  ApiError,
  checkHealth,
  pollJobStatus,
  submitTranslate,
} from '../lib/api'
import type {
  JobStatusResponse,
  JobStep,
  RateLimitInfo,
  Region,
} from '../lib/api'

export type TranslateSuccess = {
  imageUrl: string
  regions: Region[]
  warning?: string
}

export type TranslateState =
  | { kind: 'idle' }
  | { kind: 'loading'; step?: JobStep }
  | { kind: 'success'; data: TranslateSuccess }
  | { kind: 'error'; message: string; rateLimit?: RateLimitInfo }

export function useTranslate() {
  const { getToken } = useAuth()
  const [state, setState] = useState<TranslateState>({ kind: 'idle' })
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const run = useCallback(
    async (file: File, srcLang: string, tgtLang: string) => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl

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
          return
        }

        const submitted = await submitTranslate({
          file,
          srcLang,
          tgtLang,
          token,
          signal: ctrl.signal,
        })

        const final: JobStatusResponse = await pollJobStatus(submitted.job_id, token, {
          signal: ctrl.signal,
          onUpdate: (status) => {
            if (ctrl.signal.aborted) return
            if (status.status === 'running' || status.status === 'queued') {
              setState({ kind: 'loading', step: status.step })
            }
          },
        })

        if (!final.image_url) {
          setState({ kind: 'error', message: 'Translation finished but no image was returned.' })
          return
        }
        setState({
          kind: 'success',
          data: {
            imageUrl: final.image_url,
            regions: final.regions ?? [],
            warning: final.warning,
          },
        })
      } catch (err) {
        if (ctrl.signal.aborted) return
        const message =
          err instanceof ApiError ? err.friendly : 'Something went wrong. Please try again.'
        const rateLimit = err instanceof ApiError ? err.rateLimit : undefined
        setState({ kind: 'error', message, rateLimit })
      }
    },
    [getToken],
  )

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState({ kind: 'idle' })
  }, [])

  return { state, run, reset }
}
