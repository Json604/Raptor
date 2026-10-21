import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Globe, RotateCw } from 'lucide-react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import Spinner from '../components/Spinner'
import StepList from '../components/StepList'
import ScoreRing from '../components/ScoreRing'
import FindingRow from '../components/FindingRow'
import CodeBlock from '../components/CodeBlock'
import CopyButton from '../components/CopyButton'
import Segmented from '../components/Segmented'
import { GitHubIcon } from '../components/Icons'
import { ApiError, getScan, startScan } from '../lib/api'
import { SEVERITY_LABEL, formatDuration, hostOf, toFixPrompt } from '../lib/format'
import type { Job, Severity, Source } from '../lib/types'
import './Scan.css'

// Faster while scanning (steps change every few seconds), slower while waiting in line.
const POLL_MS = { running: 900, queued: 2000 }
const STORAGE_PREFIX = 'raptor:scan:'
// Same lifetime as on the server, counted from when the scan finished. The
// browser copy only exists so a refresh or a brief server restart doesn't lose
// a report; it is never kept longer than the site promises.
const REPORT_TTL_MS = 2 * 60 * 60 * 1000
const MAX_SAVED_REPORTS = 20

const isExpired = (job: Job) => !job.result || Date.now() - Date.parse(job.result.scannedAt) > REPORT_TTL_MS

// Drops expired copies, then the oldest ones beyond the cap.
const pruneReports = () => {
  const saved: { key: string; finished: number }[] = []
  for (let index = localStorage.length - 1; index >= 0; index--) {
    const key = localStorage.key(index)
    if (!key?.startsWith(STORAGE_PREFIX)) continue
    try {
      const job = JSON.parse(localStorage.getItem(key) || 'null') as Job | null
      if (!job || isExpired(job)) localStorage.removeItem(key)
      else saved.push({ key, finished: Date.parse(job.result!.scannedAt) })
    } catch {
      localStorage.removeItem(key)
    }
  }
  saved.sort((a, b) => b.finished - a.finished).slice(MAX_SAVED_REPORTS).forEach(({ key }) => localStorage.removeItem(key))
}

const saveReport = (job: Job) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + job.id, JSON.stringify(job))
    pruneReports()
  } catch { /* storage full or blocked: the report still shows, it just won't survive a refresh */ }
}

const loadReport = (id: string): Job | null => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + id)
    if (!raw) return null
    const job = JSON.parse(raw) as Job
    if (isExpired(job)) {
      localStorage.removeItem(STORAGE_PREFIX + id)
      return null
    }
    return job
  } catch {
    return null
  }
}

type LoadError = { kind: 'expired' } | { kind: 'error'; message: string }

const ordinal = (n: number) => {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] || 'th'
  return `${n}${suffix}`
}

function Targets({ target }: { target: Job['target'] }) {
  return (
    <div className="targets">
      {target.website && (
        <a className="target" href={target.website} target="_blank" rel="noreferrer">
          <Globe size={15} strokeWidth={2} aria-hidden="true" /> {hostOf(target.website)}
        </a>
      )}
      {target.repo && (
        <a className="target" href={`https://github.com/${target.repo}`} target="_blank" rel="noreferrer">
          <GitHubIcon size={14} /> {target.repo}
        </a>
      )}
    </div>
  )
}

