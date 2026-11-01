/**
 * COUNCIL X | THE SYNDICATE
 * Next.js App Router Consolidated Admin Route (app/api/admin/[action]/route.js)
 * Runtime: Node.js (Single route handler for all admin operations)
 */

const adminHandler = require('../../../../api/admin/[action]');

function createMockRes() {
  let statusCode = 200;
  let headers = {};
  let bodyData = null;

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    setHeader(k, v) {
      headers[k] = v;
      return res;
    },
    json(data) {
      bodyData = JSON.stringify(data);
      headers['Content-Type'] = 'application/json';
      return res;
    },
    end(data) {
      if (data) bodyData = data;
      return res;
    },
    toResponse() {
      return new Response(bodyData, {
        status: statusCode,
        headers
      });
    }
  };

  return res;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token'
    }
  });
}

export async function GET(request, { params }) {
  const resolvedParams = (await params) || params || {};
  const action = resolvedParams.action;

  const req = {
    method: 'GET',
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    query: { action }
  };

  const res = createMockRes();
  await adminHandler(req, res);
  return res.toResponse();
}

export async function POST(request, { params }) {
  const resolvedParams = (await params) || params || {};
  const action = resolvedParams.action;

  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  const req = {
    method: 'POST',
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    query: { action },
    body
  };

  const res = createMockRes();
  await adminHandler(req, res);
  return res.toResponse();
}

