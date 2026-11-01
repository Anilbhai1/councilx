export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * COUNCIL X | THE SYNDICATE
 * Vercel Route Handler: /api/oracle/route.js
 * Runtime: Edge Function (Exempt from Vercel Hobby 12 Serverless Function limit)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-goog-api-key, x-openai-api-key',
  'Content-Type': 'application/json'
};

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS
  });
}

export async function GET(request) {
  try {
    let financeModule = null;
    try {
      financeModule = require('../_lib/finance');
    } catch (e) {
      try {
        financeModule = require('../finance');
      } catch (e2) {}
    }
    const getLiveFinancialContext = financeModule?.getLiveFinancialContext || (async () => ({}));
    const getLiveMarketOverview = financeModule?.getLiveMarketOverview || (async () => ({}));

    const { searchParams } = new URL(request.url);
    const isOverview = searchParams.get('overview') === 'true';
    const ticker = searchParams.get('ticker') || searchParams.get('query') || searchParams.get('q') || '';

    if (isOverview || !ticker) {
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
  } catch (err) {
    console.error('[Oracle Route GET Error]:', err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message || 'Failed to fetch market data.'
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}

export async function POST(request) {
  try {
    const chatRoute = require('../chat/route');
    if (chatRoute && typeof chatRoute.POST === 'function') {
      return chatRoute.POST(request);
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Chat route handler unavailable'
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
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
