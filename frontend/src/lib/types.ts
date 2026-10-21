export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type Source = 'website' | 'code'

export interface Snippet {
  label: string
  language: string
  code: string
}

export interface Finding {
  id: string
  source: Source
  category: string
  severity: Severity
  title: string
  summary: string
  risk: string
  fix: string[]
  snippet?: Snippet
  evidence?: string
  location?: string
  locations?: string[]
  learnMore?: string
  verified?: boolean
}

export interface Counts {
  critical: number
  high: number
  medium: number
  low: number
  info: number
  total: number
}

export interface SectionSummary {
  score: number
  grade: string
  counts: Counts
}

export interface Report {
  score: number
  grade: string
  verdict: string
  counts: Counts
  sections: {
    website: (SectionSummary & { url: string; platform: string | null; headerFix: Snippet | null }) | null
    code: (SectionSummary & { repo: string; url: string; branch: string | null; fileCount: number }) | null
  }
  findings: Finding[]
  passed: { source: Source; title: string }[]
  coverage: { check: string; status: 'partial' | 'failed'; note: string }[]
  scannedAt: string
  durationMs: number
}

export type StepState = 'pending' | 'active' | 'done' | 'failed' | 'skipped'

export interface Job {
  id: string
  status: 'queued' | 'running' | 'done' | 'failed'
  position: number | null
  target: { website: string | null; repo: string | null }
  steps: { key: string; label: string; state: StepState }[]
  result: Report | null
  error: string | null
  elapsedMs: number
}
