import heroImg from './assets/dashboard/banner-background.png'
import customDevImg from './assets/dashboard/customSoftwareDevelopment.png'
import responsiveDesignImg from './assets/dashboard/responsiveDesign.png'
import specializedTeamImg from './assets/dashboard/specializedTeam.png'
import './App.css'

function App() {
  return (
    <div className="site">
      <header className="hero-header">
        <div className="container nav-row">
          <a className="brand" href="#home">
            <span>NBO</span> Development
          </a>
          <nav>
            <ul className="nav-links">
              <li>
                <a href="#home">Home</a>
              </li>
              <li>
                <a href="#clients">Clients</a>
              </li>
              <li>
                <a href="#services">Services</a>
              </li>
              <li>
                <a href="#about">About Us</a>
              </li>
              <li>
                <a href="#contact">Contact Us</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <section className="hero-panel" id="home" style={{ backgroundImage: `url(${heroImg})` }}>
        <div className="hero-overlay">
          <p className="kicker">NBO</p>
          <h1>Development</h1>
          <p className="sub-kicker">Software Solutions</p>
          <p className="hero-copy">
            Transform your ideas into software solutions without stress and issues.
            Let specialized team help you.
          </p>
          <button className="cta">Let&apos;s get started</button>
        </div>
      </section>

      <section className="section feature" id="services">
        <div className="container split">
          <div>
            <h2>Custom Software Development</h2>
            <p>
              Developing solutions according to clients specifications is our biggest
              strength. Here we design and plan and we will build website and deliver
              fast.
            </p>
          </div>
          <div className="visual visual-img">
            <img
              src={customDevImg}
              alt="Custom software development"
              className="section-img custom-dev-img"
            />
          </div>
        </div>
      </section>

      <section className="section feature" id="about">
        <div className="container split reverse">
          <div className="visual visual-img">
            <img
              src={specializedTeamImg}
              alt="Specialized team"
              className="section-img specialized-team-img"
            />
          </div>
          <div>
            <h2>Specialized Team</h2>
            <p>
              Fast delivery is possible only if the team is highly specialized and well
              organized.
            </p>
            <p>
               Our team is well organized software development team, specialized in
                building responsive and reactive highly optimized websites and web
                applications.
            </p>
          </div>
        </div>
      </section>

      <section className="section feature">
        <div className="container split">
          <div>
            <h2>Responsive Design</h2>
            <p>
              You can be sure that you website or web application is going to work and
              look great on every device. Our team also do testing on every device so that
              you can be sure that you are going to get quality.
            </p>
          </div>
          <div className="visual visual-img">
            <img
              src={responsiveDesignImg}
              alt="Responsive design"
              className="section-img responsive-img"
            />
          </div>
        </div>
      </section>

      <section className="section pricing" id="clients">
        <div className="container">
          <h2 className="section-title">Options and Pricing</h2>
          <div className="pricing-grid">
            <article className="price-card">
              <h3>Small Project</h3>
              <p>starting at</p>
              <h4>
                <span className="currency">$</span>
                <span className="amount">20K</span>
              </h4>
              <p>up to 10 pages</p>
              <p>Some text about pricing and project</p>
              <button>Order Now</button>
            </article>
            <article className="price-card">
              <h3>Medium Project</h3>
              <p>starting at</p>
              <h4>
                <span className="currency">$</span>
                <span className="amount">50K</span>
              </h4>
              <p>10 - 50 pages</p>
              <p>Some text about pricing and project</p>
              <button>Order Now</button>
            </article>
            <article className="price-card">
              <h3>Large Project</h3>
              <p>starting at</p>
              <h4>
                <span className="currency">$</span>
                <span className="amount">100K</span>
              </h4>
              <p>50+ pages</p>
              <p>Some text about pricing and project</p>
              <button>Order Now</button>
            </article>
          </div>
        </div>
      </section>

      <section className="section process">
        <div className="container">
          <h2 className="section-title">How to start</h2>
          <div className="steps">
            <div className="step">
              <div className="dot"></div>
              <p>Initial Call</p>
            </div>
            <div className="arrow">→</div>
            <div className="step">
              <div className="dot"></div>
              <p>Project rough Estimating &amp; price negotiation</p>
            </div>
            <div className="arrow">→</div>
            <div className="step">
              <div className="dot"></div>
              <p>Project Planning &amp; detailed estimations approval</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer" id="contact">
        <div className="container footer-grid">
          <div>
            <h2 className="footer-brand">
              <span>NBO</span>
              <br />
              Development
            </h2>
            <p>Software Solutions</p>
            <p>Phone: +381 60 34 34 097</p>
            <p>Location: 11000 Belgrade, Serbia</p>
          </div>

          <div>
            <h3>Services</h3>
            <ul>
              <li>website Link 1</li>
              <li>website website Link 1</li>
              <li>website website Link 1</li>
              <li>website website Link 1</li>
              <li>website Link 1</li>
            </ul>
          </div>

          <div>
            <h3>About Us</h3>
            <ul>
              <li>website website Link 1</li>
              <li>website Link 1</li>
              <li>website website Link 1</li>
              <li>website Link 1</li>
              <li>website Link 1</li>
            </ul>
          </div>

          <div>
            <h3>Clients</h3>
            <ul>
              <li>website website Link 1</li>
              <li>website website Link 1</li>
              <li>website website Link 1</li>
              <li>website Link 1</li>
              <li>website Link 1</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
