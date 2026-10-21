import './Home.css'
import { X, Clock, BookOpen, Zap, Bot, Wrench, Users } from 'lucide-react'
import Navbar from '../../components/Navbar'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import BgBeam from '../../components/BgBeam'

function Home() {
  // const [githubUrl, setGithub] = useState("")
  const [webUrl, setURL] = useState("")
  const [urlError, setUrlError] = useState("")

  const handleWebUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setURL(value)
    setUrlError("") // Clear any existing errors
  }

  const canScan = () => {
    return webUrl && webUrl.trim().length > 0
  }

  return (
    <>
    <Navbar />
    <BgBeam />
    <div id='home' className='container1'>
      <div className='box1'>
        <p className='heading'>Instant Security Scans for Modern Apps</p>
        <div className='subheading'>
          {/* GitHub repo or */}
          <p>Scan your live site for secrets, vulnerabilities, and risks in seconds.</p>
          <p className='subHighlight'>no login required.</p>
        </div>
      </div>
      <div className='box2'>
        <a href='#tools' className='scanBtn'>Start Free Scan</a>
      </div>
    </div>

    <div id='tools' className='container2'>
      <div className='contentBox'>
        {/* public GitHub repository or  */}
        <p className='contentBoxHeading'>Paste your deployed app link to get your security report.</p>
        {/* <div style={{display:'flex', justifyContent:'center'}}>
          <input className='gitORsite' placeholder='Enter github repo link or live app URL' />
        </div>
         */}
        {/* <p style={{color: '#959595', textAlign:'center',marginTop: '2.6rem', fontSize:'1.5rem'}}>OR</p> */}

        <div className='gitANDsite'>
          {/* <input value={githubUrl} onChange={(e) => (setGithub(e.target.value))} placeholder='Enter github repo link' /> */}
          {/* <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#959595" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg> */}
          <div className={`url-input-wrapper ${urlError ? 'error' : ''}`}>
            <span className="url-prefix">https://</span>
            <input 
              value={webUrl} 
              onChange={handleWebUrlChange} 
              placeholder='example.com' 
            />
          </div>
        </div>
        {urlError && (
          <div style={{ color: '#ff4444', fontSize: '0.9rem', marginTop: '0.5rem', textAlign: 'center' }}>
            {urlError}
          </div>
        )}
        <div className='btns'>
          {canScan() ? (
            <Link to='/results' state={{ webUrl}}><div className='quickScan' style={{color:'black'}}>Quick scan</div></Link>
          ) : (
            <div className='quickScan' style={{color:'#666', cursor: 'not-allowed', opacity: 0.6}}>Quick scan</div>
          )}
          {/* <Link to='/results'> */}
          <div className='fullScan' style={{color:'black'}}>
            Deep scan
            <span className='coming-soon-banner'>Coming Soon</span>
          </div>
          {/* </Link> */}
        </div>
      </div>
    </div>

    <div id='why' className='container3'>
      <div className='why-content'>
        <div className='why-header'>
          <h2>Why Raptor?</h2>
          <p className='why-subtitle'>Security for creators, learners, and builders—at the speed and simplicity you deserve.</p>
        </div>

        <div className='why-problem'>
          <h3>The Problem</h3>
          <p>App-building is easier than ever—thanks to AI, no-code, and low-code platforms. But "easy to build" can mean "easy to break."</p>
          <div className='stats'>
            <div className='stat-item'>
              <span className='stat-number'>50-70%</span>
              <span className='stat-text'>of new apps are built by non-tech users</span>
            </div>
          </div>
          <p className='problem-detail'>Most don't realize how quickly secrets, tokens, and basic flaws can leak online.</p>
        </div>

        <div className='why-existing-tools'>
          <h3>Existing security tools weren't built for this new wave</h3>
          <div className='tool-problems'>
            <div className='problem-item'>
              <div className='problem-icon'>
                <X size={24} />
              </div>
              <div className='problem-text'>
                <strong>Designed for big dev teams</strong>
                <p>Filled with jargon and expensive for solo founders</p>
              </div>
            </div>
            <div className='problem-item'>
              <div className='problem-icon'>
                <Clock size={24} />
              </div>
              <div className='problem-text'>
                <strong>Too much time & money</strong>
                <p>Require too much expertise to use effectively</p>
              </div>
            </div>
            <div className='problem-item'>
              <div className='problem-icon'>
                <BookOpen size={24} />
              </div>
              <div className='problem-text'>
                <strong>Technical docs, not solutions</strong>
                <p>Non-tech builders get lost in complex documentation</p>
              </div>
            </div>
          </div>
        </div>

        <div className='why-raptor'>
          <h3>Raptor is different</h3>
          <div className='raptor-features'>
            <div className='feature-item'>
              <div className='feature-icon'>
                <Zap size={28} />
              </div>
              <div className='feature-content'>
                <h4>Instant scanning</h4>
                <p>Scans your GitHub repo or app link with no setup, and no login required.</p>
              </div>
            </div>
            <div className='feature-item'>
              <div className='feature-icon'>
                <Bot size={28} />
              </div>
              <div className='feature-content'>
                <h4>AI-powered explanations</h4>
                <p>Uses AI to turn security findings into plain-English explanations—like "forgetting to lock a door," not "CSP violation."</p>
              </div>
            </div>
            <div className='feature-item'>
              <div className='feature-icon'>
                <Wrench size={28} />
              </div>
              <div className='feature-content'>
                <h4>Copy-paste fixes</h4>
                <p>Provides step-by-step recommendations and smart risk scoring with actionable solutions.</p>
              </div>
            </div>
            <div className='feature-item'>
              <div className='feature-icon'>
                <Users size={28} />
              </div>
              <div className='feature-content'>
                <h4>Built for creators</h4>
                <p>Designed for solo hackers, no-coders, and anyone who wants safe apps without enterprise complexity.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <footer id='contact' className='footer'>
      <div className='footer-content'>
        <div className='footer-brand'>
          <h3>Raptor</h3>
          <p>Security for creators, learners, and builders at the speed and simplicity you deserve.</p>
        </div>
        
        <div className='footer-links'>
          <div className='footer-section'>
            <h4>Product</h4>
            <a href='#tools'>Security Scanner</a>
            <a href='#why'>Why Raptor</a>
            {/* <a href='#'>Pricing</a> */}
          </div>
          
          <div className='footer-section'>
            <h4>Contact</h4>
            <a href='mailto:kartikey060105@gmail.com' target="_blank" className='contact-link'>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Mail
            </a>
            <a href='https://x.com/infin8erer' target="_blank" className='contact-link'>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Twitter
            </a>
            <a href='https://www.linkedin.com/in/kartikey10121' target="_blank" className='contact-link'>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
              LinkedIn
            </a>
          </div>
        </div>
      </div>
      
      <div className='footer-bottom'>
        <p>&copy; {new Date().getFullYear()} Raptor. All rights reserved.</p>
      </div>
    </footer>

    </>

  )
}

export default Home
