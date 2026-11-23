'use client';

import { useEffect } from 'react';

/**
 * Scroll reveal for the whole page: anything marked data-rv rises into place when it scrolls into view;
 * data-rv-stagger does the same for its children, one after another. Content is only hidden when this
 * script runs (html.js), and everything shows at once with reduced motion.
 */
export default function Reveal() {
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>('[data-rv], [data-rv-stagger]')];
    els.forEach(el => {
      if (el.hasAttribute('data-rv-stagger')) [...el.children].forEach((c, i) => (c as HTMLElement).style.setProperty('--rv-delay', `${Math.min(i, 8) * 70}ms`));
    });
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
