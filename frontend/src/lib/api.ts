import type { Job } from './types'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError("Can't reach Raptor right now. Check your connection and try again.", 0)
  }
  const body = await response.json().catch(() => null)
  if (!response.ok || !body?.success) {
    throw new ApiError(body?.error || `Something went wrong (${response.status}).`, response.status)
  }
  return body.data as T
}

export const startScan = (input: { url?: string; repo?: string }) =>
  request<Job>('/scans', { method: 'POST', body: JSON.stringify(input) })

export const getScan = (id: string) => request<Job>(`/scans/${encodeURIComponent(id)}`)
