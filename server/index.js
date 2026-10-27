/**
 * COUNCIL X | THE SYNDICATE
 * Standalone Local Backend Server for Razorpay Serverless Handlers
 * 
 * Runs on port 3001 (or process.env.PORT) to serve:
 * - POST /api/create-order
 * - POST /api/verify-payment
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

const createOrderHandler = require('../api/create-order');
const verifyPaymentHandler = require('../api/verify-payment');
const createSubscriptionHandler = require('../api/create-subscription');
const verifySubscriptionHandler = require('../api/verify-subscription');
const chatHandler = require('../api/chat');

const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
    res.status = function(code) {
      res.statusCode = code;
      return res;
    };
    res.json = function(data) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return res;
    };

    const url = (req.url || '').split('?')[0];

    if (url === '/api/chat' || url === '/api/gemini' || url === '/api/chat/route') {
      try {
        await chatHandler(req, res);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    } else if (url === '/api/create-order') {
      try {
        await createOrderHandler(req, res);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    } else if (url === '/api/verify-payment') {
      try {
        await verifyPaymentHandler(req, res);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    } else if (url === '/api/create-subscription') {
      try {
        await createSubscriptionHandler(req, res);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    } else if (url === '/api/verify-subscription') {
      try {
        await verifySubscriptionHandler(req, res);
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    } else if (url === '/health' || url === '/') {
      res.status(200).json({
        status: 'online',
        service: 'CouncilX Backend Serverless Gateway',
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
  console.log(`[CouncilX] Backend serverless gateway running at http://localhost:${PORT}`);
  console.log(`[CouncilX] Razorpay Key ID: ${process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_Tqty6gwfEY7eqC'}`);
  console.log(`[CouncilX] Secret Key Present: ${Boolean(process.env.RAZORPAY_KEY_SECRET)}`);
});
