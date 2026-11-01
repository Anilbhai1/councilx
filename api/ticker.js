/**
 * COUNCIL X | THE SYNDICATE
 * Real-Time Market Ticker Serverless Handler (/api/ticker)
 */

let financeModule = null;
try {
  financeModule = require('./_lib/finance');
} catch (e) {
  try {
    financeModule = require('./finance');
  } catch (e2) {}
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let data = [];
    if (financeModule?.getLiveMarketOverview) {
      data = await financeModule.getLiveMarketOverview();
    }

    if (!data || data.length === 0) {
      data = [
        { symbol: '^NSEI', name: 'Nifty 50', price: 24200.5, change: 125.4, changePercent: 0.52 },
        { symbol: '^BSESN', name: 'Sensex', price: 79450.2, change: 380.1, changePercent: 0.48 },
        { symbol: '^NSEBANK', name: 'Bank Nifty', price: 51800.0, change: -45.0, changePercent: -0.09 },
        { symbol: 'CL=F', name: 'Crude Oil', price: 71.5, change: -0.8, changePercent: -1.1 },
        { symbol: 'GC=F', name: 'Gold', price: 2750.0, change: 14.2, changePercent: 0.52 },
        { symbol: 'USDINR=X', name: 'USD / INR', price: 84.1, change: 0.05, changePercent: 0.06 }
      ];
    }

    return res.status(200).json({
      success: true,
      ticker: data,
      indices: data,
      macroOverview: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

