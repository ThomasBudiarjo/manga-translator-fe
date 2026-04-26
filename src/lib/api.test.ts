import { describe, expect, it, vi } from 'vitest'
import { ApiError, pollJobStatus } from './api'

describe('pollJobStatus', () => {
  it('requests a fresh auth token on every poll attempt', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ job_id: 'job-1', status: 'queued' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ job_id: 'job-1', status: 'done', image_url: 'https://img' }),
      })

    vi.stubGlobal('fetch', fetchMock)

    const getToken = vi.fn<() => Promise<string | null>>()
    getToken.mockResolvedValueOnce('token-1').mockResolvedValueOnce('token-2')

    const result = await pollJobStatus('job-1', getToken, { intervalMs: 0 })

    expect(result.status).toBe('done')
    expect(getToken).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/jobs/job-1'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer token-1' },
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/jobs/job-1'),
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer token-2' },
      }),
    )
  })

  it('surfaces forbidden as an authorization error instead of a session-expired message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers(),
        json: async () => ({ error: 'forbidden' }),
      }),
    )

    await expect(pollJobStatus('job-1', async () => 'token-1', { intervalMs: 0 })).rejects.toMatchObject({
      status: 403,
      friendly: 'You do not have access to this translation job.',
    } satisfies Partial<ApiError>)
  })
})
