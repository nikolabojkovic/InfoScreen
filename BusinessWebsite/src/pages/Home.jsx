import { Link } from 'react-router-dom'
import heroImg from '../assets/dashboard/banner-background.png'
import customDevImg from '../assets/dashboard/customSoftwareDevelopment.png'
import responsiveDesignImg from '../assets/dashboard/responsiveDesign.png'
import specializedTeamImg from '../assets/dashboard/specializedTeam.png'
import Navbar from '../components/Navbar'

export default function Home() {
  return (
    <div className="site">
      <Navbar transparent />

      <section className="hero-panel" id="home" style={{ backgroundImage: `url(${heroImg})` }}>
        <div className="hero-overlay">
          <p className="kicker">NBO</p>
          <h1>Development</h1>
          <p className="sub-kicker">Software Solutions</p>
          <p className="hero-copy">
            Transform your ideas into software solutions without stress and issues.
            Let our specialized team help you.
          </p>
          <Link to="/contact" className="cta-link">
            <button className="cta">Let&apos;s get started</button>
          </Link>
        </div>
      </section>

      <section className="section feature" id="services">
        <div className="container split">
          <div>
            <h2>Custom Software Development</h2>
            <p>
              We build solutions using <strong>C#</strong>, <strong>React</strong> and <strong>Angular</strong> — tailored
              exactly to your business specifications. We design, plan and deliver fast.
            </p>
            <Link to="/services" className="learn-more">Explore our services →</Link>
          </div>
          <div className="visual visual-img">
            <img src={customDevImg} alt="Custom software development" className="section-img custom-dev-img" />
          </div>
        </div>
      </section>

      <section className="section feature" id="about">
        <div className="container split reverse">
          <div className="visual visual-img">
            <img src={specializedTeamImg} alt="Specialized team" className="section-img specialized-team-img" />
          </div>
          <div>
            <h2>Specialized Team</h2>
            <p>Fast delivery is possible only if the team is highly specialized and well organized.</p>
            <ul className="bullet-list">
              <li>Senior .NET / C# engineers with domain expertise</li>
              <li>React &amp; Angular frontend specialists</li>
              <li>Cloud architects (Azure &amp; AWS)</li>
              <li>Dedicated QA and DevOps engineers</li>
            </ul>
            <Link to="/about" className="learn-more">Meet the team →</Link>
          </div>
        </div>
      </section>

      <section className="section feature">
        <div className="container split">
          <div>
            <h2>Responsive Design</h2>
            <p>
              Every application we build looks great and performs flawlessly on
              desktop, tablet and phone. We test on every device.
            </p>
          </div>
          <div className="visual visual-img">
            <img src={responsiveDesignImg} alt="Responsive design" className="section-img responsive-img" />
          </div>
        </div>
      </section>

      {/* Products teaser */}
      <section className="section bg-dark-panel">
        <div className="container text-center">
          <h2 className="section-title light">Our Ready Products</h2>
          <p className="section-sub">Deploy battle-tested systems and go live in days, not months.</p>
          <div className="products-grid">
            <div className="product-card">
              <div className="product-icon">🎫</div>
              <h3>Ticketing System</h3>
              <p>Full-featured support and issue tracking platform adaptable to any industry.</p>
              <Link to="/products" className="card-link">Learn more →</Link>
            </div>
            <div className="product-card">
              <div className="product-icon">💹</div>
              <h3>Financial Platform</h3>
              <p>Track revenue, expenses, invoices and generate real-time financial reports.</p>
              <Link to="/products" className="card-link">Learn more →</Link>
            </div>
            <div className="product-card">
              <div className="product-icon">☁️</div>
              <h3>Cloud Hosting</h3>
              <p>We host and manage your applications on Azure or AWS with 99.9% uptime SLA.</p>
              <Link to="/products" className="card-link">Learn more →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section pricing" id="pricing">
        <div className="container">
          <h2 className="section-title">Options and Pricing</h2>
          <div className="pricing-grid">
            <article className="price-card">
              <h3>Small Project</h3>
              <p>starting at</p>
              <h4><span className="currency">$</span><span className="amount">20K</span></h4>
              <p>up to 10 pages</p>
              <p>Some text about pricing and project</p>
              <button>Order Now</button>
            </article>
            <article className="price-card">
              <h3>Medium Project</h3>
              <p>starting at</p>
              <h4><span className="currency">$</span><span className="amount">50K</span></h4>
              <p>10 – 50 pages</p>
              <p>Some text about pricing and project</p>
              <button>Order Now</button>
            </article>
            <article className="price-card">
              <h3>Large Project</h3>
              <p>starting at</p>
              <h4><span className="currency">$</span><span className="amount">100K</span></h4>
              <p>50+ pages</p>
              <p>Some text about pricing and project</p>
              <button>Order Now</button>
            </article>
          </div>
        </div>
      </section>

      <section className="section process">
        <div className="container">
          <h2 className="section-title">How to Start</h2>
          <div className="steps">
            <div className="step">
              <div className="dot"></div>
              <p>Initial Call</p>
            </div>
            <div className="arrow">→</div>
            <div className="step">
              <div className="dot"></div>
              <p>Project Rough Estimating &amp; Price Negotiation</p>
            </div>
            <div className="arrow">→</div>
            <div className="step">
              <div className="dot"></div>
              <p>Project Planning &amp; Detailed Estimations Approval</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <footer className="footer" id="contact">
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
