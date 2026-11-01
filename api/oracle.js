/**
 * COUNCIL X | THE SYNDICATE
 * Consolidated Oracle of Wealth Backend Handler (/api/oracle)
 * Runtime: Standard Node.js (Consolidates all Oracle feature actions via switch statement)
 * 
 * Supported Actions:
 * - 'overview': Live macro market overview (Nifty 50, Sensex, Bank Nifty, Crude, Gold, USD/INR)
 * - 'quote' / 'ticker': Real-time stock telemetry, OHLC, volume, and valuation
 * - 'financials' / 'xray': Forensic balance sheet scan and institutional telemetry
 * - 'audit' / 'chat': Oracle of Wealth 8 Master Features AI Consultation
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

  // GET: Fetch pure real-time live market telemetry asynchronously via action switch
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url, `http://${req?.headers?.host || 'localhost'}`);
      const action = (url.searchParams.get('action') || (url.searchParams.get('overview') === 'true' ? 'overview' : 'quote')).toLowerCase().trim();
      const ticker = url.searchParams.get('ticker') || url.searchParams.get('query') || url.searchParams.get('q') || '';

      switch (action) {
        case 'overview': {
          const macroOverview = await getLiveMarketOverview();
          return res.status(200).json({
            success: true,
            action: 'overview',
            macroOverview,
            timestamp: new Date().toISOString()
          });
        }

        case 'quote': {
          if (!ticker) {
            const macroOverview = await getLiveMarketOverview();
            return res.status(200).json({
              success: true,
              action: 'overview',
              macroOverview,
              timestamp: new Date().toISOString()
            });
          }
          const quote = await getLiveStockQuote(ticker);
          return res.status(200).json({
            success: true,
            action: 'quote',
            ticker,
            quote,
            timestamp: new Date().toISOString()
          });
        }

        case 'financials':
        case 'xray': {
          const financialContext = await getLiveFinancialContext(ticker || '^NSEI');
          return res.status(200).json({
            success: true,
            action: 'financials',
            liveMarketData: financialContext.liveMarketData,
            macroOverview: financialContext.macroOverview,
            timestamp: new Date().toISOString()
          });
        }

        default: {
          if (ticker) {
            const financialContext = await getLiveFinancialContext(ticker);
            return res.status(200).json({
              success: true,
              liveMarketData: financialContext.liveMarketData,
              macroOverview: financialContext.macroOverview,
              timestamp: new Date().toISOString()
            });
          }
          const macroOverview = await getLiveMarketOverview();
          return res.status(200).json({
            success: true,
            macroOverview,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error('[Oracle API GET Error]:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch live market telemetry.'
      });
    }
  }

  // POST: Execute Oracle AI consultation or specific action
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    const action = String(body.action || '').toLowerCase().trim();

    if (action === 'overview') {
      const macroOverview = await getLiveMarketOverview();
      return res.status(200).json({
        success: true,
        action: 'overview',
        macroOverview
      });
    }

    // Forward to chat handler with forced oracle_of_wealth mode
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
