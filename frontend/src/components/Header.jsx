import { Link } from 'react-router-dom'
import './Header.css'

export default function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo-link">
          <div className="logo">
            <img src="/assets/logo.png" alt="NIT Trichy Logo" />
          </div>
        </Link>
        <div className="header-text">
          <h1>National Institute of Technology Tiruchirappalli</h1>
          <p>Duplicate ID Card Re-issue Application Portal</p>
        </div>
      </div>
    </header>
  )
}