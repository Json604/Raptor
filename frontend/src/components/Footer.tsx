import { GitHubIcon, LogoMark } from './Icons'
import { SITE } from '../lib/site'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner container-wide">
        <div className="footer-brand">
          <LogoMark size={16} />
          <span className="t-footnote">Raptor. Security checks for people who ship fast.</span>
        </div>
        <nav className="footer-links t-footnote" aria-label="Contact">
          <a href={`mailto:${SITE.email}`}>Email</a>
          <a href={SITE.twitter} target="_blank" rel="noreferrer">X</a>
          <a href={SITE.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          <a href={SITE.repoUrl} target="_blank" rel="noreferrer" className="footer-github">
            <GitHubIcon size={14} /> GitHub
          </a>
        </nav>
      </div>
    </footer>
  )
}
