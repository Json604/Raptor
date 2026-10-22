import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GitHubIcon, LogoMark, XIcon } from './Icons'
import HistoryMenu from './HistoryMenu'
import ThemeToggle from './ThemeToggle'
import { SITE } from '../lib/site'
import './Nav.css'

// Past this many pixels the bar condenses into its compact form.
const SCROLL_THRESHOLD = 24

export default function Nav({ showSections = false, showNewScan = false }: { showSections?: boolean; showNewScan?: boolean }) {
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > SCROLL_THRESHOLD)

  useEffect(() => {
    // Setting the same value is a no-op for React, so this only re-renders when
    // the threshold is actually crossed.
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="nav" data-scrolled={scrolled}>
      <div className="nav-pill">
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
          <HistoryMenu />
          <ThemeToggle />
          <a
            className="nav-icon"
            href={SITE.twitter}
            target="_blank"
            rel="noreferrer"
            aria-label="Raptor's maker on X"
            title="Follow on X"
          >
            <XIcon size={17} />
          </a>
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
