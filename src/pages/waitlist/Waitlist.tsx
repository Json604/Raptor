import { useState } from 'react'
import './Waitlist.css'
import BgBeam from '../../components/BgBeam'
import { Mail, ArrowRight, Shield, Zap, Lock } from 'lucide-react'


function Waitlist() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const WAITLIST_URL = import.meta.env.VITE_WAITLIST_URL;

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    setEmailError("")
    setSuccessMessage("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous messages
    setEmailError("")
    setSuccessMessage("")
    
    // Client-side validation
    if (!email || email.trim().length === 0) {
      setEmailError("Please enter your email address")
      return
    }
    
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address")
      return
    }

    // Submit to backend
    setIsLoading(true)
    
    try {
      const response = await fetch(`${WAITLIST_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        // Success (201)
        setIsSubmitted(true)
        setSuccessMessage("🎉 You're on the list! We'll notify you when Raptor launches.")
        setEmail("")
        
        // Reset success state after 5 seconds
        setTimeout(() => {
          setIsSubmitted(false)
          setSuccessMessage("")
        }, 5000)
      } else {
        // Handle error responses
        if (response.status === 400) {
          // Validation error
          setEmailError(data.message || "Please enter a valid email address")
        } else if (response.status === 409) {
          // Duplicate email
          setEmailError(data.message || "You already joined the waitlist!")
        } else {
          // Other errors
          setEmailError(data.message || "Something went wrong. Please try again.")
        }
      }
    } catch (error) {
      // Network or other errors
      console.error("Waitlist submission error:", error)
      setEmailError("Unable to connect to server. Please check your internet connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <BgBeam />
      <div className='waitlist-container'>
        <div className='waitlist-content'>
          {/* Hero Section */}
          <div className='waitlist-hero'>
            
            <h1 className='waitlist-heading'>
              Instant Security Scans for Modern Apps
            </h1>
            
            <p className='waitlist-subheading'>
              Scan your live site for secrets, vulnerabilities, and risks in seconds.
            </p>

            {/* Features Pills */}
            <div className='feature-pills'>
              <div className='pill'>
                <Zap size={16} />
                <span>Instant Scanning</span>
              </div>
              <div className='pill'>
                <Lock size={16} />
                <span>AI-Powered Fixes</span>
              </div>
              <div className='pill'>
                <Shield size={16} />
                <span>Real-time Monitoring</span>
              </div>
            </div>
          </div>

          {/* Waitlist Form */}
          <div className='waitlist-form-section'>
            <h2 className='form-title'>Join the Waitlist</h2>
            <p className='form-subtitle'>
              Be the first to know when Raptor launches. Get early access and exclusive updates.
            </p>

            <form className='waitlist-form' onSubmit={handleSubmit}>
              <div className={`email-input-container ${emailError ? 'error' : ''} ${isSubmitted ? 'success' : ''}`}>
                {/* <div className='inputBox'> */}
                <Mail size={20} className='email-icon' />
                <input
                  type="email"
                  placeholder='Enter your email address'
                  value={email}
                  onChange={handleEmailChange}
                  disabled={isSubmitted || isLoading}
                  className='email-input'
                />
                {/* </div> */}
                <button 
                  type='submit' 
                  className={`submit-button ${isSubmitted ? 'submitted' : ''} ${isLoading ? 'loading' : ''}`}
                  disabled={isSubmitted || isLoading}
                >
                  {isLoading ? (
                    <>
                      <span>Joining...</span>
                      <svg className='spinner-icon' width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                    </>
                  ) : isSubmitted ? (
                    <>
                      <span>Joined!</span>
                      <svg className='check-icon' width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </>
                  ) : (
                    <>
                      <span>Join Waitlist</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
              
              {emailError && (
                <div className='error-message'>
                  {emailError}
                </div>
              )}
              
              {successMessage && isSubmitted && (
                <div className='success-message'>
                  {successMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className='waitlist-footer'>
        <div className='footer-content'>
          <div className='footer-brand'>
            <h3>Raptor</h3>
            <p>Solving Security for vibe-coded apps.</p>
          </div>
          
          <div className='footer-links'>
            <div className='footer-section'>
              <h4>Contact</h4>
              <a href='mailto:kartikey060105@gmail.com' target="_blank" className='contact-link'>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Email
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

export default Waitlist

