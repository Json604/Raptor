import type { Finding, Report, Severity } from './types'

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Good to know',
}

export const isGithubInput = (value: string) =>
  /^(https?:\/\/)?(www\.)?github\.com\/[^/\s]+\/[^/\s]+/i.test(value.trim())

export const hostOf = (url: string) => {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

export const formatDuration = (ms: number) => {
  const seconds = ms / 1000
  if (seconds < 10) return `${seconds.toFixed(1)}s`
  if (seconds < 60) return `${Math.round(seconds)}s`
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
}

export const gradeTone = (grade: string): Severity | 'success' =>
  grade === 'A' || grade === 'B' ? 'success' : grade === 'C' ? 'medium' : grade === 'D' ? 'high' : 'critical'

// A prompt people can paste into Cursor, Claude Code, Lovable or Bolt so their
// AI editor does the fixing. Raptor explains; their tools apply.
export const toFixPrompt = (report: Report, target: { website: string | null; repo: string | null }) => {
  const problems = report.findings.filter(finding => finding.severity !== 'info')
  const lines: string[] = [
    'I scanned my app with Raptor (a security scanner) and it found the issues below.',
    'Please fix them in my codebase, most serious first. Explain each change, keep existing behaviour working,',
    'and tell me which steps I have to do myself (like revoking leaked keys in a provider dashboard).',
    '',
  ]
  if (target.website) lines.push(`Website: ${target.website}`)
  if (target.repo) lines.push(`Repository: https://github.com/${target.repo}`)
  if (report.sections.website?.platform) lines.push(`Hosting: ${report.sections.website.platform}`)
  lines.push('')

  problems.forEach((finding: Finding, index) => {
    lines.push(`## ${index + 1}. [${finding.severity.toUpperCase()}] ${finding.title}`)
    if (finding.location) lines.push(`Where: ${finding.locations && finding.locations.length > 1 ? finding.locations.join(', ') : finding.location}`)
    lines.push(`Problem: ${finding.summary}`)
    lines.push(`Why it matters: ${finding.risk}`)
    lines.push('Fix:')
    finding.fix.forEach(step => lines.push(`- ${step}`))
    if (finding.snippet) {
      lines.push('', `${finding.snippet.label}:`, '```' + (finding.snippet.language === 'text' ? '' : finding.snippet.language), finding.snippet.code, '```')
    }
    lines.push('')
  })

  if (!problems.length) lines.push('Raptor found no issues. Nothing to fix.')
  return lines.join('\n')
}
