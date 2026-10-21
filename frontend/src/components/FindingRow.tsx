import { useId, useState } from 'react'
import { ChevronRight, ArrowUpRight } from 'lucide-react'
import CodeBlock from './CodeBlock'
import { SEVERITY_LABEL } from '../lib/format'
import type { Finding } from '../lib/types'
import './FindingRow.css'

// Fix steps often contain the URL where a key gets revoked; make those clickable.
const Linkified = ({ text }: { text: string }) => (
  <>
    {text.split(/(https?:\/\/[^\s)]+)/g).map((part, index) =>
      /^https?:\/\//.test(part)
        ? <a key={index} href={part} target="_blank" rel="noreferrer">{part.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>
        : part,
    )}
  </>
)

const learnMoreLabel = (url: string) =>
  /howtorotate|api-?keys|tokens|credentials|security_credentials|settings/i.test(url) ? 'Open rotation guide' : 'Learn more'

export default function FindingRow({ finding, defaultOpen = false, style }: { finding: Finding; defaultOpen?: boolean; style?: React.CSSProperties }) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = useId()
  const locations = finding.locations && finding.locations.length > 1 ? finding.locations : null

  return (
    <li className="finding" data-severity={finding.severity} data-open={open} style={style}>
      <button type="button" className="finding-head" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen(value => !value)}>
        <span className="finding-dot" aria-hidden="true" />
        <span className="finding-heading">
          <span className="finding-title t-headline">{finding.title}</span>
          <span className="finding-meta t-footnote">
            <span>{finding.category}</span>
            {finding.location && <span className="finding-location mono">{finding.location}</span>}
          </span>
        </span>
        <span className="finding-badges">
          {finding.verified && <span className="pill pill-critical">Still works</span>}
          <span className="pill pill-severity">{SEVERITY_LABEL[finding.severity]}</span>
        </span>
        <ChevronRight className="finding-chevron" size={18} strokeWidth={2} aria-hidden="true" />
      </button>

      <div className="finding-reveal" id={bodyId} role="region" aria-label={finding.title} inert={!open}>
        <div className="finding-reveal-inner">
          <div className="finding-body">
            <p className="t-callout">{finding.summary}</p>

            <div className="finding-block">
              <h4 className="finding-label">Why it matters</h4>
              <p className="t-subhead secondary">{finding.risk}</p>
            </div>

            <div className="finding-block">
              <h4 className="finding-label">How to fix it</h4>
              <ol className="finding-steps t-subhead">
                {finding.fix.map((step, index) => <li key={index}><Linkified text={step} /></li>)}
              </ol>
            </div>

            {finding.snippet && <CodeBlock snippet={finding.snippet} />}

            {(finding.evidence || locations) && (
              <div className="finding-block">
                <h4 className="finding-label">What we found</h4>
                {finding.evidence && <pre className="finding-evidence mono">{finding.evidence}</pre>}
                {locations && (
                  <ul className="finding-locations t-footnote mono">
                    {locations.slice(0, 8).map(location => <li key={location}>{location}</li>)}
                    {locations.length > 8 && <li className="secondary">and {locations.length - 8} more</li>}
                  </ul>
                )}
              </div>
            )}

            {finding.learnMore && (
              <a className="finding-link t-subhead" href={finding.learnMore} target="_blank" rel="noreferrer">
                {learnMoreLabel(finding.learnMore)} <ArrowUpRight size={15} strokeWidth={2} aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}
