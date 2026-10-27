/**
 * COUNCIL X | THE SYNDICATE
 * Modern Route Handler for /api/chat/route.js & /api/chat
 * Delegates to Max-Power Agentic AI RAG & Sovereign Blueprint Engine
 */

const chatHandler = require('../chat');

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-goog-api-key'
      }
    });
  }

  try {
    let body = {};
    if (request.method === 'POST') {
      if (typeof request.json === 'function') {
        try {
          body = await request.json();
        } catch (e) {
          body = {};
        }
      } else if (typeof request.body === 'object') {
        body = request.body;
      }
    }

    let responseData = null;
    let statusCode = 200;

    const mockRes = {
      setHeader: () => {},
      status: (code) => {
        statusCode = code;
        return mockRes;
      },
      json: (data) => {
        responseData = data;
        return mockRes;
      },
      end: () => {}
    };

    await chatHandler({ method: request.method, body }, mockRes);

    return new Response(JSON.stringify(responseData), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-goog-api-key'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'Internal error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

module.exports = chatHandler;
module.exports.POST = handleRequest;
module.exports.GET = handleRequest;
module.exports.OPTIONS = handleRequest;
