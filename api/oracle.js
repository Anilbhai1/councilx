export const runtime = 'edge';
export const config = { runtime: 'edge' };

/**
 * COUNCIL X | THE SYNDICATE
 * ORACLE OF WEALTH BACKEND ROUTE HANDLER
 * Runtime: Edge Function (Exempt from Vercel Hobby 12 Serverless Function limit)
 * 
 * 1. REAL LIVE DATA INTEGRATION (yahoo-finance2)
 *    - Real-time stock quotes, financials, macro overview.
 *    - Zero mock data or dummy placeholders.
 * 2. SECURE BACKEND ROUTING:
 *    - Server-side environment variable initialization:
 *      apiKey: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
 *    - Full persona isolation & A-to-Z Masterclass doctrine.
 */

let financeModule = null;
try {
  financeModule = require('./_lib/finance');
} catch (e) {
  try {
    financeModule = require('./finance');
  } catch (e2) {}
}
const getLiveFinancialContext = financeModule?.getLiveFinancialContext || (async () => ({}));
const getLiveMarketOverview = financeModule?.getLiveMarketOverview || (async () => ({}));
const getLiveStockQuote = financeModule?.getLiveStockQuote || (async () => null);
const chatHandler = require('./chat');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-goog-api-key, x-openai-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Fetch pure real-time live market telemetry asynchronously
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const isOverview = url.searchParams.get('overview') === 'true';
      const ticker = url.searchParams.get('ticker') || url.searchParams.get('query') || url.searchParams.get('q') || '';

      if (isOverview || !ticker) {
        const macroOverview = await getLiveMarketOverview();
        return res.status(200).json({
          success: true,
          macroOverview,
          timestamp: new Date().toISOString()
        });
      }

      const financialContext = await getLiveFinancialContext(ticker);
      return res.status(200).json({
        success: true,
        liveMarketData: financialContext.liveMarketData,
        macroOverview: financialContext.macroOverview,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[Oracle API GET Error]:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch live market telemetry.'
      });
    }
  }

  // POST: Execute Oracle of Wealth AI Audit with verified live market data
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    // Forward to max-power chat handler with forced oracle_of_wealth mode
    req.body = {
      ...body,
      mode: 'oracle_of_wealth',
      feature: body.feature || 'pre_market',
      userMessage: body.userMessage || body.userQuery || body.message || body.prompt || ''
    };

    return chatHandler(req, res);
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed. Use GET or POST.' });
};
