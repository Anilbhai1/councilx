export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * COUNCIL X | THE SYNDICATE
 * Rebuilt Oracle Engine (app/api/oracle/route.ts)
 * Runtime: Standard Node.js (Required for yahoo-finance2 module)
 * 
 * Strict Architectural Compliance:
 * 1. Explicit Gemini API key initialization via @ai-sdk/google:
 *    import { createGoogleGenerativeAI } from '@ai-sdk/google';
 *    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
 * 2. Real-time live market telemetry fetching (Yahoo Finance / NSE / BSE).
 * 3. Enforces the 4-part A-to-Z Masterclass framework:
 *    - The Verdict (Institutional truth)
 *    - The 'Why' (Deep logic & balance sheet forensic metrics)
 *    - The 'Why Not' (Trap avoidance & retail hazard protection)
 *    - The Final Strategic Move (Numbered entry, stop-loss, targets)
 * 4. Try/Catch wrapped AI generation with console.error and clean 500 JSON error handling.
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

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
 */
export async function GET(request: Request) {
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
  } catch (err: any) {
    console.error('[Oracle Route GET Error]:', err);
    return new Response(JSON.stringify({
      success: false,
      error: err?.message || 'Failed to fetch Oracle market telemetry.'
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}

/**
 * POST /api/oracle
 * Stock Analysis & Oracle AI Consultation
 */
export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    const { searchParams } = new URL(request.url);
    const action = (body.action || searchParams.get('action') || 'audit').toLowerCase().trim();

    // 1. Action: Macro Overview
    if (action === 'overview') {
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

    // 2. Action: Stock Quote
    if (action === 'quote' && (body.ticker || body.query)) {
      const finance = getFinanceModule();
      const quote = await (finance?.getLiveStockQuote || (async () => null))(body.ticker || body.query);
      return new Response(JSON.stringify({
        success: true,
        action: 'quote',
        quote
      }), {
        status: 200,
        headers: CORS_HEADERS
      });
    }

    // 3. Action: Full AI Stock Analysis / Consultation (Oracle of Wealth)
    const rawQuery = (
      body.userMessage ||
      body.userQuery ||
      body.message ||
      body.prompt ||
      body.ticker ||
      body.query ||
      ''
    ).trim();

    const feature = body.feature || 'pre_market';
    const language = body.language || 'gu';
    const agent = body.agent || {};

    // Explicitly pass process.env.GEMINI_API_KEY to AI SDK
    const geminiApiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
      request.headers.get('x-goog-api-key') ||
      ''
    ).trim();

    if (!geminiApiKey) {
      console.error('[Oracle Route Error]: process.env.GEMINI_API_KEY is not defined in environment variables.');
      return new Response(JSON.stringify({
        success: false,
        error: 'Gemini API key is not initialized in backend environment (GEMINI_API_KEY).'
      }), {
        status: 500,
        headers: CORS_HEADERS
      });
    }

    // Initialize Google Generative AI explicitly
    const google = createGoogleGenerativeAI({
      apiKey: geminiApiKey,
    });

    // Fetch live market telemetry for the queried stock
    let liveMarketData: any = null;
    const tickerCandidate = rawQuery.replace(/^(analyze|check|what about|audit|scan)\s+/i, '').trim();

    try {
      const finance = getFinanceModule();
      if (finance && typeof finance.getLiveFinancialContext === 'function' && tickerCandidate) {
        const financialContext = await finance.getLiveFinancialContext(tickerCandidate);
        liveMarketData = financialContext?.liveMarketData || null;
      }
    } catch (finErr: any) {
      console.warn('[Oracle Route]: Live telemetry fetch notice:', finErr?.message);
    }

    let liveMetricsSummary = 'No real-time market quote available for this query.';
    if (liveMarketData) {
      liveMetricsSummary = `
LIVE MARKET TELEMETRY (REAL-TIME EXCHANGE DATA):
- Symbol: ${liveMarketData.symbol || tickerCandidate}
- Current Market Price (CMP): ₹${liveMarketData.regularMarketPrice ?? liveMarketData.price ?? 'N/A'} ${liveMarketData.currency || 'INR'}
- Day Change: ${liveMarketData.regularMarketChangePercent ? liveMarketData.regularMarketChangePercent.toFixed(2) + '%' : '0.00%'}
- Day Range (Low - High): ₹${liveMarketData.regularMarketDayLow ?? 'N/A'} - ₹${liveMarketData.regularMarketDayHigh ?? 'N/A'}
- 52-Week Range: ₹${liveMarketData.fiftyTwoWeekLow ?? 'N/A'} - ₹${liveMarketData.fiftyTwoWeekHigh ?? 'N/A'}
- Market Capitalization: ₹${liveMarketData.marketCap ? (liveMarketData.marketCap / 1e7).toFixed(2) + ' Cr' : 'N/A'}
- Trailing P/E: ${liveMarketData.trailingPE ?? 'N/A'} | Forward P/E: ${liveMarketData.forwardPE ?? 'N/A'}
- TTM EPS: ₹${liveMarketData.epsTrailingTwelveMonths ?? 'N/A'}
- Debt to Equity: ${liveMarketData.financials?.debtToEquity ?? 'N/A'}
- Return on Equity (ROE): ${liveMarketData.financials?.returnOnEquity ? (liveMarketData.financials.returnOnEquity * 100).toFixed(2) + '%' : 'N/A'}
- Profit Margin: ${liveMarketData.financials?.profitMargins ? (liveMarketData.financials.profitMargins * 100).toFixed(2) + '%' : 'N/A'}
- Exchange: ${liveMarketData.exchangeName || 'NSE/BSE'}
`;
    }

    const featureNames: Record<string, string> = {
      pre_market: 'Pre-Market Prophecy (સવારની રણનીતિ)',
      xray: 'Syndicate X-Ray (બેલેન્સ શીટ ફોરેન્સિક ઓડિટ)',
      fo_deathmatch: 'F&O Deathmatch (ઓપ્શન્સ ઓપન ઇન્ટરેસ્ટ અને મેક્સ પેઇન)',
      doomsday: 'Doomsday Simulator (બ્લેક સ્વાન ક્રેશ સિમ્યુલેશન)',
      karmic_scanner: 'Karmic Future Scanner (10-વર્ષીય મેક્રો વિશ્લેષણ)',
      ceo_interrogator: 'CEO Interrogator (પ્રમોટર પ્રામાણિકતા તપાસ)',
      redemption: 'Redemption Engine (ખોટમાંથી પુનર્પ્રાપ્તિ પ્લાન)',
      shadow_dossier: 'Shadow Dossier (ક્લાસિફાઇડ બ્લોક ડીલ્સ)'
    };

    const activeFeatureTitle = featureNames[feature] || 'Oracle of Wealth Master Intelligence';

    const systemInstruction = `You are the Oracle of Wealth (શેરબજાર મહા-ઓરેકલ), powered by Council X and the 216 Financial Masterminds (including Warren Buffett, Rakesh Jhunjhunwala, Chanakya, Charlie Munger, Ray Dalio, Benjamin Graham).
You embody institutional-grade rigor, ruthless realism, and zero retail nonsense.
Active Feature Engine: ${activeFeatureTitle}
Chamber Leads: ${agent.name || 'Council Masterminds'}

STRICT ARCHITECTURAL DIRECTIVE - You MUST format your strategic financial intelligence report into the exact 4-part Masterclass structure:

1. THE VERDICT:
   Bold, brutal, institutional truth. A clear, definitive stance (Bullish / Bearish / Trap Avoidance with target zones and timeline). No corporate hedging or wishy-washy disclaimers.

2. THE "WHY" (DEEP LOGIC):
   Step-by-step causal breakdown. Explain the market microstructure, institutional order flow, balance sheet metrics, valuation multiples, and structural tailwinds/headwinds.

3. THE "WHY NOT" (TRAP AVOIDANCE):
   Protect capital against retail traps. Detail promoter pledges, governance red flags, options max pain traps, IPO lock-in expirations, debt leverage, or institutional distribution.

4. THE FINAL STRATEGIC MOVE:
   A concrete, numbered execution directive. Exact entry levels/zones, hard stop-loss trigger, primary profit milestone, and risk-reward ratio.

LANGUAGE RULE:
Respond in ${language === 'gu' ? 'Gujarati (ગુજરાતી) with key financial terms in English for crystal clarity' : (language === 'hi' ? 'Hindi (हिंदी)' : 'English')}. Maintain an elite, sovereign billionaire boardroom tone.`;

    const userPrompt = `USER INQUIRY / STOCK AUDIT:
"${rawQuery}"

${liveMetricsSummary}

Execute the A-to-Z Masterclass Financial Audit now following the 4 mandatory sections.`;

    // Wrap AI SDK generation in Try/Catch block with console.error and 500 JSON response
    try {
      let aiReportText = '';
      const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'];
      let lastModelError: any = null;

      for (const modelId of modelsToTry) {
        try {
          const { text } = await generateText({
            model: google(modelId),
            system: systemInstruction,
            prompt: userPrompt,
            maxTokens: 3500
          });
          if (text && text.trim()) {
            aiReportText = text.trim();
            break;
          }
        } catch (mErr: any) {
          lastModelError = mErr;
          console.warn(`[Oracle AI] Model ${modelId} attempt notice:`, mErr?.message);
        }
      }

      if (!aiReportText) {
        console.error('[Oracle Gemini API Error]: All Gemini models failed to generate content:', lastModelError);
        return new Response(JSON.stringify({
          success: false,
          error: `Gemini API Error: ${lastModelError?.message || 'Failed to generate financial analysis from Gemini API'}`
        }), {
          status: 500,
          headers: CORS_HEADERS
        });
      }

      const cleanTicker = (liveMarketData?.symbol || tickerCandidate || 'this asset').replace(/\.(NS|BO)$/i, '');
      const followUps = [
        `What is the institutional stop-loss and capital invalidation level for ${cleanTicker}?`,
        `How does the current debt-to-equity ratio impact long-term compounding for ${cleanTicker}?`,
        `Simulate a -15% market crash scenario on this position.`
      ];

      return new Response(JSON.stringify({
        success: true,
        reply: aiReportText,
        content: aiReportText,
        follow_ups: followUps,
        followUpQuestions: followUps,
        liveMarketData: liveMarketData || null,
        model: 'gemini',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: CORS_HEADERS
      });
    } catch (aiExecutionError: any) {
      console.error('[Oracle Gemini API Error]: Execution error during generateText:', aiExecutionError);
      return new Response(JSON.stringify({
        success: false,
        error: `Gemini API Error: ${aiExecutionError?.message || 'Execution error in Gemini AI'}`
      }), {
        status: 500,
        headers: CORS_HEADERS
      });
    }
  } catch (err: any) {
    console.error('[Oracle Route POST Exception]:', err);
    return new Response(JSON.stringify({
      success: false,
      error: `Gemini API Error: ${err?.message || 'Internal server error in Oracle Route'}`
    }), {
      status: 500,
      headers: CORS_HEADERS
    });
  }
}
