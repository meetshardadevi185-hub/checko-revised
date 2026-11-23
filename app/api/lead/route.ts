import { NextResponse } from 'next/server';

/*
 * Receives demo / sample / pricing requests from the contact form and forwards them to
 * LEAD_WEBHOOK_URL (any JSON webhook: a CRM, Zapier/Make, Google Apps Script, Slack, etc.).
 * Without that variable the form answers honestly that requests can't be received yet.
 */
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ message: 'Invalid request.' }, { status: 400 }); }

  // spam trap filled in: pretend all is well
  if (clean(body.website, 200)) return NextResponse.json({ ok: true });

  const lead = {
    interest: clean(body.interest, 40) || 'Book a demo',
    name: clean(body.name, 120),
    email: clean(body.email, 160),
    company: clean(body.company, 160),
    phone: clean(body.phone, 30),
    message: clean(body.message, 2000),
    source: 'checko.ai homepage',
    receivedAt: new Date().toISOString(),
  };
  if (!lead.name || !lead.company || !EMAIL.test(lead.email)) {
    return NextResponse.json({ message: 'Please add your name, company and a valid work email.' }, { status: 422 });
  }

  const hook = process.env.LEAD_WEBHOOK_URL;
  if (!hook) {
    console.warn('[lead] LEAD_WEBHOOK_URL is not set; request not delivered', lead.email);
    return NextResponse.json({ message: 'Our form is being set up. Please email the Checko team directly for now.' }, { status: 503 });
  }
  try {
    const res = await fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead), signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`webhook ${res.status}`);
  } catch (err) {
    console.error('[lead] delivery failed', err);
    return NextResponse.json({ message: 'We couldn’t send that just now. Please try again in a minute.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
