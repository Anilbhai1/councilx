/**
 * COUNCIL X | THE SYNDICATE
 * Standalone Local Backend Server for Serverless Handlers
 * 
 * Runs on port 3001 (or process.env.PORT) to serve:
 * - /api/chat (Edge-compatible Chat Engine)
 * - /api/oracle (Edge-compatible Financial Telemetry)
 * - /api/admin/:action (Consolidated Admin Switch Route)
 * - /api/payments/:action (Consolidated Razorpay Switch Route)
 * 
 * Uses built-in Node.js 'http' and 'fs' modules so zero extra dependencies are needed.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file if available
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const chatHandler = require('../api/chat');
const oracleHandler = require('../api/oracle');
const adminHandler = require('../api/admin/[action]');
const paymentsHandler = require('../api/payments/[action]');

const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse JSON Body
  let bodyChunks = [];
  req.on('data', chunk => bodyChunks.push(chunk));
  req.on('end', async () => {
    const rawBody = Buffer.concat(bodyChunks).toString();
    try {
      req.body = rawBody ? JSON.parse(rawBody) : {};
    } catch (e) {
      req.body = {};
    }

    // Helper functions for mock res object matching express/serverless
    res.status = function (code) {
      res.statusCode = code;
      return res;
    };
    res.json = function (data) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return res;
    };

    const url = (req.url || '').split('?')[0];

    // 1. AI Chat & Oracle Routes (Edge-Compatible)
    if (url === '/api/chat' || url === '/api/gemini' || url === '/api/chat/route') {
      try {
        await chatHandler(req, res);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    } else if (url === '/api/oracle' || url === '/api/oracle/route') {
      try {
        await oracleHandler(req, res);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    }
    // 2. Consolidated Admin Routes (/api/admin/:action)
    else if (url.startsWith('/api/admin')) {
      try {
        const action = url.replace('/api/admin/', '').replace('/api/admin', '').trim();
        req.query = req.query || {};
        if (action) req.query.action = action;
        await adminHandler(req, res);
      } catch (err) {
        res.status(404).json({ error: 'Not Found' });
      }
    }
    // 3. Consolidated Payments Routes (/api/payments/:action + legacy aliases)
    else if (url.startsWith('/api/payments')) {
      try {
        const action = url.replace('/api/payments/', '').replace('/api/payments', '').trim();
        req.query = req.query || {};
        if (action) req.query.action = action;
        await paymentsHandler(req, res);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    } else if (
      url === '/api/create-order' ||
      url === '/api/verify-payment' ||
      url === '/api/create-subscription' ||
      url === '/api/verify-subscription'
    ) {
      try {
        const action = url.replace('/api/', '').trim();
        req.query = req.query || {};
        req.query.action = action;
        await paymentsHandler(req, res);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    }
    // 4. System Health & PWA Manifest
    else if (url === '/health' || url === '/') {
      res.status(200).json({
        status: 'online',
        service: 'CouncilX Backend Consolidated Gateway',
        adminAuthConfigured: Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD),
        razorpayKeyIdConfigured: Boolean(process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID),
        razorpaySecretConfigured: Boolean(process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_key_secret_here')
      });
    } else if (url === '/manifest.json') {
      const manifestPath = path.resolve(__dirname, '..', 'public', 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        res.setHeader('Content-Type', 'application/manifest+json');
        res.writeHead(200);
        res.end(fs.readFileSync(manifestPath));
      } else {
        res.status(404).json({ error: 'manifest.json not found' });
      }
    } else if (url === '/sw.js') {
      const swPath = path.resolve(__dirname, '..', 'public', 'sw.js');
      if (fs.existsSync(swPath)) {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Service-Worker-Allowed', '/');
        res.writeHead(200);
        res.end(fs.readFileSync(swPath));
      } else {
        res.status(404).json({ error: 'sw.js not found' });
      }
    } else {
      res.status(404).json({ error: 'Endpoint not found' });
    }
  });
});

server.listen(PORT, () => {
  console.log(`[CouncilX] Backend consolidated gateway running at http://localhost:${PORT}`);
  console.log(`[CouncilX] Stealth Admin: ${process.env.ADMIN_EMAIL ? 'CONFIGURED' : 'PENDING'}`);
  console.log(`[CouncilX] Razorpay Key ID: ${process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_Tqty6gwfEY7eqC'}`);
  console.log(`[CouncilX] Secret Key Present: ${Boolean(process.env.RAZORPAY_KEY_SECRET)}`);
});
