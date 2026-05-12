import './Footer.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-title">National Institute of Technology Tiruchirappalli</p>
        <p className="footer-address">Tamil Nadu, India - 620015</p>
        <p className="footer-contact">
          For queries, contact: <a href="mailto:library@nitt.edu">library@nitt.edu</a>
        </p>
        <p className="footer-copyright">
          © {currentYear} NIT Trichy. All Rights Reserved.
        </p>
      </div>
    </footer>
  )
}