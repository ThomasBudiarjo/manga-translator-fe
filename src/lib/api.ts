import { formatRetryAfter } from './format'

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? ''

export type Region = {
  bbox: [[number, number], [number, number], [number, number], [number, number]]
  original: string
  translated: string
}

export type JobStep = 'ocr' | 'translate' | 'typeset'
export type JobStatus = 'queued' | 'running' | 'done' | 'failed'

export type JobStatusResponse = {
  job_id: string
  status: JobStatus
  step?: JobStep
  regions?: Region[]
  warning?: string
  image_url?: string
  error?: string
}

export type SubmitTranslateInput = {
  file: File
  srcLang: string
  tgtLang: string
  token: string | null
  signal?: AbortSignal
}

export type SubmitResponse = {
  job_id: string
  status_url: string
}

export type RateLimitInfo = {
  plan: string
  limit: number | null
  retryAfter: number
  upgradeable: boolean
}

export class ApiError extends Error {
  status: number
  friendly: string
  rateLimit?: RateLimitInfo
  constructor(status: number, friendly: string, message?: string, rateLimit?: RateLimitInfo) {
    super(message ?? friendly)
    this.name = 'ApiError'
    this.status = status
    this.friendly = friendly
    this.rateLimit = rateLimit
  }
}

function friendlyForStatus(status: number): string {
  switch (status) {
    case 400:
      return "That image couldn't be processed. Try a JPEG or PNG under 10 MB."
    case 401:
    case 403:
      return 'Session expired — please sign in again.'
    case 413:
      return 'That image is too large. Max 10 MB.'
    case 429:
      return "You've hit the hourly translation limit. Please try again later."
    case 503:
      return 'Server is busy. Try again in a moment.'
    case 504:
      return 'That page took too long. Try a smaller or simpler image.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

function friendlyForRateLimit(info: RateLimitInfo): string {
  const wait = formatRetryAfter(info.retryAfter)
  const base =
    info.limit !== null
      ? `Hourly limit reached (${info.limit} translations, ${info.plan} plan).`
      : "You've hit the hourly translation limit."
  return `${base} Try again in ${wait}.`
}

type ServerErrorBody = {
  error?: string
  message?: string
  plan?: string
  limit?: number
  retry_after?: number
  upgradeable?: boolean
}

async function readErrorBody(res: Response): Promise<{ body: ServerErrorBody; serverMsg: string }> {
  let body: ServerErrorBody = {}
  let serverMsg = ''
  try {
    body = (await res.json()) as ServerErrorBody
    serverMsg = body?.error ?? ''
  } catch {
    /* swallow */
  }
  return { body, serverMsg }
}

function throwForStatus(res: Response, body: ServerErrorBody, serverMsg: string): never {
  if (res.status === 429) {
    const retryHeader = res.headers.get('Retry-After')
    const rateLimit: RateLimitInfo = {
      plan: body.plan ?? 'free',
      limit: typeof body.limit === 'number' ? body.limit : null,
      retryAfter:
        typeof body.retry_after === 'number'
          ? body.retry_after
          : retryHeader
          ? Number(retryHeader)
          : 0,
      upgradeable:
        typeof body.upgradeable === 'boolean'
          ? body.upgradeable
          : (body.plan ?? 'free') === 'free',
    }
    const friendly = body.message
      ? `${body.message} Try again in ${formatRetryAfter(rateLimit.retryAfter)}.`
      : friendlyForRateLimit(rateLimit)
    throw new ApiError(res.status, friendly, serverMsg, rateLimit)
  }
  if (res.status === 503 && serverMsg === 'server_busy') {
    const friendly = body.message ?? 'Translation queue is full. Try again in a moment.'
    throw new ApiError(res.status, friendly, serverMsg)
  }
  throw new ApiError(res.status, friendlyForStatus(res.status), serverMsg)
}

// submitTranslate uploads the image and enqueues a translation job. Returns the
// job_id the caller can poll with `getJobStatus`.
export async function submitTranslate(input: SubmitTranslateInput): Promise<SubmitResponse> {
  const form = new FormData()
  form.append('image', input.file)
  form.append('src_lang', input.srcLang)
  form.append('tgt_lang', input.tgtLang)

  const headers: Record<string, string> = {}
  if (input.token) headers['Authorization'] = `Bearer ${input.token}`

  let res: Response
  try {
    res = await fetch(`${BASE_URL}/translate`, {
      method: 'POST',
      headers,
      body: form,
      signal: input.signal,
    })
  } catch (err) {
    if (input.signal?.aborted) {
      throw new ApiError(0, 'Cancelled.')
    }
    if (import.meta.env.DEV) {
      console.error('[translate] fetch failed — likely CORS or network:', err)
    }
    throw new ApiError(0, "Couldn't reach the server. Check your connection.", String(err))
  }

  if (!res.ok) {
    const { body, serverMsg } = await readErrorBody(res)
    throwForStatus(res, body, serverMsg)
  }
  return (await res.json()) as SubmitResponse
}

export async function getJobStatus(
  jobId: string,
  token: string | null,
  signal?: AbortSignal,
): Promise<JobStatusResponse> {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}/jobs/${encodeURIComponent(jobId)}`, {
    method: 'GET',
    headers,
    signal,
  })
  if (!res.ok) {
    const { body, serverMsg } = await readErrorBody(res)
    throwForStatus(res, body, serverMsg)
  }
  return (await res.json()) as JobStatusResponse
}

export type PollOptions = {
  intervalMs?: number
  signal?: AbortSignal
  onUpdate?: (status: JobStatusResponse) => void
}

// pollJobStatus polls /jobs/{id} until the job reaches a terminal state.
// Resolves with the final response on `done`, rejects with ApiError on
// `failed` or transport errors.
export async function pollJobStatus(
  jobId: string,
  token: string | null,
  opts: PollOptions = {},
): Promise<JobStatusResponse> {
  const interval = opts.intervalMs ?? 2000
  for (;;) {
    if (opts.signal?.aborted) {
      throw new ApiError(0, 'Cancelled.')
    }
    const status = await getJobStatus(jobId, token, opts.signal)
    opts.onUpdate?.(status)
    if (status.status === 'done') return status
    if (status.status === 'failed') {
      throw new ApiError(500, status.error ?? 'Translation failed.', status.error)
    }
    await sleep(interval, opts.signal)
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new ApiError(0, 'Cancelled.'))
      return
    }
    const t = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      window.clearTimeout(t)
      reject(new ApiError(0, 'Cancelled.'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export type HealthResponse = {
  status: string
  alloc_mb: number
  sys_mb: number
  num_gc: number
  goroutines: number
}

export async function checkHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const res = await fetch(`${BASE_URL}/health`, { signal })
  if (!res.ok) throw new Error(`health ${res.status}`)
  return (await res.json()) as HealthResponse
}
