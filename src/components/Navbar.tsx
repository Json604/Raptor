import './components.css'
import logo from '../assets/logo.svg'
import { useState } from 'react'
// import { Link } from 'react-router-dom'

interface NavLink {
    label: string;
    href: string;
}

interface NavbarProps {
    links?: NavLink[];
    brandHref?: string;
}

function Navbar({ links, brandHref = '/#home' }: NavbarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    // Default links for home page
    const defaultLinks: NavLink[] = [
        { label: 'Why', href: '/#why' },
        { label: 'Tools', href: '/#tools' },
        { label: 'Contact', href: '/#contact' },
    ]

    const navLinks = links || defaultLinks

    return(
        <div className='navbar'>
            <a href={brandHref} className='brand'>
                <img src={logo} width={35} height={35} alt='logo'/>
                <p style={{fontSize:'1.6rem'}}>Raptor</p>
            </a>
            
            {/* Desktop Menu */}
            <div className='sections desktop-menu'>
                {navLinks.map((link, index) => (
                    <a key={index} href={link.href}>{link.label}</a>
                ))}
            </div>
            
            {/* Desktop Sign-in */}
            {/* <Link to='/signup'><div className='signin desktop-signin'>Sign-up</div></Link>             */}
            
            {/* Mobile Hamburger Menu */}
            <div className='hamburger' onClick={toggleMenu}>
                <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
                <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
                <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
            </div>
            
            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className='mobile-menu'>
                    {navLinks.map((link, index) => (
                        <a key={index} href={link.href} onClick={() => setIsMenuOpen(false)}>
                            {link.label}
                        </a>
                    ))}
                    {/* <Link to='/signup'> */}
                    {/* <div className='mobile-signin'>Sign-up</div> */}
                    {/* </Link> */}
                </div>
            )}
        </div>
    )
}

export default Navbar