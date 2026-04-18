const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? ''

export type Region = {
  bbox: [[number, number], [number, number], [number, number], [number, number]]
  original: string
  translated: string
}

export type TranslateJsonResponse = {
  image: string
  regions: Region[]
  warning?: string
}

export type TranslateInput = {
  file: File
  srcLang: string
  tgtLang: string
  token: string | null
  signal?: AbortSignal
}

export class ApiError extends Error {
  status: number
  friendly: string
  constructor(status: number, friendly: string, message?: string) {
    super(message ?? friendly)
    this.name = 'ApiError'
    this.status = status
    this.friendly = friendly
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

function formatRetryAfter(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'a moment'
  if (seconds < 60) return `${Math.ceil(seconds)}s`
  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins ? `${hours}h ${mins}m` : `${hours}h`
}

function friendlyForRateLimit(body: {
  plan?: string
  limit?: number
  retry_after?: number
}, retryAfterHeader: string | null): string {
  const retrySeconds =
    typeof body.retry_after === 'number'
      ? body.retry_after
      : retryAfterHeader
      ? Number(retryAfterHeader)
      : 0
  const wait = formatRetryAfter(retrySeconds)
  const limit = body.limit
  const plan = body.plan
  const base =
    typeof limit === 'number'
      ? `Hourly limit reached (${limit} translations${plan ? `, ${plan} plan` : ''}).`
      : "You've hit the hourly translation limit."
  return `${base} Try again in ${wait}.`
}

export async function translateImage(input: TranslateInput): Promise<TranslateJsonResponse> {
  const form = new FormData()
  form.append('image', input.file)
  form.append('src_lang', input.srcLang)
  form.append('tgt_lang', input.tgtLang)

  const headers: Record<string, string> = {}
  if (input.token) headers['Authorization'] = `Bearer ${input.token}`

  let res: Response
  try {
    res = await fetch(`${BASE_URL}/translate?format=json`, {
      method: 'POST',
      headers,
      body: form,
      signal: input.signal,
    })
  } catch (err) {
    if (input.signal?.aborted) {
      throw new ApiError(0, 'That page took too long. Try a smaller or simpler image.')
    }
    if (import.meta.env.DEV) {
      console.error('[translate] fetch failed — likely CORS or network:', err)
    }
    throw new ApiError(0, "Couldn't reach the server. Check your connection.", String(err))
  }

  if (!res.ok) {
    let serverMsg = ''
    let body: { error?: string; plan?: string; limit?: number; retry_after?: number } = {}
    try {
      body = (await res.json()) as typeof body
      serverMsg = body?.error ?? ''
    } catch {
      /* swallow */
    }
    const friendly =
      res.status === 429
        ? friendlyForRateLimit(body, res.headers.get('Retry-After'))
        : friendlyForStatus(res.status)
    throw new ApiError(res.status, friendly, serverMsg)
  }

  return await res.json() as TranslateJsonResponse
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
  return await res.json() as HealthResponse
}
