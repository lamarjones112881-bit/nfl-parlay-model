// ═══════════════════════════════════════════════════════════════════════════
// Vercel Serverless Proxy  —  /api/claude
// ─────────────────────────────────────────────────────────────────────────
// The ANTHROPIC_API_KEY never leaves the server. The browser calls
// /api/claude (same origin, nothing visible in DevTools), this function
// injects the key server-side and forwards to Anthropic.
//
// Required Vercel env var:
//   ANTHROPIC_API_KEY   — your Anthropic secret key
//
// Optional Vercel env vars:
//   APP_TOKEN           — shared secret the PWA sends in x-app-token header
//   ALLOWED_ORIGIN      — restrict to your domain e.g. https://myapp.vercel.app
// ═══════════════════════════════════════════════════════════════════════════

export default async function handler(req, res) {

  // ── CORS ──────────────────────────────────────────────────────────────────
  const origin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-app-token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── Only POST ─────────────────────────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Optional shared-secret token ──────────────────────────────────────────
  // Set APP_TOKEN in Vercel env vars to require it. Leave unset to skip.
  const serverToken = process.env.APP_TOKEN;
  if (serverToken && req.headers['x-app-token'] !== serverToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ── Anthropic API key (server-side only — never sent to browser) ──────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY not set. Go to Vercel → your project → Settings → Environment Variables and add it.'
    });
  }

  // ── Proxy the request to Anthropic ───────────────────────────────────────
  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);

  } catch (err) {
    console.error('[/api/claude] upstream error:', err.message);
    return res.status(500).json({ error: 'Proxy error — ' + err.message });
  }
}
