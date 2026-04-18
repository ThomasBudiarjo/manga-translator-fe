import { formatRetryAfter } from './format'

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
    let body: {
      error?: string
      message?: string
      plan?: string
      limit?: number
      retry_after?: number
      upgradeable?: boolean
    } = {}
    try {
      body = (await res.json()) as typeof body
      serverMsg = body?.error ?? ''
    } catch {
      /* swallow */
    }
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
      const friendly = body.message ? `${body.message} Try again in ${formatRetryAfter(rateLimit.retryAfter)}.` : friendlyForRateLimit(rateLimit)
      throw new ApiError(res.status, friendly, serverMsg, rateLimit)
    }
    const friendly = friendlyForStatus(res.status)
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
