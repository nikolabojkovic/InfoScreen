import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Services() {
  return (
    <div className="site">
      <Navbar />

      <section className="inner-hero">
        <div className="container">
          <p className="kicker">What We Do</p>
          <h1 className="page-hero-title">Our Services</h1>
          <p className="page-hero-sub">
            End-to-end software engineering from discovery to deployment, built on
            proven Microsoft and cloud-native technologies.
          </p>
        </div>
      </section>

      {/* C# / .NET */}
      <section className="section feature">
        <div className="container split">
          <div>
            <span className="service-tag">Backend Engineering</span>
            <h2>C# &amp; .NET Development</h2>
            <p>
              We build robust, high-performance backends and APIs with <strong>C#</strong>,
              <strong> .NET 8</strong>, and <strong>ASP.NET Core</strong>. Our engineers
              follow clean architecture principles so your codebase stays maintainable
              as it grows.
            </p>
            <ul className="bullet-list">
              <li>REST &amp; GraphQL APIs</li>
              <li>Microservices architecture</li>
              <li>Entity Framework / Dapper ORM</li>
              <li>SQL Server, PostgreSQL, CosmosDB</li>
              <li>Background jobs &amp; message queues (Hangfire, RabbitMQ)</li>
            </ul>
          </div>
          <div className="visual service-visual dotnet-visual">
            <div className="tech-badge-grid">
              <span className="tech-badge">C#</span>
              <span className="tech-badge">.NET 8</span>
              <span className="tech-badge">ASP.NET Core</span>
              <span className="tech-badge">Entity Framework</span>
              <span className="tech-badge">SQL Server</span>
              <span className="tech-badge">CosmosDB</span>
            </div>
          </div>
        </div>
      </section>

      {/* React */}
      <section className="section feature bg-light">
        <div className="container split reverse">
          <div className="visual service-visual react-visual">
            <div className="tech-badge-grid">
              <span className="tech-badge accent">React</span>
              <span className="tech-badge accent">Vite</span>
              <span className="tech-badge accent">TypeScript</span>
              <span className="tech-badge accent">Redux Toolkit</span>
              <span className="tech-badge accent">React Query</span>
              <span className="tech-badge accent">Tailwind / CSS</span>
            </div>
          </div>
          <div>
            <span className="service-tag">Frontend Engineering</span>
            <h2>React Development</h2>
            <p>
              Modern single-page applications built with <strong>React 18</strong> and
              <strong> TypeScript</strong>. We focus on performance, accessibility and
              pixel-perfect UI that converts users into customers.
            </p>
            <ul className="bullet-list">
              <li>Component-driven UI architecture</li>
              <li>State management (Redux Toolkit, Zustand)</li>
              <li>Server-side rendering with Next.js</li>
              <li>Real-time dashboards &amp; data visualisation</li>
              <li>E2E testing with Playwright</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Angular */}
      <section className="section feature">
        <div className="container split">
          <div>
            <span className="service-tag">Frontend Engineering</span>
            <h2>Angular Development</h2>
            <p>
              Enterprise-grade SPAs and portals built with <strong>Angular 17+</strong>.
              Angular&apos;s opinionated structure and built-in dependency injection make it
              the ideal choice for large teams and long-lived projects.
            </p>
            <ul className="bullet-list">
              <li>Standalone components &amp; signals</li>
              <li>NgRx state management</li>
              <li>Role-based access control (RBAC)</li>
              <li>Complex multi-step forms &amp; workflows</li>
              <li>Admin portals &amp; internal tools</li>
            </ul>
          </div>
          <div className="visual service-visual angular-visual">
            <div className="tech-badge-grid">
              <span className="tech-badge red">Angular 17+</span>
              <span className="tech-badge red">TypeScript</span>
              <span className="tech-badge red">NgRx</span>
              <span className="tech-badge red">RxJS</span>
              <span className="tech-badge red">Angular Material</span>
              <span className="tech-badge red">PrimeNG</span>
            </div>
          </div>
        </div>
      </section>

      {/* Cloud Hosting */}
      <section className="section feature bg-light">
        <div className="container split reverse">
          <div className="visual service-visual cloud-visual">
            <div className="tech-badge-grid">
              <span className="tech-badge teal">Azure</span>
              <span className="tech-badge teal">AWS</span>
              <span className="tech-badge teal">Docker</span>
              <span className="tech-badge teal">Kubernetes</span>
              <span className="tech-badge teal">GitHub Actions</span>
              <span className="tech-badge teal">Terraform</span>
            </div>
          </div>
          <div>
            <span className="service-tag">Infrastructure</span>
            <h2>Cloud Hosting &amp; DevOps</h2>
            <p>
              We set up, deploy and manage your application on <strong>Azure</strong>
              or <strong>AWS</strong> with automated CI/CD pipelines, monitoring, and
              a 99.9% uptime SLA.
            </p>
            <ul className="bullet-list">
              <li>Infrastructure as Code (Terraform / Bicep)</li>
              <li>Containerised deployments (Docker / Kubernetes)</li>
              <li>CI/CD pipelines (GitHub Actions, Azure DevOps)</li>
              <li>Application monitoring &amp; alerting</li>
              <li>Automated backups &amp; disaster recovery</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="container text-center">
          <h2 className="section-title light">Ready to Build Something?</h2>
          <p className="section-sub light">
            Tell us about your project and we'll get back to you within 24 hours.
          </p>
          <Link to="/contact">
            <button className="cta cta-dark">Get a Free Estimate</button>
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
