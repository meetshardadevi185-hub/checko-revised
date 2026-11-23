'use client';

import { useEffect, useState } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';
const INTERESTS = ['Book a demo', 'Free sample labels', 'Pricing'];

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [interest, setInterest] = useState(INTERESTS[0]);
  const [error, setError] = useState('');

  // "Get free sample labels" links to #samples: preselect it
  useEffect(() => {
    const sync = () => { if (location.hash === '#samples') setInterest(INTERESTS[1]); else if (location.hash === '#contact') setInterest(INTERESTS[0]); };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    setStatus('sending'); setError('');
    try {
      const res = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'We couldn’t send that. Please try again.');
      setStatus('sent'); form.reset();
    } catch (err) {
      setStatus('error'); setError(err instanceof Error ? err.message : 'We couldn’t send that. Please try again.');
    }
  }

  if (status === 'sent') {
    return (
      <div className="form-card form-sent" role="status">
        <span className="success-icon big"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
        <h3>Thank you. We’ll be in touch.</h3>
        <p>Someone from the Checko team will reply within one working day.</p>
        <button type="button" className="button secondary" onClick={() => setStatus('idle')}>Send another request</button>
      </div>
    );
  }

  return (
    <form className="form-card" onSubmit={submit} noValidate data-rv>
      <fieldset className="interest">
        <legend>I’d like to</legend>
        {INTERESTS.map(i => (
          <label key={i} className={interest === i ? 'on' : ''}>
            <input type="radio" name="interest" value={i} checked={interest === i} onChange={() => setInterest(i)} />{i}
          </label>
        ))}
      </fieldset>
      <div className="field-row">
        <label className="field"><span>Name</span><input name="name" autoComplete="name" required maxLength={120} /></label>
        <label className="field"><span>Work email</span><input name="email" type="email" autoComplete="email" required maxLength={160} /></label>
      </div>
      <div className="field-row">
        <label className="field"><span>Company</span><input name="company" autoComplete="organization" required maxLength={160} /></label>
        <label className="field"><span>Phone <em>(optional)</em></span><input name="phone" type="tel" autoComplete="tel" maxLength={30} /></label>
      </div>
      <label className="field"><span>What do you want to protect? <em>(optional)</em></span><textarea name="message" rows={3} maxLength={2000} /></label>
      {/* spam trap: people never see or fill this */}
      <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button className="button submit" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : interest === INTERESTS[1] ? 'Request sample labels' : interest === INTERESTS[2] ? 'Get pricing' : 'Book my demo'}</button>
      <p className="form-error" role="alert">{status === 'error' ? error : ''}</p>
    </form>
  );
}
