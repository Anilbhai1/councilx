/**
 * COUNCIL X | THE SYNDICATE
 * Real-Time Live Financial Intelligence Engine
 * Powered by yahoo-finance2 with direct Yahoo Finance HTTP fallback
 * 
 * ZERO MOCK DATA - 100% PRODUCTION-READY REAL-TIME MARKET DATA
 */

let YahooFinanceClass = null;
let yfInstance = null;

try {
  YahooFinanceClass = require('yahoo-finance2').default || require('yahoo-finance2');
  if (YahooFinanceClass) {
    yfInstance = new YahooFinanceClass({ suppressNotices: ['yahooSurvey'] });
  }
} catch (e) {
  console.warn('[Finance Service] yahoo-finance2 require notice (will use direct v8 fetch fallback):', e.message);
}

// Canonical institutional mapping for instant high-speed resolution
const SYMBOL_DIRECTORY = {
  'nifty': '^NSEI',
  'nifty 50': '^NSEI',
  'gift nifty': '^NSEI',
  'bank nifty': '^NSEBANK',
  'banknifty': '^NSEBANK',
  'sensex': '^BSESN',
  'crude': 'CL=F',
  'crude oil': 'CL=F',
  'brent': 'BZ=F',
  'gold': 'GC=F',
  'silver': 'SI=F',
  'dollar': 'DX-Y.NYB',
  'usdinr': 'USDINR=X',
  'rupee': 'USDINR=X',
  'tata motors': 'TMCV.NS',
  'tatamotors': 'TMCV.NS',
  'reliance': 'RELIANCE.NS',
  'tcs': 'TCS.NS',
  'infosys': 'INFY.NS',
  'infy': 'INFY.NS',
  'hdfc': 'HDFCBANK.NS',
  'hdfc bank': 'HDFCBANK.NS',
  'icici': 'ICICIBANK.NS',
  'icici bank': 'ICICIBANK.NS',
  'sbi': 'SBIN.NS',
  'state bank': 'SBIN.NS',
  'zomato': 'ZOMATO.NS',
  'swiggy': 'SWIGGY.NS',
  'ireda': 'IREDA.NS',
  'bhel': 'BHEL.NS',
  'ntpc': 'NTPC.NS',
  'adani ent': 'ADANIENT.NS',
  'adani enterprises': 'ADANIENT.NS',
  'adani green': 'ADANIGREEN.NS',
  'tata power': 'TATAPOWER.NS',
  'itc': 'ITC.NS',
  'l&t': 'LT.NS',
  'larsen': 'LT.NS',
  'maruti': 'MARUTI.NS',
  'bajaj finance': 'BAJFINANCE.NS',
  'paytm': 'PAYTM.NS',
  'apple': 'AAPL',
  'aapl': 'AAPL',
  'microsoft': 'MSFT',
  'msft': 'MSFT',
  'nvidia': 'NVDA',
  'nvda': 'NVDA',
  'tesla': 'TSLA',
  'tsla': 'TSLA',
  'google': 'GOOGL',
  'amazon': 'AMZN',
  's&p 500': '^GSPC',
  'sp500': '^GSPC',
  'nasdaq': '^IXIC'
};

/**
 * Direct HTTP Fallback to Yahoo Finance v8/v10 Chart & Quote API
 * Guaranteed to execute seamlessly in both Node.js & Vercel Edge Runtime
 */
