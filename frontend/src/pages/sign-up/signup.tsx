import { Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import './signup.css'
import BgBeam from '../../components/BgBeam'

function SignUp() {
  const [isSignIn, setIsSignIn] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log(isSignIn ? 'Sign in submitted:' : 'Sign up submitted:', formData)
  }

  const toggleMode = () => {
    setIsSignIn(!isSignIn)
    setFormData({
      email: '',
      password: '',
      confirmPassword: ''
    })
  }

  return (
    <>
    <BgBeam/>
    <div className='signup-page'>
      <div className='signup-container'>
        <div className='signup-header'>
          <Link to='/' className='back-btn'>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </Link>
          <h1>{isSignIn ? 'Welcome Back' : 'Join Raptor'}</h1>
          <p>{isSignIn ? 'Sign in to your account to continue' : 'Create your account to start securing your apps'}</p>
        </div>

        <div className='signup-form-container'>
          <form className='signup-form' onSubmit={handleSubmit}>
            <div className='form-group'>
              <label htmlFor="email">Email Address</label>
              <div className='input-wrapper'>
                <Mail className='input-icon' size={20} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className='form-group'>
              <label htmlFor="password">Password</label>
              <div className='input-wrapper'>
                <Lock className='input-icon' size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder={isSignIn ? "Enter your password" : "Create a password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className='password-toggle'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {!isSignIn && (
              <div className='form-group'>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className='input-wrapper'>
                  <Lock className='input-icon' size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            )}

            <button type="submit" className='signup-btn'>
              {isSignIn ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className='divider'>
            <span>or continue with</span>
          </div>

          <div className='social-buttons'>
            <button className='social-btn google-btn'>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isSignIn ? 'Sign in with Google' : 'Sign up with Google'}
            </button>

            <button className='social-btn apple-btn'>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              {isSignIn ? 'Sign in with Apple' : 'Sign up with Apple'}
            </button>
          </div>

          <div className='signup-footer'>
            <p>
              {isSignIn ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button" 
                className='login-link' 
                onClick={toggleMode}
              >
                {isSignIn ? 'Sign up' : 'Sign in'}
              </button>
            </p>
            {!isSignIn && (
              <p className='terms'>
                By signing up, you agree to our <a href='#'>Terms of Service</a> and <a href='#'>Privacy Policy</a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
    
  )
}

export default SignUp