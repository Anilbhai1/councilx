export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * COUNCIL X | THE SYNDICATE
 * Consolidated Oracle of Wealth Route Handler (app/api/oracle/route.js)
 * Runtime: Standard Node.js (Consolidates all Oracle feature actions via switch statement)
 * 
 * Supported Actions:
 * - 'overview': Live macro market overview (Nifty 50, Sensex, Bank Nifty, Crude, Gold, USD/INR)
 * - 'quote' / 'ticker': Real-time stock telemetry, OHLC, volume, and valuation
 * - 'financials' / 'xray': Forensic balance sheet scan and institutional telemetry
 * - 'audit' / 'chat': Oracle of Wealth 8 Master Features AI Consultation
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-goog-api-key, x-openai-api-key',
  'Content-Type': 'application/json'
};

function getFinanceModule() {
  try {
    return require('../../../api/_lib/finance');
  } catch (e) {
    try {
      return require('../../../api/finance');
    } catch (e2) {
      return null;
    }
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS
  });
}

/**
 * GET /api/oracle?action=[overview|quote|financials]&ticker=...
 * Consolidated Oracle GET Switch Router
 */
export async function GET(request) {
  try {
    const finance = getFinanceModule();
    const getLiveFinancialContext = finance?.getLiveFinancialContext || (async () => ({}));
    const getLiveMarketOverview = finance?.getLiveMarketOverview || (async () => ({}));
    const getLiveStockQuote = finance?.getLiveStockQuote || (async () => null);

    const { searchParams } = new URL(request.url);
    const action = (searchParams.get('action') || (searchParams.get('overview') === 'true' ? 'overview' : 'quote')).toLowerCase().trim();
    const ticker = searchParams.get('ticker') || searchParams.get('query') || searchParams.get('q') || '';

    switch (action) {
      // 1. Macro Market Overview
      case 'overview': {
        const macroOverview = await getLiveMarketOverview();
        return new Response(JSON.stringify({
          success: true,
          action: 'overview',
          macroOverview,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: CORS_HEADERS
        });
      }

      // 2. Real-Time Single Ticker Quote
      case 'quote': {
        if (!ticker) {
          const macroOverview = await getLiveMarketOverview();
          return new Response(JSON.stringify({
            success: true,
            action: 'overview',
            macroOverview,
            timestamp: new Date().toISOString()
          }), {
            status: 200,
            headers: CORS_HEADERS
          });
        }

        const quote = await getLiveStockQuote(ticker);
        return new Response(JSON.stringify({
          success: true,
          action: 'quote',
          ticker,
          quote,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: CORS_HEADERS
        });
      }

      // 3. Full Forensic Financials & Telemetry
      case 'financials':
      case 'xray': {
        const financialContext = await getLiveFinancialContext(ticker || '^NSEI');
        return new Response(JSON.stringify({
          success: true,
          action: 'financials',
          liveMarketData: financialContext.liveMarketData,
          macroOverview: financialContext.macroOverview,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: CORS_HEADERS
        });
      }

      // Default fallback
      default: {
        if (ticker) {
          const financialContext = await getLiveFinancialContext(ticker);
          return new Response(JSON.stringify({
            success: true,
            liveMarketData: financialContext.liveMarketData,
            macroOverview: financialContext.macroOverview,
            timestamp: new Date().toISOString()
          }), {
            status: 200,
            headers: CORS_HEADERS
          });
        }
        const macroOverview = await getLiveMarketOverview();
        return new Response(JSON.stringify({
          success: true,
          macroOverview,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: CORS_HEADERS
        });
      }
    }
  } catch (err) {
    console.error('[Oracle Route GET Error]:', err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message || 'Failed to fetch Oracle market telemetry.'
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}

/**
 * POST /api/oracle
 * Consolidated Oracle POST Switch Router (Audit & AI Strategy Deliberation)
 */
export async function POST(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    const { searchParams } = new URL(request.url);
    const action = (body.action || searchParams.get('action') || 'audit').toLowerCase().trim();

    switch (action) {
      case 'overview': {
        const finance = getFinanceModule();
        const macroOverview = await (finance?.getLiveMarketOverview || (async () => ({})))();
        return new Response(JSON.stringify({
          success: true,
          action: 'overview',
          macroOverview
        }), {
          status: 200,
          headers: CORS_HEADERS
        });
      }

      case 'audit':
      case 'chat':
      default: {
        const chatRoute = require('../chat/route');
        if (chatRoute && typeof chatRoute.POST === 'function') {
          // Re-create request with forced oracle_of_wealth mode
          const augmentedRequest = new Request(request.url, {
            method: 'POST',
            headers: request.headers,
            body: JSON.stringify({
              ...body,
              mode: 'oracle_of_wealth',
              feature: body.feature || 'pre_market',
              userMessage: body.userMessage || body.userQuery || body.message || body.prompt || ''
            })
          });
          return chatRoute.POST(augmentedRequest);
        }

        return new Response(JSON.stringify({
          success: false,
          error: 'Chat engine handler unavailable'
        }), {
          status: 500,
          headers: CORS_HEADERS
        });
      }
    }
  } catch (err) {
    console.error('[Oracle Route POST Exception]:', err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message || 'Internal server error in Oracle Route'
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}
