import { useState } from 'react'
import Navbar from '../components/Navbar'

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    service: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    // TODO: wire up to backend / email service
    setSubmitted(true)
  }

  return (
    <div className="site">
      <Navbar />

      <section className="inner-hero">
        <div className="container">
          <p className="kicker">Reach Out</p>
          <h1 className="page-hero-title">Contact Us</h1>
          <p className="page-hero-sub">
            Tell us about your project and we&apos;ll get back to you within one business day.
          </p>
        </div>
      </section>

      <section className="section contact-section">
        <div className="container contact-grid">

          {/* Contact info */}
          <div className="contact-info">
            <h2>Let&apos;s Talk</h2>
            <p>
              We love hearing about new projects. Whether you have a detailed spec or
              just a rough idea, we&apos;re happy to help you shape it into a plan.
            </p>

            <div className="contact-detail">
              <div className="contact-icon">📞</div>
              <div>
                <h4>Phone</h4>
                <p>+381 60 34 34 097</p>
              </div>
            </div>
            <div className="contact-detail">
              <div className="contact-icon">📧</div>
              <div>
                <h4>Email</h4>
                <p>hello@nbodevelopment.com</p>
              </div>
            </div>
            <div className="contact-detail">
              <div className="contact-icon">📍</div>
              <div>
                <h4>Location</h4>
                <p>11000 Belgrade, Serbia</p>
              </div>
            </div>
            <div className="contact-detail">
              <div className="contact-icon">🕐</div>
              <div>
                <h4>Working Hours</h4>
                <p>Monday – Friday, 9 AM – 6 PM CET</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="contact-form-wrap">
            {submitted ? (
              <div className="form-success">
                <div className="success-icon">✅</div>
                <h3>Message Sent!</h3>
                <p>Thank you for reaching out. We&apos;ll reply within one business day.</p>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Smith"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@company.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="company">Company</label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      placeholder="Acme Corp"
                      value={form.company}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="service">Interested In</label>
                    <select
                      id="service"
                      name="service"
                      value={form.service}
                      onChange={handleChange}
                    >
                      <option value="">Select a service…</option>
                      <option>C# / .NET Development</option>
                      <option>React Development</option>
                      <option>Angular Development</option>
                      <option>Cloud Hosting &amp; DevOps</option>
                      <option>Ticketing System</option>
                      <option>Financial Platform</option>
                      <option>Custom Project</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="message">Tell Us About Your Project *</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    placeholder="Describe your project, goals, and any relevant technical details…"
                    value={form.message}
                    onChange={handleChange}
                    required
                  />
                </div>
                <button type="submit" className="cta form-submit">Send Message</button>
              </form>
            )}
          </div>
        </div>
      </section>

      <PageFooter />
    </div>
  )
}

function PageFooter() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h2 className="footer-brand"><span>NBO</span><br />Development</h2>
          <p>Software Solutions</p>
          <p>Phone: +381 60 34 34 097</p>
          <p>Location: 11000 Belgrade, Serbia</p>
        </div>
        <div>
          <h3>Services</h3>
          <ul>
            <li>C# / .NET Development</li>
            <li>React Development</li>
            <li>Angular Development</li>
            <li>Cloud Hosting</li>
            <li>DevOps &amp; CI/CD</li>
          </ul>
        </div>
        <div>
          <h3>Products</h3>
          <ul>
            <li>Ticketing System</li>
            <li>Financial Platform</li>
            <li>Business Analytics</li>
            <li>CRM System</li>
          </ul>
        </div>
        <div>
          <h3>Company</h3>
          <ul>
            <li>About Us</li>
            <li>Our Team</li>
            <li>Clients</li>
            <li>Contact Us</li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
