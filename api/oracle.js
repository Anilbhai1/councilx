/**
 * COUNCIL X | THE SYNDICATE
 * Consolidated Oracle of Wealth Backend Handler (/api/oracle)
 * Runtime: Standard Node.js
 * 
 * Strict Architectural Compliance:
 * 1. Explicit Gemini API key initialization via @ai-sdk/google:
 *    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
 * 2. Try/Catch wrapped AI generation with console.error and clean 500 JSON error handling.
 * 3. Enforces the 4-part A-to-Z Masterclass framework:
 *    - The Verdict (Institutional truth)
 *    - The 'Why' (Deep logic & balance sheet forensic metrics)
 *    - The 'Why Not' (Trap avoidance & retail hazard protection)
 *    - The Final Strategic Move (Numbered entry, stop-loss, targets)
 * 4. Real-time live market telemetry fetching (Yahoo Finance / NSE / BSE)
 */

const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { generateText } = require('ai');

let financeModule = null;
try {
  financeModule = require('./_lib/finance');
} catch (e) {
  try {
    financeModule = require('./finance');
  } catch (e2) { }
}
const getLiveFinancialContext = financeModule?.getLiveFinancialContext || (async () => ({}));
const getLiveMarketOverview = financeModule?.getLiveMarketOverview || (async () => ({}));
const getLiveStockQuote = financeModule?.getLiveStockQuote || (async () => null);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-goog-api-key, x-openai-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Fetch real-time live market telemetry
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
    try {
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

      if (action === 'quote' && (body.ticker || body.query)) {
        const quote = await getLiveStockQuote(body.ticker || body.query);
        return res.status(200).json({
          success: true,
          action: 'quote',
          quote
        });
      }

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

      // Explicit Gemini API Key Mapping (Strict Requirement)
      const geminiApiKey = (
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
        req.headers['x-goog-api-key'] ||
        ''
      ).trim();

      if (!geminiApiKey) {
        console.error('[Oracle API Error]: GEMINI_API_KEY is not defined in environment variables.');
        return res.status(500).json({
          success: false,
          error: 'Gemini API key is not initialized in backend environment (GEMINI_API_KEY).'
        });
      }

      // Explicitly initialize Google Generative AI with the mapped key
      const google = createGoogleGenerativeAI({
        apiKey: geminiApiKey,
      });

      // Fetch live market data for stock query if relevant
      let liveMarketData = null;
      let tickerCandidate = rawQuery.replace(/^(analyze|check|what about|audit|scan)\s+/i, '').trim();

      try {
        if (tickerCandidate) {
          const financialContext = await getLiveFinancialContext(tickerCandidate);
          liveMarketData = financialContext?.liveMarketData || null;
        }
      } catch (finErr) {
        console.warn('[Oracle API]: Live telemetry fetch notice:', finErr.message);
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

      const featureNames = {
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
        let lastModelError = null;

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
          } catch (mErr) {
            lastModelError = mErr;
            console.warn(`[Oracle AI] Model ${modelId} attempt notice:`, mErr.message);
          }
        }

        if (!aiReportText) {
          console.error('[Oracle Gemini API Error]: All Gemini models failed to generate content:', lastModelError);
          return res.status(500).json({
            success: false,
            error: `Gemini API Error: ${lastModelError?.message || 'Failed to generate financial analysis from Gemini API'}`
          });
        }

        const cleanTicker = (liveMarketData?.symbol || tickerCandidate || 'this asset').replace(/\.(NS|BO)$/i, '');
        const followUps = [
          `What is the institutional stop-loss and capital invalidation level for ${cleanTicker}?`,
          `How does the current debt-to-equity ratio impact long-term compounding for ${cleanTicker}?`,
          `Simulate a -15% market crash scenario on this position.`
        ];

        return res.status(200).json({
          success: true,
          reply: aiReportText,
          content: aiReportText,
          follow_ups: followUps,
          followUpQuestions: followUps,
          liveMarketData: liveMarketData || null,
          model: 'gemini',
          timestamp: new Date().toISOString()
        });
      } catch (aiExecutionError) {
        console.error('[Oracle Gemini API Error]: Execution error during generateText:', aiExecutionError);
        return res.status(500).json({
          success: false,
          error: `Gemini API Error: ${aiExecutionError.message || 'Execution error in Gemini AI'}`
        });
      }
    } catch (err) {
      console.error('[Oracle API POST Exception]:', err);
      return res.status(500).json({
        success: false,
        error: `Gemini API Error: ${err.message || 'Internal server error in Oracle route'}`
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed. Use GET or POST.' });
};
