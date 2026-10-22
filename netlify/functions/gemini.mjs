/**
 * COUNCIL X | Server-side Gemini proxy
 *
 * Keeps the Gemini API key out of the client bundle. The web app posts
 * { model, payload } here and this function forwards it to Gemini's
 * generateContent endpoint using the key from the server environment.
 */

const ALLOWED_MODELS = new Set([
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro'
]);

// Prefer a user-supplied GEMINI_API_KEY. When Netlify AI Gateway injects GEMINI_API_KEY
// it also sets GOOGLE_GEMINI_BASE_URL, so that injected key is not used for direct Google calls.
const getApiKey = () =>
  (!process.env.GOOGLE_GEMINI_BASE_URL && process.env.GEMINI_API_KEY) ||
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  '';

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

export default async (req) => {
  const apiKey = getApiKey();
  const isConfigured = Boolean(apiKey && !apiKey.includes('your_gemini_api_key'));

  // Health check used by the admin dashboard; reports only whether a key is set.
  if (req.method === 'GET') {
    return json(200, { configured: isConfigured });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  if (!isConfigured) {
    return json(503, { error: 'Gemini API key is not configured' });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const { model, payload } = body || {};
  if (!ALLOWED_MODELS.has(model) || !payload || typeof payload !== 'object') {
    return json(400, { error: 'Invalid model or payload' });
  }

  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(payload)
    }
  );

  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config = {
  path: '/api/gemini'
};
