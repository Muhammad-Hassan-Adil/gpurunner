// Port of: backend/app/api/v1/endpoints/seo.py
import { Env } from '../types';

export async function handleSeoRoutes(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const slugMatch = url.pathname.match(/^\/api\/v1\/seo\/resolve\/(.+)$/);

  if (slugMatch && request.method === 'GET') {
    const slug = slugMatch[1];
    
    // Fetch from pseo_pages table where slug matches
    const headers = {
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    };

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/pseo_pages?slug=eq.${slug}&select=*`, { headers });
    
    if (!res.ok) {
      return new Response(await res.text(), { status: res.status });
    }

    const data = await res.json() as any[];
    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ detail: "SEO page not found" }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Return SEO metadata as JSON
    return new Response(JSON.stringify(data[0]), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('Not Found', { status: 404 });
}