function useRescan(target: Job['target']) {
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const rescan = async () => {
    setPending(true)
    setError('')
    try {
      const job = await startScan({ url: target.website ?? undefined, repo: target.repo ?? undefined })
      navigate(`/scan/${job.id}`, { replace: true, state: { job } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start a new scan.')
    } finally {
      setPending(false)
    }
  }
  return { rescan, pending, error }
}

function Progress({ job }: { job: Job }) {
  // Tick locally between polls so the timer moves smoothly.
  const [now, setNow] = useState(() => Date.now())
  const [base] = useState(() => ({ at: Date.now(), elapsed: job.elapsedMs }))
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const elapsed = Math.max(job.elapsedMs, base.elapsed + (now - base.at))
  const done = job.steps.filter(step => step.state === 'done').length
  const queued = job.status === 'queued'

  return (
    <div className="progress container rise">
      <div className="progress-head">
        <h1 className="t-title1">{queued ? 'Waiting in line' : 'Scanning'}</h1>
        <Targets target={job.target} />
      </div>

      <div className="progress-card card">
        <div
          className="progress-bar"
          role="progressbar"
          aria-label="Scan progress"
          aria-valuemin={0}
          aria-valuemax={job.steps.length}
          aria-valuenow={done}
        >
          <span style={{ transform: `scaleX(${job.steps.length ? done / job.steps.length : 0})` }} />
        </div>
        {queued && (
          <div className="queue">
            <Spinner size={22} />
            <div>
              <p className="t-headline">{job.position ? `You're ${ordinal(job.position)} in line` : 'Starting'}</p>
              <p className="t-footnote secondary">
                {job.target.repo
                  ? 'Repo scans run one at a time so each one gets the whole machine.'
                  : 'This usually takes a few seconds.'}
              </p>
            </div>
          </div>
        )}
        <div className="progress-steps" data-queued={queued}>
          <StepList steps={job.steps} />
        </div>
      </div>

      <p className="progress-foot t-footnote secondary">
        {queued
          ? `Waiting ${formatDuration(elapsed)}`
          : `${formatDuration(elapsed)} elapsed${job.target.repo ? ' · repo scans usually take 10–45 seconds' : ''}`}
      </p>
    </div>
  )
}

function Failed({ job }: { job: Job }) {
  const { rescan, pending, error } = useRescan(job.target)
  return (
    <div className="state container rise">
      <span className="state-icon state-icon-error" aria-hidden="true"><AlertTriangle size={26} strokeWidth={2} /></span>
      <h1 className="t-title1">The scan didn't finish</h1>
      <p className="t-body secondary state-text">{job.error}</p>
      <Targets target={job.target} />
      <div className="state-actions">
        <button type="button" className="button button-primary" onClick={rescan} disabled={pending}>
          {pending ? <Spinner size={16} /> : <RotateCw size={17} strokeWidth={2.25} />} Try again
        </button>
        <Link to="/" className="button button-secondary">Change what to scan</Link>
      </div>
      {error && <p className="t-subhead state-error" role="alert">{error}</p>}
    </div>
  )
}

const GROUPS: Severity[] = ['critical', 'high', 'medium', 'low']

function ReportView({ job }: { job: Job }) {
  const report = job.result!
  const { rescan, pending, error } = useRescan(job.target)
  const both = Boolean(report.sections.website && report.sections.code)
  const [filter, setFilter] = useState<'all' | Source>('all')

  const visible = useMemo(
    () => report.findings.filter(finding => filter === 'all' || finding.source === filter),
    [report.findings, filter],
  )
  const problems = visible.filter(finding => finding.severity !== 'info')
  const tips = visible.filter(finding => finding.severity === 'info')
  const passed = report.passed.filter(item => filter === 'all' || item.source === filter)
  const headerFix = filter !== 'code' ? report.sections.website?.headerFix : null
  const firstOpen = problems.find(finding => finding.severity === 'critical' || finding.severity === 'high')?.id

  const meta = [
    `Scanned in ${formatDuration(report.durationMs)}`,
    report.sections.website?.platform && `Hosted on ${report.sections.website.platform}`,
    report.sections.code && `${report.sections.code.fileCount.toLocaleString()} files checked`,
  ].filter(Boolean).join(' · ')

  let stagger = 0
  const nextDelay = () => ({ '--i': Math.min(stagger++, 8) } as React.CSSProperties)

  return (
    <div className="report container">
      <header className="report-head rise" style={nextDelay()}>
        <Targets target={job.target} />
        <p className="t-footnote secondary">{meta}</p>
      </header>

      <section className="summary card rise" style={nextDelay()} aria-label="Summary">
        <ScoreRing score={report.score} grade={report.grade} />
        <div className="summary-text">
          <p className="summary-grade t-subhead">Grade {report.grade}</p>
          <h1 className="t-title1 summary-verdict">{report.verdict}</h1>
          <div className="counts">
            {report.counts.total === 0
              ? <span className="count" data-severity="success"><CheckCircle2 size={14} strokeWidth={2.5} aria-hidden="true" /> No issues found</span>
              : GROUPS.filter(severity => report.counts[severity] > 0).map(severity => (
                <span key={severity} className="count" data-severity={severity}>
                  <strong>{report.counts[severity]}</strong> {SEVERITY_LABEL[severity]}
                </span>
              ))}
          </div>
        </div>
      </section>

      <div className="report-actions rise" style={nextDelay()}>
        {report.counts.total > 0 && (
          <CopyButton
            variant="primary"
            text={() => toFixPrompt(report, job.target)}
            label="Copy fixes for your AI editor"
            copiedLabel="Copied. Paste it into your editor"
          />
        )}
        <button type="button" className="button button-secondary" onClick={rescan} disabled={pending}>
          {pending ? <Spinner size={16} /> : <RotateCw size={17} strokeWidth={2.25} />} Scan again
        </button>
      </div>
      {report.counts.total > 0 && (
        <p className="report-hint t-footnote secondary rise" style={nextDelay()}>
          Paste into Cursor, Claude Code, Lovable or Bolt and it will make the changes for you. Leaked keys still need revoking by hand.
        </p>
      )}
      {error && <p className="t-subhead state-error" role="alert">{error}</p>}

      {report.coverage.length > 0 && (
        <aside className="coverage rise" style={nextDelay()}>
          <AlertTriangle size={16} strokeWidth={2.25} aria-hidden="true" />
          <div>
            <p className="t-subhead"><strong>Some checks were limited</strong></p>
            <ul className="t-subhead secondary">
              {report.coverage.map(item => <li key={item.check + item.note}>{item.note}</li>)}
            </ul>
          </div>
        </aside>
      )}

      {both && (
        <div className="report-filter rise" style={nextDelay()}>
          <Segmented
            label="Show findings for"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All', count: report.counts.total },
              { value: 'website', label: 'Website', count: report.sections.website!.counts.total },
              { value: 'code', label: 'Code', count: report.sections.code!.counts.total },
            ]}
          />
        </div>
      )}

      {GROUPS.map(severity => {
        const items = problems.filter(finding => finding.severity === severity)
        if (!items.length) return null
        return (
          <section key={severity} className="group rise" style={nextDelay()} aria-label={SEVERITY_LABEL[severity]}>
            <h2 className="group-title" data-severity={severity}>
              {SEVERITY_LABEL[severity]} <span>{items.length}</span>
            </h2>
            <ul className="findings card">
              {items.map(finding => <FindingRow key={finding.id} finding={finding} defaultOpen={finding.id === firstOpen} />)}
            </ul>
          </section>
        )
      })}

      {problems.length === 0 && report.counts.total > 0 && (
        <p className="empty t-callout secondary">Nothing here. Switch to "All" to see every finding.</p>
      )}

      {headerFix && (
        <section className="group rise" style={nextDelay()} aria-label="Fix all headers">
          <h2 className="group-title">Fix every missing header in one paste</h2>
          <p className="t-subhead secondary group-sub">Add this to your project and redeploy. It covers every header finding above.</p>
          <CodeBlock snippet={headerFix} />
        </section>
      )}

      {tips.length > 0 && (
        <section className="group rise" style={nextDelay()} aria-label="Good to know">
          <h2 className="group-title" data-severity="info">Good to know <span>{tips.length}</span></h2>
          <ul className="findings card">
            {tips.map(finding => <FindingRow key={finding.id} finding={finding} />)}
          </ul>
        </section>
      )}

      {passed.length > 0 && (
        <section className="group rise" style={nextDelay()} aria-label="What looks good">
          <h2 className="group-title" data-severity="success">What looks good <span>{passed.length}</span></h2>
          <ul className="passed card">
            {passed.map(item => (
              <li key={item.source + item.title} className="t-subhead">
                <CheckCircle2 size={17} strokeWidth={2.25} aria-hidden="true" />
                {item.title}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default function Scan() {
  const { id = '' } = useParams()
  const location = useLocation()
  const initial = (location.state as { job?: Job } | null)?.job
  const [job, setJob] = useState<Job | null>(initial?.id === id ? initial : null)
  const [loadError, setLoadError] = useState<LoadError | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    let timer: number | undefined
    let failures = 0
    setLoadError(null)

    const poll = async () => {
      try {
        const next = await getScan(id)
        if (cancelled) return
        failures = 0
        setJob(next)
        if (next.status === 'done') saveReport(next)
        if (next.status === 'queued' || next.status === 'running') timer = window.setTimeout(poll, POLL_MS[next.status])
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 404) {
          const saved = loadReport(id)
          if (saved) setJob(saved)
          else setLoadError({ kind: 'expired' })
          return
        }
        failures++
        if (failures >= 6) {
          setLoadError({ kind: 'error', message: err instanceof Error ? err.message : 'Lost connection to Raptor.' })
          return
        }
        timer = window.setTimeout(poll, Math.min(1000 * 2 ** failures, 8000))
      }
    }

    poll()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [id, attempt])

  useEffect(() => {
    const target = job?.target.repo || (job?.target.website && hostOf(job.target.website))
    if (!target) return
    document.title = job?.status === 'done' && job.result
      ? `${job.result.grade} · ${target} · Raptor`
      : `Scanning ${target} · Raptor`
    return () => { document.title = 'Raptor: Is your app leaking your API keys?' }
  }, [job])

  let content: React.ReactNode
  if (loadError?.kind === 'expired') {
    content = (
      <div className="state container rise">
        <h1 className="t-title1">This scan has expired</h1>
        <p className="t-body secondary state-text">Results are kept for two hours, then deleted from our server and from your browser. Run it again; it only takes a few seconds.</p>
        <div className="state-actions"><Link to="/" className="button button-primary">New scan</Link></div>
      </div>
    )
  } else if (loadError) {
    content = (
      <div className="state container rise">
        <span className="state-icon state-icon-error" aria-hidden="true"><AlertTriangle size={26} strokeWidth={2} /></span>
        <h1 className="t-title1">Can't reach Raptor</h1>
        <p className="t-body secondary state-text">{loadError.message}</p>
        <div className="state-actions">
          <button type="button" className="button button-primary" onClick={() => setAttempt(value => value + 1)}>Retry</button>
          <Link to="/" className="button button-secondary">Home</Link>
        </div>
      </div>
    )
  } else if (!job) {
    content = <div className="state container"><Spinner size={24} label="Loading scan" /></div>
  } else if (job.status === 'failed') {
    content = <Failed job={job} />
  } else if (job.status === 'done' && job.result) {
    content = <ReportView key={job.id} job={job} />
  } else {
    // Keyed by status so the elapsed clock restarts when a queued scan begins.
    content = <Progress key={job.status} job={job} />
  }

  return (
    <>
      <Nav showNewScan />
      <main className="scan-page">{content}</main>
      <Footer />
    </>
  )
}
