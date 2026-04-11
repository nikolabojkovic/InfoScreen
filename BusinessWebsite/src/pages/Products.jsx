import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Products() {
  return (
    <div className="site">
      <Navbar />

      <section className="inner-hero">
        <div className="container">
          <p className="kicker">Ready to Deploy</p>
          <h1 className="page-hero-title">Our Products</h1>
          <p className="page-hero-sub">
            Battle-tested software systems you can license and go live in weeks,
            not months. Each product is fully customisable to your brand and workflow.
          </p>
        </div>
      </section>

      {/* Ticketing System */}
      <section className="section feature">
        <div className="container">
          <div className="product-hero-card">
            <div className="product-hero-text">
              <span className="service-tag">Support &amp; Operations</span>
              <h2>Ticketing System</h2>
              <p>
                A complete help-desk and issue-tracking platform for managing customer
                requests, internal IT tickets, or any workflow that needs structured
                assignment and resolution. Built with <strong>ASP.NET Core</strong> backend
                and an <strong>Angular</strong> frontend, hosted on Azure.
              </p>
              <div className="feature-cols">
                <ul className="bullet-list">
                  <li>Multi-channel ticket intake (email, web form, API)</li>
                  <li>Customisable ticket statuses &amp; priorities</li>
                  <li>SLA timers &amp; breach alerts</li>
                  <li>Agent assignment &amp; round-robin routing</li>
                  <li>Automated email notifications</li>
                </ul>
                <ul className="bullet-list">
                  <li>Role-based access (Agent, Supervisor, Admin)</li>
                  <li>Reporting dashboard &amp; CSV export</li>
                  <li>Knowledge base &amp; FAQ module</li>
                  <li>REST API for integrations</li>
                  <li>White-label branding</li>
                </ul>
              </div>
              <div className="product-cta-row">
                <Link to="/contact">
                  <button className="cta">Request a Demo</button>
                </Link>
                <span className="price-hint">Starting at <strong>$15K</strong> / one-time licence</span>
              </div>
            </div>
            <div className="product-hero-visual ticketing-visual">
              <div className="mock-screen">
                <div className="mock-topbar">
                  <span className="mock-dot red" /><span className="mock-dot yellow" /><span className="mock-dot green" />
                  <span className="mock-title">Ticket Dashboard</span>
                </div>
                <div className="mock-body">
                  <div className="mock-stat-row">
                    <div className="mock-stat">
                      <span className="mock-stat-num teal">142</span>
                      <span>Open</span>
                    </div>
                    <div className="mock-stat">
                      <span className="mock-stat-num orange">28</span>
                      <span>Urgent</span>
                    </div>
                    <div className="mock-stat">
                      <span className="mock-stat-num green">314</span>
                      <span>Resolved</span>
                    </div>
                  </div>
                  <div className="mock-table-row header">
                    <span>ID</span><span>Subject</span><span>Status</span>
                  </div>
                  {['#1042 – Server error', '#1041 – Login issue', '#1040 – Invoice missing'].map((t, i) => (
                    <div className="mock-table-row" key={i}>
                      <span className="mock-id">#{1042 - i}</span>
                      <span>{['Server error', 'Login issue', 'Invoice missing'][i]}</span>
                      <span className={['badge open', 'badge urgent', 'badge resolved'][i]}>
                        {['Open', 'Urgent', 'Resolved'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Financial Platform */}
      <section className="section feature bg-light">
        <div className="container">
          <div className="product-hero-card reverse">
            <div className="product-hero-visual financial-visual">
              <div className="mock-screen">
                <div className="mock-topbar">
                  <span className="mock-dot red" /><span className="mock-dot yellow" /><span className="mock-dot green" />
                  <span className="mock-title">Financial Overview</span>
                </div>
                <div className="mock-body">
                  <div className="mock-stat-row">
                    <div className="mock-stat">
                      <span className="mock-stat-num green">$84K</span>
                      <span>Revenue</span>
                    </div>
                    <div className="mock-stat">
                      <span className="mock-stat-num red">$31K</span>
                      <span>Expenses</span>
                    </div>
                    <div className="mock-stat">
                      <span className="mock-stat-num teal">$53K</span>
                      <span>Profit</span>
                    </div>
                  </div>
                  <div className="mock-chart-bars">
                    {[55, 70, 45, 80, 60, 90, 75].map((h, i) => (
                      <div key={i} className="mock-bar" style={{ height: h + '%' }} />
                    ))}
                  </div>
                  <div className="mock-months">
                    {['Jan','Feb','Mar','Apr','May','Jun','Jul'].map(m => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="product-hero-text">
              <span className="service-tag">Finance &amp; Accounting</span>
              <h2>Financial Management Platform</h2>
              <p>
                Track every dollar that moves through your business — invoices,
                expenses, payroll and tax reports — in one cloud-hosted platform.
                Built with <strong>React</strong> and a <strong>C# microservices</strong> backend.
              </p>
              <div className="feature-cols">
                <ul className="bullet-list">
                  <li>Revenue &amp; expense tracking</li>
                  <li>Invoice generation &amp; PDF export</li>
                  <li>Recurring billing &amp; reminders</li>
                  <li>Multi-currency &amp; tax support</li>
                  <li>Bank reconciliation</li>
                </ul>
                <ul className="bullet-list">
                  <li>Real-time P&amp;L &amp; balance sheet</li>
                  <li>Budget planning &amp; forecasting</li>
                  <li>Role-based financial access</li>
                  <li>Audit trail &amp; compliance logs</li>
                  <li>QuickBooks / Xero API sync</li>
                </ul>
              </div>
              <div className="product-cta-row">
                <Link to="/contact">
                  <button className="cta">Request a Demo</button>
                </Link>
                <span className="price-hint">Starting at <strong>$20K</strong> / one-time licence</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CRM teaser */}
      <section className="section feature">
        <div className="container split">
          <div>
            <span className="service-tag">Coming Soon</span>
            <h2>CRM &amp; Sales Pipeline</h2>
            <p>
              Manage leads, deals and customer relationships with a CRM platform
              integrated directly into your existing software stack. Join the
              waitlist to be notified at launch.
            </p>
            <Link to="/contact">
              <button className="cta cta-outline">Join the Waitlist</button>
            </Link>
          </div>
          <div className="visual coming-soon-visual">
            <div className="coming-soon-badge">Coming Q3 2025</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="container text-center">
          <h2 className="section-title light">Need a Custom Product?</h2>
          <p className="section-sub light">
            We can build a tailor-made system from scratch or extend any of our
            products to fit your exact requirements.
          </p>
          <Link to="/contact">
            <button className="cta cta-dark">Talk to Us</button>
          </Link>
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
