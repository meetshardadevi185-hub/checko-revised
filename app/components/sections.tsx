import { proof } from '../content';
import ScanDemo from './scan-demo';
import ContactForm from './contact-form';

const Tick = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <span className="eyebrow reveal" style={{ '--i': 0 } as React.CSSProperties}><span className="mini-focus" aria-hidden="true" /> Scan to verify</span>
        <h1 id="hero-title" className="reveal" style={{ '--i': 1 } as React.CSSProperties}>
          Scan it. Know<br /> it’s <span className="underline">genuine.<i aria-hidden="true" /></span>
        </h1>
        <p className="intro-text reveal" style={{ '--i': 2 } as React.CSSProperties}>
          Every Checko label carries a random 3D pattern that cannot be copied. Point a phone at it and the Checko app tells you in seconds whether the product is real.
        </p>
        <div className="actions reveal" style={{ '--i': 3 } as React.CSSProperties}>
          <a className="button" href="#contact">Book a demo</a>
          <a className="button secondary" href="#samples">Get free sample labels</a>
        </div>
        <p className="assurance reveal" style={{ '--i': 4 } as React.CSSProperties}>
          <span className="live-dot" aria-hidden="true" /> Works with any smartphone, in any light. No special hardware.
        </p>
        <ul className="proof reveal" style={{ '--i': 5 } as React.CSSProperties}>
          {proof.map(p => (
            <li key={p.value}>{p.prefix ? <>Born at <strong>{p.value}</strong></> : <><strong>{p.value}</strong> {p.label}</>}</li>
          ))}
        </ul>
      </div>
      <div className="hero-visual reveal" style={{ '--i': 2 } as React.CSSProperties}>
        <ScanDemo />
      </div>
    </section>
  );
}

export function About() {
  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <div className="about-card" data-rv>
        <img className="about-logo" src="/assets/checko.svg" alt="" width={479} height={139} loading="lazy" />
        <div>
          <span className="kicker">About Checko</span>
          <h2 id="about-title">The fingerprint of things.</h2>
          <p>Born at IIT Kanpur, Checko gives every product a physical identity that can’t be copied: a pattern of raised ink set at random, read by any phone. Brands use it to protect their customers, reach them after the sale and follow their products to the shelf.</p>
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <span id="samples" className="anchor" aria-hidden="true" />
      <div className="contact-copy" data-rv>
        <span className="kicker">Talk to us</span>
        <h2 id="contact-title">See Checko on <span className="hl">your own products.</span></h2>
        <p>Book a demo, ask for free sample labels or get pricing for your volumes. Pricing depends on your product, label volume and integration needs.</p>
        <ul className="contact-points">
          <li><Tick />A walkthrough built around your category</li>
          <li><Tick />Sample labels to test on your packaging</li>
          <li><Tick />A quote for your volumes and integrations</li>
        </ul>
      </div>
      <ContactForm />
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer-inner" data-rv>
        <img className="logo" src="/assets/checko.svg" alt="Checko" width={479} height={139} loading="lazy" />
        <p>The fingerprint of things.</p>
        <nav aria-label="Footer">
          <a href="#problem">The problem</a>
          <a href="#solutions">Solutions</a>
          <a href="#industries">Industries</a>
          <a href="#contact">Contact</a>
        </nav>
        <p className="footer-legal">© {new Date().getFullYear()} Checko. Born at IIT Kanpur.</p>
      </div>
    </footer>
  );
}
