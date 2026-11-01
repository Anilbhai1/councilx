const { streamText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-goog-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("CRITICAL ERROR: GEMINI_API_KEY is missing from environment variables.");
      return res.status(500).json({ error: "Server Configuration Error: API Key missing." });
    }

    const google = createGoogleGenerativeAI({ apiKey: apiKey });

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    const { data } = body;
    const messages = (Array.isArray(body.messages) && body.messages.length > 0)
      ? body.messages
      : [{ role: 'user', content: body.userMessage || body.userQuery || body.prompt || 'Provide Oracle market intelligence.' }];

    const result = await streamText({
      model: google('models/gemini-1.5-pro-latest'),
      messages,
      system: "You are Council X, an elite financial oracle featuring 216 historical masterminds. Provide brutal, deep, cinematic A-to-Z financial intelligence based strictly on real market data. Never use markdown tables.",
    });

    const streamResponse = result.toDataStreamResponse();
    res.setHeader('Content-Type', streamResponse.headers.get('content-type') || 'text/plain; charset=utf-8');

    const reader = streamResponse.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    return res.end();
  } catch (error) {
    console.error("FATAL AI ERROR:", error.message);
    return res.status(500).json({ error: error.message });
  }
};
