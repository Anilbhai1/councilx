/**
 * COUNCIL X | THE SYNDICATE
 * Modern Route Handler for /api/chat/route.js & /api/chat
 * Delegates to the unified Profound Storytelling & Structured JSON Engine
 */

const chatHandler = require('../chat');

// Next.js / Edge Route Handler export
async function handleRequest(request) {
  try {
    let body = {};
    if (typeof request.json === 'function') {
      body = await request.json();
    } else if (typeof request.body === 'object') {
      body = request.body;
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

    await chatHandler({ method: 'POST', body }, mockRes);

    return new Response(JSON.stringify(responseData), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

module.exports = chatHandler;
module.exports.POST = handleRequest;
module.exports.GET = handleRequest;
