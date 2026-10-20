// Receives feedback from the prototype and emails it to the owner through Resend.
// Needs two environment variables in Vercel: RESEND_API_KEY and FEEDBACK_TO.
// Optional: FEEDBACK_FROM (defaults to Resend's test sender, which can only email the Resend account owner).

const hits = new Map(); // best-effort per-instance rate limit: ip -> recent timestamps
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;

function clean(value, max) {
  return String(value == null ? '' : value).replace(/\r/g, '').trim().slice(0, max);
}

function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) hits.clear();
  return recent.length > MAX_HITS;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  if (body.website) return res.status(200).json({ ok: true }); // honeypot: pretend it worked

  const message = clean(body.message, 2000);
  if (!message) return res.status(400).json({ error: 'message' });

  const ip = clean((req.headers['x-forwarded-for'] || '').split(',')[0], 64) || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'rate' });

  const key = process.env.RESEND_API_KEY;
  const to = process.env.FEEDBACK_TO;
  if (!key || !to) {
    console.error('feedback is not configured: set RESEND_API_KEY and FEEDBACK_TO');
    return res.status(503).json({ error: 'not-configured' });
  }

  const email = clean(body.email, 200);
  const text = [
    'Message:',
    message,
    '',
    'Made sense at first glance: ' + (clean(body.clear, 20) || '(not answered)'),
    'Who: ' + (clean(body.role, 40) || '(not answered)'),
    'Email: ' + (email || '(none given)'),
    'Page: ' + clean(body.page, 40),
    'Screen: ' + clean(body.device, 20),
  ].join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.FEEDBACK_FROM || 'Plainly feedback <onboarding@resend.dev>',
        to: [to],
        subject: 'Plainly prototype feedback',
        text,
        reply_to: email || undefined,
      }),
    });
    if (!r.ok) {
      console.error('resend rejected the request with status', r.status);
      return res.status(502).json({ error: 'send' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('resend request failed');
    return res.status(502).json({ error: 'send' });
  }
};
