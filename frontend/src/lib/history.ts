import type { Job } from './types'

// Finished reports are kept in this browser so a refresh doesn't lose them and
// recent scans can be reopened from the nav. They live exactly as long as on the
// server (2 hours from when the scan finished) and are never kept longer than
// the site promises.

const PREFIX = 'raptor:scan:'
const CHANGE_EVENT = 'raptor:history'
export const REPORT_TTL_MS = 2 * 60 * 60 * 1000
const MAX_SAVED = 20

const finishedAt = (job: Job) => Date.parse(job.result?.scannedAt ?? '')
const isExpired = (job: Job) => !job.result || !(Date.now() - finishedAt(job) <= REPORT_TTL_MS)

const notify = () => window.dispatchEvent(new Event(CHANGE_EVENT))

// Reads every saved report, deleting expired or unreadable ones along the way.
const readAll = (): Job[] => {
  const jobs: Job[] = []
  for (let index = localStorage.length - 1; index >= 0; index--) {
    const key = localStorage.key(index)
    if (!key?.startsWith(PREFIX)) continue
    try {
      const job = JSON.parse(localStorage.getItem(key) || 'null') as Job | null
      if (!job || isExpired(job)) localStorage.removeItem(key)
      else jobs.push(job)
    } catch {
      localStorage.removeItem(key)
    }
  }
  return jobs.sort((a, b) => finishedAt(b) - finishedAt(a))
}

export const listReports = (): Job[] => {
  try {
    return readAll()
  } catch {
    return [] // storage blocked (private mode, disabled cookies)
  }
}

export const saveReport = (job: Job) => {
  try {
    localStorage.setItem(PREFIX + job.id, JSON.stringify(job))
    readAll().slice(MAX_SAVED).forEach(old => localStorage.removeItem(PREFIX + old.id))
    notify()
  } catch {
    // Storage full or blocked: the report still shows, it just won't be remembered.
  }
}

export const loadReport = (id: string): Job | null => {
  try {
    const raw = localStorage.getItem(PREFIX + id)
    if (!raw) return null
    const job = JSON.parse(raw) as Job
    if (isExpired(job)) {
      localStorage.removeItem(PREFIX + id)
      notify()
      return null
    }
    return job
  } catch {
    return null
  }
}

export const clearReports = () => {
  try {
    listReports().forEach(job => localStorage.removeItem(PREFIX + job.id))
  } finally {
    notify()
  }
}

// Fires for changes in this tab and in other open tabs.
export const onHistoryChange = (callback: () => void) => {
  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key.startsWith(PREFIX)) callback()
  }
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener('storage', onStorage)
  }
}
