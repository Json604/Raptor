import { useId, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Globe, Plus, X } from 'lucide-react'
import { GitHubIcon } from './Icons'
import Spinner from './Spinner'
import { startScan } from '../lib/api'
import { isGithubInput } from '../lib/format'
import { EXAMPLES } from '../lib/site'
import './ScanForm.css'

type Kind = 'website' | 'repo'

function KindIcon({ kind }: { kind: Kind }) {
  return (
    <span className="field-icon" aria-hidden="true">
      <span className="field-icon-layer" data-visible={kind === 'website'}><Globe size={18} strokeWidth={2} /></span>
      <span className="field-icon-layer" data-visible={kind === 'repo'}><GitHubIcon size={17} /></span>
    </span>
  )
}

export default function ScanForm() {
  const navigate = useNavigate()
  const [primary, setPrimary] = useState('')
  const [secondary, setSecondary] = useState('')
  const [showSecondary, setShowSecondary] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const secondaryRef = useRef<HTMLInputElement>(null)
  const errorId = useId()

  const primaryKind: Kind = isGithubInput(primary) ? 'repo' : 'website'
  const secondaryKind: Kind = primaryKind === 'repo' ? 'website' : 'repo'

  const submit = async (values: { primary: string; secondary: string; withSecondary: boolean }) => {
    const entries = [values.primary.trim(), values.withSecondary ? values.secondary.trim() : ''].filter(Boolean)
    if (!entries.length) {
      setError('Paste your site\'s address or a GitHub repo link.')
      return
    }
    const repos = entries.filter(isGithubInput)
    const sites = entries.filter(entry => !isGithubInput(entry))
    if (repos.length > 1 || sites.length > 1) {
      setError('Put your website in one box and your GitHub repo in the other.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      const job = await startScan({ url: sites[0], repo: repos[0] })
      navigate(`/scan/${job.id}`, { state: { job } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!submitting) submit({ primary, secondary, withSecondary: showSecondary })
  }

  const runExample = (value: string) => {
    setPrimary(value)
    setSecondary('')
    setShowSecondary(false)
    submit({ primary: value, secondary: '', withSecondary: false })
  }

  const toggleSecondary = () => {
    if (showSecondary) {
      setShowSecondary(false)
      setSecondary('')
      return
    }
    setShowSecondary(true)
    // Focus once the row exists; the reveal animation never blocks typing.
    requestAnimationFrame(() => secondaryRef.current?.focus())
  }

  return (
    <div className="scan">
      <form className="scan-form" onSubmit={onSubmit} noValidate>
        <div className="field" data-filled={primary.trim().length > 0}>
          <KindIcon kind={primaryKind} />
          <label className="visually-hidden" htmlFor="scan-primary">Website or GitHub repo</label>
          <input
            id="scan-primary"
            type="text"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="myapp.com or github.com/me/app"
            value={primary}
            onChange={event => { setPrimary(event.target.value); setError('') }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
          <span className="field-kind t-caption" data-visible={primary.trim().length > 0} aria-hidden="true">
            {primaryKind === 'repo' ? 'GitHub repo' : 'Website'}
          </span>
        </div>

        <div className="field-reveal" data-open={showSecondary}>
          <div className="field-reveal-inner">
            <div className="field field-secondary">
              <KindIcon kind={secondaryKind} />
              <label className="visually-hidden" htmlFor="scan-secondary">
                {secondaryKind === 'repo' ? 'GitHub repo' : 'Website'}
              </label>
              <input
                id="scan-secondary"
                ref={secondaryRef}
                type="text"
                inputMode="url"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                tabIndex={showSecondary ? 0 : -1}
                placeholder={secondaryKind === 'repo' ? 'github.com/you/app' : 'yourapp.com'}
                value={secondary}
                onChange={event => { setSecondary(event.target.value); setError('') }}
              />
            </div>
          </div>
        </div>

        <div className="scan-actions">
          <button type="button" className="scan-add t-subhead" onClick={toggleSecondary} aria-expanded={showSecondary}>
            {showSecondary ? <X size={16} strokeWidth={2.25} /> : <Plus size={16} strokeWidth={2.25} />}
            {showSecondary
              ? `Remove ${secondaryKind === 'repo' ? 'repo' : 'website'}`
              : primary.trim()
                ? `Also scan your ${secondaryKind === 'repo' ? 'GitHub repo' : 'live site'}`
                : 'Scan a site and its repo together'}
          </button>
          <button type="submit" className="button button-primary scan-submit" disabled={submitting}>
            {submitting && <Spinner size={16} />}
            <span>{submitting ? 'Starting' : 'Scan'}</span>
            {!submitting && <ArrowRight size={18} strokeWidth={2.25} />}
          </button>
        </div>
      </form>

      <p id={errorId} className="scan-error t-subhead" role="alert" data-visible={Boolean(error)}>
        {error}
      </p>

      <div className="scan-examples t-subhead">
        <span className="secondary">Try it:</span>
        <button type="button" className="chip" onClick={() => runExample(EXAMPLES.leakySite)} disabled={submitting}>
          <Globe size={14} strokeWidth={2} /> A site leaking keys
        </button>
        <button type="button" className="chip" onClick={() => runExample(EXAMPLES.leakyRepo)} disabled={submitting}>
          <GitHubIcon size={14} /> A repo with leaked keys
        </button>
      </div>
    </div>
  )
}
