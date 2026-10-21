import { Link } from 'react-router-dom'
import { GitHubIcon, LogoMark } from './Icons'
import { SITE } from '../lib/site'
import './Nav.css'

export default function Nav({ showSections = false, showNewScan = false }: { showSections?: boolean; showNewScan?: boolean }) {
  return (
    <header className="nav">
      <div className="nav-inner container-wide">
        <Link to="/" className="nav-brand" aria-label="Raptor home">
          <LogoMark size={20} />
          <span>Raptor</span>
        </Link>

        <nav className="nav-actions" aria-label="Main">
          {showSections && (
            <>
              <a className="nav-link" href="/#checks">What it checks</a>
              <a className="nav-link" href="/#faq">FAQ</a>
            </>
          )}
          {showNewScan && (
            <Link to="/" className="button button-secondary button-small">New scan</Link>
          )}
          <a
            className="nav-icon"
            href={SITE.repoUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Raptor on GitHub"
            title="Raptor on GitHub"
          >
            <GitHubIcon size={20} />
          </a>
        </nav>
      </div>
    </header>
  )
}
