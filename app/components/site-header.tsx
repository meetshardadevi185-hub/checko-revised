'use client';

import { useEffect, useState } from 'react';
import { nav } from '../content';

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onResize = () => { if (window.innerWidth > 860) setOpen(false); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); };
  }, [open]);

  return (
    <header className={`header${scrolled ? ' scrolled' : ''}${open ? ' menu-open' : ''}`}>
      <div className="header-inner">
        <a href="#top" className="brand" aria-label="Checko, back to top">
          <img className="logo" src="/assets/checko.svg" alt="Checko" width={479} height={139} />
        </a>
        <nav id="site-nav" className="nav" aria-label="Main">
          <ul>
            {nav.map(item => (
              <li key={item.href}><a href={item.href} onClick={() => setOpen(false)}>{item.label}</a></li>
            ))}
          </ul>
          <a className="button nav-cta-mobile" href="#contact" onClick={() => setOpen(false)}>Book a demo</a>
        </nav>
        <a className="button nav-cta" href="#contact">Book a demo</a>
        <button
          type="button" className="menu-toggle" aria-controls="site-nav" aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(o => !o)}
        >
          <span aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
