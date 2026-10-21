import { useState } from 'react'
import { Braces, Check, ChevronRight, Database, FileWarning, KeyRound, Lock, Package, ShieldCheck } from 'lucide-react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import ScanForm from '../components/ScanForm'
import FindingRow from '../components/FindingRow'
import type { Finding } from '../lib/types'
import './Home.css'

const CHECKS = [
  {
    icon: KeyRound,
    title: 'Leaked API keys',
    body: 'Gitleaks and TruffleHog search every file in your repo, and tell you when a leaked key still works.',
  },
  {
    icon: Braces,
    title: 'Keys shipped to the browser',
    body: 'We read your site\'s JavaScript the way an attacker would, looking for OpenAI, Stripe and Supabase secrets.',
  },
  {
    icon: FileWarning,
    title: 'Exposed files',
    body: 'Public .env files and .git folders: the first thing bots look for on any new site.',
  },
  {
    icon: Database,
    title: 'Open databases',
    body: 'Firebase rules left in test mode, and Supabase keys that skip Row Level Security.',
  },
  {
    icon: ShieldCheck,
    title: 'Missing protections',
    body: 'HTTPS, security headers, cookies and CORS, with fixes written for Vercel, Netlify and Next.js.',
  },
  {
    icon: Package,
    title: 'Vulnerable packages',
    body: 'npm audit on your lockfile, filtered to the code that actually ships to production.',
  },
]

const SAMPLE: Finding = {
  id: 'sample',
  source: 'website',
  category: 'Secrets',
  severity: 'critical',
  title: 'OpenAI API key is visible in your website\'s code',
  summary: 'Anyone who opens your site can find this key in its JavaScript (View Source works). With it they can run up your OpenAI bill and use your account.',
  risk: 'Bots scrape public JavaScript for keys like this. Assume it has already been copied.',
  fix: [
    'Revoke this key now and create a new one: https://platform.openai.com/api-keys',
    'Move the code that calls OpenAI into a server function (a Next.js API route or a Vercel function) and keep the key there as an environment variable.',
    'Never prefix secret keys with VITE_, NEXT_PUBLIC_ or REACT_APP_. Those prefixes copy the value into the browser bundle.',
  ],
  evidence: 'sk-pro••••••••x7Q',
  location: 'https://yourapp.vercel.app/assets/index-3f9a2c.js',
  verified: false,
}

const FAQ = [
  {
    q: 'Is it safe to scan my site?',
    a: 'Yes. Raptor only does what a browser does: it loads your homepage, its JavaScript files and a few well-known paths like /.env. There are no attacks, no login attempts and no load testing.',
  },
  {
    q: 'Do you keep my code?',
    a: 'No. Repos are downloaded to a temporary folder, scanned, and deleted as soon as the scan finishes. Reports are kept in memory for two hours so you can share the link, then they\'re gone. Leaked keys are always masked in reports.',
  },
  {
    q: 'Can it scan private repos?',
    a: 'Not yet. Raptor scans public GitHub repos and any publicly reachable website. If your repo is private, you can still scan your live site.',
  },
  {
    q: 'Is this a full security audit?',
    a: 'No, and it doesn\'t pretend to be. It catches the most common and most damaging mistakes in apps built fast with AI tools, in under a minute. If you handle payments or health data, get a professional review too.',
  },
  {
    q: 'What does "still works" mean on a leaked key?',
    a: 'TruffleHog safely checks some key types against the provider (for example, asking AWS "who am I?"). If the provider accepts the key, it\'s live and anyone who finds it can use it right now.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="faq-item" data-open={open}>
      <button type="button" className="faq-question t-headline" aria-expanded={open} onClick={() => setOpen(value => !value)}>
        {q}
        <ChevronRight size={18} strokeWidth={2} className="faq-chevron" aria-hidden="true" />
      </button>
      <div className="faq-reveal" inert={!open}>
        <div className="faq-reveal-inner">
          <p className="faq-answer t-callout secondary">{a}</p>
        </div>
      </div>
    </li>
  )
}

export default function Home() {
  return (
    <>
      <Nav showSections />
      <main>
        <section className="hero">
          <div className="container hero-inner">
            <p className="eyebrow t-footnote rise" style={{ '--i': 0 } as React.CSSProperties}>
              Free · No sign-up · Results in seconds
            </p>
            <h1 className="t-hero hero-title rise" style={{ '--i': 1 } as React.CSSProperties}>
              Is your app leaking your API keys?
            </h1>
            <p className="hero-sub rise" style={{ '--i': 2 } as React.CSSProperties}>
              Raptor checks your live site and GitHub repo for leaked keys, exposed files and missing protections,
              then tells you how to fix each one in plain English.
            </p>
            <div className="hero-form rise" style={{ '--i': 3 } as React.CSSProperties}>
              <ScanForm />
            </div>
            <p className="hero-privacy t-footnote">
              <Lock size={13} strokeWidth={2.25} aria-hidden="true" />
              Code is scanned in a temporary folder and deleted right after. Keys are always masked.
            </p>
          </div>
        </section>

        <section id="checks" className="section section-alt">
          <div className="container-wide">
            <header className="section-header">
              <h2 className="t-large">What Raptor checks</h2>
              <p className="section-sub">The mistakes that actually get apps hacked, not a 200-item compliance checklist.</p>
            </header>
            <ul className="checks">
              {CHECKS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="check card">
                  <span className="check-icon" aria-hidden="true"><Icon size={20} strokeWidth={2} /></span>
                  <h3 className="t-headline">{title}</h3>
                  <p className="t-subhead secondary">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section">
          <div className="container-wide fixes">
            <div className="fixes-copy">
              <h2 className="t-large">Every problem comes with its fix.</h2>
              <p className="section-sub">No jargon, no 40-page PDF. Each finding tells you what's wrong, why it matters and exactly what to change.</p>
              <ul className="fixes-points t-callout">
                {[
                  'Copy-paste snippets for your host and framework',
                  'Direct links to where you revoke each leaked key',
                  'One click copies every fix as a prompt for Cursor, Claude Code or Lovable',
                ].map(point => (
                  <li key={point}>
                    <span className="fixes-check" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="fixes-demo">
              <ul className="findings card">
                <FindingRow finding={SAMPLE} defaultOpen />
              </ul>
            </div>
          </div>
        </section>

        <section id="faq" className="section section-alt">
          <div className="container">
            <header className="section-header">
              <h2 className="t-large">Questions</h2>
            </header>
            <ul className="faq card">
              {FAQ.map(item => <FaqItem key={item.q} {...item} />)}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
