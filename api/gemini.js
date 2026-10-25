/**
 * COUNCIL X | THE SYNDICATE
 * Serverless Backend Function: Gemini AI Proxy for Vercel
 * 
 * Securely proxies client requests to Google Generative Language API
 * without exposing server API keys to the browser bundle.
 */

const ALLOWED_MODELS = new Set([
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro'
]);

const getApiKey = () =>
  process.env.GEMINI_API_KEY ||
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  'AQ.Ab8RN6ID_NEMtyyQN7UDsMdNa0WyAJLRFUlnuCvt8GBPukHqyg';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-goog-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = getApiKey();
  const isConfigured = Boolean(apiKey && !apiKey.includes('your_gemini_api_key'));

  // Health check endpoint
  if (req.method === 'GET') {
    return res.status(200).json({ configured: isConfigured });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  if (!isConfigured) {
    return res.status(503).json({ error: 'Gemini API key is not configured in server environment.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    body = body || {};

    const { model = 'gemini-2.0-flash', payload } = body;

    const targetModel = ALLOWED_MODELS.has(model) ? model : 'gemini-2.0-flash';
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Invalid or missing payload in request body.' });
    }

    const fetchFn = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
    const upstreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

    const upstreamRes = await fetchFn(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    const responseText = await upstreamRes.text();

    try {
      const responseData = JSON.parse(responseText);
      return res.status(upstreamRes.status).json(responseData);
    } catch (parseErr) {
      return res.status(upstreamRes.status).send(responseText);
    }
  } catch (err) {
    console.error('[CouncilX Gemini Proxy Exception]', err);
    return res.status(500).json({
      error: err.message || 'Internal server error while proxying Gemini request.'
    });
  }
};
