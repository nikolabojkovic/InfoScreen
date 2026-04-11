import { NavLink } from 'react-router-dom'
import './Navbar.css'

export default function Navbar({ transparent = false }) {
  return (
    <header className={`navbar ${transparent ? 'navbar--transparent' : 'navbar--solid'}`}>
      <div className="container nav-row">
        <NavLink className="brand" to="/">
          <span>NBO</span> Development
        </NavLink>
        <nav>
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
