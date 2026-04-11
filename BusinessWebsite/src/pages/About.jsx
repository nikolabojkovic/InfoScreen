import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const STACK = [
  { name: 'C#', color: '#9b59b6' },
  { name: '.NET 8', color: '#512bd4' },
  { name: 'ASP.NET Core', color: '#512bd4' },
  { name: 'React', color: '#61dafb' },
  { name: 'Angular', color: '#dd0031' },
  { name: 'TypeScript', color: '#3178c6' },
  { name: 'SQL Server', color: '#cc2927' },
  { name: 'PostgreSQL', color: '#336791' },
  { name: 'Azure', color: '#0089d6' },
  { name: 'AWS', color: '#ff9900' },
  { name: 'Docker', color: '#2496ed' },
  { name: 'GitHub Actions', color: '#24292e' },
]

const VALUES = [
  {
    icon: '🎯',
    title: 'Results First',
    body: 'We measure success by the business outcomes we drive, not by hours billed or lines of code written.',
  },
  {
    icon: '🔍',
    title: 'Radical Transparency',
    body: 'Weekly progress reports, shared project boards, and honest conversations when something isn\'t working.',
  },
  {
    icon: '🔒',
    title: 'Secure by Default',
    body: 'Security is baked into every sprint — OWASP Top 10 reviews, dependency scanning, and penetration testing.',
  },
  {
    icon: '🚀',
    title: 'Fast Delivery',
    body: 'Short sprints, continuous deployment and automated testing keep us shipping value every two weeks.',
  },
]

const HOW_WE_WORK = [
  { step: '01', title: 'Discovery Call', body: 'We learn about your business, goals, and technical landscape in a 60-minute video call.' },
  { step: '02', title: 'Project Scoping', body: 'Our team produces a detailed scope document, architecture plan, and fixed-price estimate.' },
  { step: '03', title: 'Agile Development', body: 'Two-week sprints with demo sessions, automated CI/CD, and a shared tracking board.' },
  { step: '04', title: 'QA & Testing', body: 'Unit, integration, and end-to-end automated tests plus manual UAT before every release.' },
  { step: '05', title: 'Launch & Handover', body: 'We deploy to production, run smoke tests, and hand over full documentation and source code.' },
  { step: '06', title: 'Support & Growth', body: 'Ongoing maintenance plans, feature additions, and 24/7 infrastructure monitoring.' },
]

export default function About() {
  return (
    <div className="site">
      <Navbar />

      <section className="inner-hero">
        <div className="container">
          <p className="kicker">Who We Are</p>
          <h1 className="page-hero-title">About NBO Development</h1>
          <p className="page-hero-sub">
            A team of senior engineers based in Belgrade, Serbia, building software
            that helps businesses grow — from internal tools to enterprise-grade platforms.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="section feature">
        <div className="container split">
          <div>
            <h2>Our Mission</h2>
            <p>
              We believe great software should be accessible to businesses of every size.
              Our mission is to deliver <strong>enterprise-quality engineering</strong> at
              startup-friendly speed — removing the complexity so you can focus on your
              business.
            </p>
            <p>
              Since our founding we have delivered projects for clients across finance,
              logistics, healthcare and retail. Every project ships on time, within
              budget, and with source code that your internal team can maintain and extend.
            </p>
          </div>
          <div className="visual mission-visual">
            <div className="stat-grid">
              <div className="stat-box">
                <span className="stat-num">50+</span>
                <span className="stat-label">Projects Delivered</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">8+</span>
                <span className="stat-label">Years Experience</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">30+</span>
                <span className="stat-label">Happy Clients</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">99.9%</span>
                <span className="stat-label">Uptime SLA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section bg-light">
        <div className="container">
          <h2 className="section-title">Our Values</h2>
          <div className="values-grid">
            {VALUES.map(v => (
              <div className="value-card" key={v.title}>
                <div className="value-icon">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How we work */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">How We Work</h2>
          <p className="section-sub-dark">
            A repeatable, transparent process that consistently delivers great results.
          </p>
          <div className="how-grid">
            {HOW_WE_WORK.map(item => (
              <div className="how-card" key={item.step}>
                <div className="how-step">{item.step}</div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="section bg-light">
        <div className="container text-center">
          <h2 className="section-title">Technology Stack</h2>
          <p className="section-sub-dark">
            We work with modern, battle-tested technologies so your software stays
            maintainable for years to come.
          </p>
          <div className="stack-grid">
            {STACK.map(t => (
              <div className="stack-pill" key={t.name} style={{ borderColor: t.color, color: t.color }}>
                {t.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="container text-center">
          <h2 className="section-title light">Let&apos;s Build Together</h2>
          <p className="section-sub light">
            Reach out and tell us about your project. No commitment, just a conversation.
          </p>
          <Link to="/contact">
            <button className="cta cta-dark">Get in Touch</button>
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
