import { handleHardwareRoutes } from './routes/hardware';
import { handleSeoRoutes } from './routes/seo';
import { Env } from './types';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'airigcheck-api' }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    let response: Response;

    try {
      if (url.pathname.startsWith('/api/v1/hardware')) {
        response = await handleHardwareRoutes(request, env);
      } else if (url.pathname.startsWith('/api/v1/seo')) {
        response = await handleSeoRoutes(request, env);
      } else {
        response = new Response('Not Found', { status: 404 });
      }
    } catch (e) {
      console.error('Unhandled API error:', e);
      response = new Response(JSON.stringify({ detail: 'Internal Server Error' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add CORS headers to all responses
    const newHeaders = new Headers(response.headers);
    Object.entries(CORS_HEADERS).forEach(([k, v]) => newHeaders.set(k, v));
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  }
};
