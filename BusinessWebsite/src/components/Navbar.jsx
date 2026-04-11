import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './Navbar.css'

export default function Navbar({ transparent = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // Close menu on route change
  useEffect(() => { setOpen(false) }, [location])

  // Scroll listener for transparent (home) mode
  useEffect(() => {
    if (!transparent) return
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [transparent])

  const cls = !transparent
    ? 'navbar--solid'
    : scrolled
      ? 'navbar--transparent navbar--scrolled'
      : 'navbar--transparent'

  return (
    <header className={`navbar ${cls}${open ? ' navbar--open' : ''}`}>
      <div className="container nav-row">
        <NavLink className="brand" to="/">
          <span>NBO</span> Development
        </NavLink>

        {/* Hamburger button — visible only on mobile */}
        <button
          className={`nav-burger${open ? ' is-open' : ''}`}
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          <span /><span /><span />
        </button>

        <nav className={`nav-menu${open ? ' nav-menu--open' : ''}`}>
          <ul className="nav-links">
            <li><NavLink to="/" end>Home</NavLink></li>
            <li><NavLink to="/services">Services</NavLink></li>
            <li><NavLink to="/products">Products</NavLink></li>
            <li><NavLink to="/about">About Us</NavLink></li>
            <li><NavLink to="/contact">Contact Us</NavLink></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
