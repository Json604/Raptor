import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Globe, History } from 'lucide-react'
import { GitHubIcon } from './Icons'
import { clearReports, listReports, onHistoryChange } from '../lib/history'
import { gradeTone, hostOf } from '../lib/format'
import type { Job } from '../lib/types'
import './HistoryMenu.css'

const timeAgo = (iso: string) => {
  const minutes = Math.floor((Date.now() - Date.parse(iso)) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  return `${Math.floor(minutes / 60)} hr ago`
}

const describe = (job: Job) => {
  const { website, repo } = job.target
  if (website && repo) return { kind: 'website', title: hostOf(website), detail: `Site + ${repo}` }
  if (repo) return { kind: 'repo', title: repo, detail: 'GitHub repo' }
  return { kind: 'website', title: hostOf(website ?? ''), detail: 'Website' }
}

// Recent scans saved in this browser. The icon only appears when there is
// something to show, so first-time visitors never see an empty menu.
export default function HistoryMenu() {
  const [reports, setReports] = useState<Job[]>(() => listReports())
  const [open, setOpen] = useState(false)
  const [originX, setOriginX] = useState(24)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const { pathname } = useLocation()

  useEffect(() => onHistoryChange(() => setReports(listReports())), [])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const toggle = () => {
    if (!open) {
      setReports(listReports()) // drop anything that expired while the page was open
      // Scale the panel out of the icon, not out of the panel's corner.
      const actions = rootRef.current?.closest('.nav-actions')?.getBoundingClientRect()
      const button = buttonRef.current?.getBoundingClientRect()
      if (actions && button) setOriginX(actions.right - (button.left + button.width / 2))
    }
    setOpen(value => !value)
  }

  const clear = () => {
    clearReports()
    setOpen(false)
  }

  if (!reports.length && !open) return null

  return (
    <div className="history" ref={rootRef} data-open={open}>
      <button
        ref={buttonRef}
        type="button"
        className="nav-icon"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Recent scans (${reports.length})`}
        title="Recent scans"
        onClick={toggle}
      >
        <History size={19} strokeWidth={2} />
      </button>

      <div
        className="history-panel"
        id={panelId}
        role="region"
        aria-label="Recent scans"
        inert={!open}
        style={{ '--origin-x': `${originX}px` } as React.CSSProperties}
      >
        <div className="history-head">
          <span className="history-title t-footnote">Recent scans</span>
          {reports.length > 0 && (
            <button type="button" className="history-clear t-footnote" onClick={clear}>Clear</button>
          )}
        </div>

        {reports.length ? (
          <ul className="history-list">
            {reports.map(job => {
              const { kind, title, detail } = describe(job)
              const current = pathname === `/scan/${job.id}`
              return (
                <li key={job.id}>
                  <Link
                    to={`/scan/${job.id}`}
                    state={{ job }}
                    className="history-item"
                    aria-current={current ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <span className="history-grade" data-tone={gradeTone(job.result!.grade)} aria-label={`Grade ${job.result!.grade}`}>
                      {job.result!.grade}
                    </span>
                    <span className="history-text">
                      <span className="history-name">
                        {kind === 'repo' ? <GitHubIcon size={13} /> : <Globe size={13} strokeWidth={2} aria-hidden="true" />}
                        <span>{title}</span>
                      </span>
                      <span className="history-meta t-caption">{detail} · {timeAgo(job.result!.scannedAt)}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="history-empty t-subhead secondary">No recent scans.</p>
        )}

        <p className="history-foot t-caption">Saved in this browser for 2 hours, then deleted.</p>
      </div>
    </div>
  )
}