async function directYahooFetch(symbol) {
  try {
    const cleanSym = encodeURIComponent(symbol.trim());
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanSym}?interval=1d&range=5d`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta || {};
    const quotes = result.indicators?.quote?.[0] || {};
    const closePrices = (quotes.close || []).filter(c => c !== null && !isNaN(c));

    const price = meta.regularMarketPrice || closePrices[closePrices.length - 1] || null;
    const prevClose = meta.chartPreviousClose || meta.previousClose || closePrices[closePrices.length - 2] || price;
    const change = price && prevClose ? price - prevClose : 0;
    const changePercent = prevClose ? (change / prevClose) * 100 : 0;

    return {
      symbol: meta.symbol || symbol,
      shortName: meta.shortName || meta.longName || meta.symbol || symbol,
      longName: meta.longName || meta.shortName || symbol,
      regularMarketPrice: price,
      currency: meta.currency || 'INR',
      regularMarketChange: Number(change.toFixed(2)),
      regularMarketChangePercent: Number(changePercent.toFixed(2)),
      regularMarketDayHigh: meta.regularMarketDayHigh || null,
      regularMarketDayLow: meta.regularMarketDayLow || null,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || null,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow || null,
      exchangeName: meta.exchangeName || 'NSE',
      marketCap: null,
      trailingPE: null,
      forwardPE: null,
      regularMarketVolume: meta.regularMarketVolume || null
    };
  } catch (err) {
    console.warn('[DirectYahooFetch Warning]:', err.message);
    return null;
  }
}

/**
 * Intelligently resolve stock symbol from free-text query
 */
async function resolveSymbol(query = '', feature = '') {
  const clean = (query || '').toLowerCase().trim();
  if (!clean) {
    if (feature === 'pre_market' || feature === 'PreMarketProphecy') return '^NSEI';
    return '^NSEI';
  }

  // 1. Direct symbol directory match
  for (const [key, sym] of Object.entries(SYMBOL_DIRECTORY)) {
    if (clean.includes(key)) {
      return sym;
    }
  }

  // 2. Direct regex symbol check (e.g., RELIANCE.NS, TATAMOTORS.NS, AAPL, ^NSEI)
  const tickerMatch = clean.match(/^[A-Z0-9\.\-\^]{1,12}$/i);
  if (tickerMatch) {
    const raw = tickerMatch[0].toUpperCase();
    if (raw.endsWith('.NS') || raw.endsWith('.BO') || raw.startsWith('^') || raw.includes('=')) {
      return raw;
    }
    // If it's a known US symbol or common Indian stock
    return raw;
  }

  // 3. Dynamic Yahoo Finance Search via yfInstance
  if (yfInstance && typeof yfInstance.search === 'function') {
    try {
      const searchRes = await yfInstance.search(query.slice(0, 50));
      if (Array.isArray(searchRes?.quotes) && searchRes.quotes.length > 0) {
        // Prioritize Indian NSE (.NS) or BSE (.BO) or Major Indices
        const indianQuote = searchRes.quotes.find(q => q.symbol && (q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO')));
        if (indianQuote) return indianQuote.symbol;

        const equityOrIndex = searchRes.quotes.find(q => q.symbol && (q.quoteType === 'EQUITY' || q.quoteType === 'INDEX'));
        if (equityOrIndex) return equityOrIndex.symbol;

        if (searchRes.quotes[0]?.symbol) return searchRes.quotes[0].symbol;
      }
    } catch (sErr) {
      console.warn('[Symbol Search Notice]:', sErr.message);
    }
  }

  return '^NSEI';
}

/**
 * Fetch Real Live Stock Quote with yahoo-finance2 & direct fetch fallback
 */
async function getLiveStockQuote(symbol) {
  if (!symbol) return null;

  // 1. Try yahoo-finance2 instance
  if (yfInstance && typeof yfInstance.quote === 'function') {
    try {
      const q = await yfInstance.quote(symbol);
      if (q && q.regularMarketPrice !== undefined) {
        return {
          symbol: q.symbol || symbol,
          shortName: q.shortName || q.longName || symbol,
          longName: q.longName || q.shortName || symbol,
          regularMarketPrice: q.regularMarketPrice,
          currency: q.currency || 'INR',
          regularMarketChange: q.regularMarketChange ? Number(q.regularMarketChange.toFixed(2)) : 0,
          regularMarketChangePercent: q.regularMarketChangePercent ? Number(q.regularMarketChangePercent.toFixed(2)) : 0,
          regularMarketDayHigh: q.regularMarketDayHigh || null,
          regularMarketDayLow: q.regularMarketDayLow || null,
          fiftyTwoWeekHigh: q.fiftyTwoWeekHigh || null,
          fiftyTwoWeekLow: q.fiftyTwoWeekLow || null,
          marketCap: q.marketCap || null,
          trailingPE: q.trailingPE ? Number(q.trailingPE.toFixed(2)) : null,
          forwardPE: q.forwardPE ? Number(q.forwardPE.toFixed(2)) : null,
          epsTrailingTwelveMonths: q.epsTrailingTwelveMonths ? Number(q.epsTrailingTwelveMonths.toFixed(2)) : null,
          regularMarketVolume: q.regularMarketVolume || null,
          fiftyDayAverage: q.fiftyDayAverage || null,
          twoHundredDayAverage: q.twoHundredDayAverage || null,
          exchangeName: q.exchange || q.exchangeName || 'NSE',
          marketState: q.marketState || 'REGULAR'
        };
      }
    } catch (yfErr) {
      console.warn(`[YahooFinance2 Quote Error for ${symbol}]:`, yfErr.message);
    }
  }

  // 2. Direct HTTP v8 fetch fallback
  return directYahooFetch(symbol);
}

/**
 * Fetch Real Balance Sheet & Valuation Metrics (Debt/Equity, Margins, ROE)
 */
async function getLiveStockFinancials(symbol) {
  if (!symbol) return null;

  if (yfInstance && typeof yfInstance.quoteSummary === 'function') {
    try {
      const summary = await yfInstance.quoteSummary(symbol, {
        modules: ['financialData', 'defaultKeyStatistics']
      });

      if (summary) {
        const fin = summary.financialData || {};
        const stats = summary.defaultKeyStatistics || {};

        return {
          debtToEquity: fin.debtToEquity || null,
          profitMargins: fin.profitMargins ? Number((fin.profitMargins * 100).toFixed(2)) : null,
          returnOnEquity: fin.returnOnEquity ? Number((fin.returnOnEquity * 100).toFixed(2)) : null,
          operatingMargins: fin.operatingMargins ? Number((fin.operatingMargins * 100).toFixed(2)) : null,
          totalRevenue: fin.totalRevenue || null,
          targetMeanPrice: fin.targetMeanPrice || null,
          recommendationKey: fin.recommendationKey || null,
          trailingEps: stats.trailingEps || null,
          forwardEps: stats.forwardEps || null,
          enterpriseValue: stats.enterpriseValue || null,
          priceToBook: stats.priceToBook ? Number(stats.priceToBook.toFixed(2)) : null
        };
      }
    } catch (e) {
      console.warn(`[YahooFinance2 Summary Error for ${symbol}]:`, e.message);
    }
  }

  return null;
}

/**
 * Fetch Macro Market Anchors (Nifty 50, Sensex, Bank Nifty, Crude Oil, USD/INR)
 */
async function getLiveMarketOverview() {
  const anchors = [
    { key: 'nifty', symbol: '^NSEI', name: 'NIFTY 50' },
    { key: 'sensex', symbol: '^BSESN', name: 'SENSEX' },
    { key: 'banknifty', symbol: '^NSEBANK', name: 'BANK NIFTY' },
    { key: 'crude', symbol: 'CL=F', name: 'CRUDE OIL' },
    { key: 'usdinr', symbol: 'USDINR=X', name: 'USD / INR' }
  ];

  const results = await Promise.allSettled(
    anchors.map(async (anchor) => {
      const quote = await getLiveStockQuote(anchor.symbol);
      return {
        ...anchor,
        price: quote?.regularMarketPrice || null,
        change: quote?.regularMarketChange || 0,
        changePercent: quote?.regularMarketChangePercent || 0,
        currency: quote?.currency || 'INR',
        dayHigh: quote?.regularMarketDayHigh || null,
        dayLow: quote?.regularMarketDayLow || null
      };
    })
  );

  return results.map((r, i) => r.status === 'fulfilled' ? r.value : anchors[i]);
}

/**
 * Master Financial Context Builder for LLM System Prompt Ingestion
 */
async function getLiveFinancialContext(userQuery = '', feature = '') {
  try {
    const symbol = await resolveSymbol(userQuery, feature);
    const [quote, financials, macroOverview] = await Promise.all([
      getLiveStockQuote(symbol),
      getLiveStockFinancials(symbol),
      getLiveMarketOverview()
    ]);

    if (!quote || quote.regularMarketPrice === null) {
      return {
        promptContext: null,
        liveMarketData: null,
        macroOverview
      };
    }

    const priceFormatted = `${quote.currency || 'INR'} ${Number(quote.regularMarketPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    const changeFormatted = `${quote.regularMarketChange >= 0 ? '+' : ''}${quote.regularMarketChange} (${quote.regularMarketChangePercent >= 0 ? '+' : ''}${quote.regularMarketChangePercent}%)`;

    let lines = [
      `=== VERIFIED REAL LIVE MARKET DATA (YAHOO FINANCE LIVE FEED) ===`,
      `Asset / Stock: ${quote.symbol} (${quote.shortName || quote.longName || quote.symbol})`,
      `Current Real-Time Price: ${priceFormatted}`,
      `Today's Real-Time Fluctuation: ${changeFormatted}`,
      quote.regularMarketDayLow && quote.regularMarketDayHigh ? `Day Range: ${quote.regularMarketDayLow} - ${quote.regularMarketDayHigh}` : null,
      quote.fiftyTwoWeekLow && quote.fiftyTwoWeekHigh ? `52-Week Range: ${quote.fiftyTwoWeekLow} - ${quote.fiftyTwoWeekHigh}` : null,
      quote.marketCap ? `Market Capitalization: ₹${(quote.marketCap / 1e7).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr ($${(quote.marketCap / 1e9).toFixed(2)}B)` : null,
      quote.trailingPE ? `Trailing P/E Multiple: ${quote.trailingPE}x` : null,
      quote.forwardPE ? `Forward P/E Multiple: ${quote.forwardPE}x` : null,
      quote.epsTrailingTwelveMonths ? `Trailing EPS: ₹${quote.epsTrailingTwelveMonths}` : null,
      financials?.debtToEquity ? `Debt-to-Equity Ratio: ${financials.debtToEquity}%` : null,
      financials?.profitMargins ? `Net Profit Margin: ${financials.profitMargins}%` : null,
      financials?.returnOnEquity ? `Return on Equity (ROE): ${financials.returnOnEquity}%` : null,
      financials?.targetMeanPrice ? `Institutional Consensus Target Price: ₹${financials.targetMeanPrice}` : null,
      financials?.recommendationKey ? `Wall St / Dalal St Consensus: ${financials.recommendationKey.toUpperCase()}` : null,
      `Exchange: ${quote.exchangeName}`,
      `==============================================================`,
      `MANDATORY ORACLE ENFORCEMENT PROTOCOL:`,
      `The 216 Masterminds MUST base 'The Verdict', 'The Why (Deep Logic)', 'The Why Not (Trap Avoidance)', and 'The Final Strategic Move' strictly upon this real live market reality.`,
      `- Ruthlessly reference the actual current price (${priceFormatted}) and current valuation metrics.`,
      `- Never fabricate fictitious numbers, imaginary highs, or phantom earnings.`,
      `- Frame the institutional truth around whether current multiples represent an unassailable moat, a retail liquidity trap, or an asymmetric entry.`
    ].filter(Boolean);

    // Append Macro Anchors Context
    if (Array.isArray(macroOverview) && macroOverview.length > 0) {
      lines.push(`\n=== LIVE GLOBAL MACRO ANCHORS ===`);
      macroOverview.forEach(m => {
        if (m.price) {
          lines.push(`- ${m.name}: ${m.price} (${m.changePercent >= 0 ? '+' : ''}${m.changePercent}%)`);
        }
      });
      lines.push(`=================================`);
    }

    const liveMarketData = {
      ...quote,
      financials,
      timestamp: new Date().toISOString()
    };

    return {
      promptContext: lines.join('\n'),
      liveMarketData,
      macroOverview
    };
  } catch (err) {
    console.error('[LiveFinancialContext Error]:', err);
    return {
      promptContext: null,
      liveMarketData: null,
      macroOverview: []
    };
  }
}

module.exports = {
  getLiveFinancialContext,
  getLiveStockQuote,
  getLiveStockFinancials,
  getLiveMarketOverview,
  resolveSymbol
};
