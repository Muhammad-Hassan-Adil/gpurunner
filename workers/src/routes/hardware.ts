// Port of: backend/app/api/v1/endpoints/hardware.py
import { Env, HardwareMatchRequestSchema, FetchGpuRequestSchema } from '../types';
import { calculateHardwareMatch } from '../services/hardwareMath';
import { fetchOrGetGpu } from '../services/fetcher';

export async function handleHardwareRoutes(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  const headers = {
    'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };

  if (path === '/api/v1/hardware/gpus' && request.method === 'GET') {
    // Fetch all from gpus table via Supabase REST
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/gpus?select=*`, { headers });
    if (!res.ok) {
      return new Response(await res.text(), { status: res.status });
    }
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (path === '/api/v1/hardware/models/local' && request.method === 'GET') {
    // Fetch local_models with relational model_quantizations
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/local_models?select=*,quantizations:model_quantizations(*)`, { headers });
    if (!res.ok) {
      return new Response(await res.text(), { status: res.status });
    }
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (path === '/api/v1/hardware/match' && request.method === 'POST') {
    // Parse body, validate with HardwareMatchRequestSchema
    try {
      const body = await request.json();
      const parsed = HardwareMatchRequestSchema.safeParse(body);
      if (!parsed.success) {
        return new Response(JSON.stringify(parsed.error), { status: 422, headers: { 'Content-Type': 'application/json' } });
      }
      const req = parsed.data;
      const result = calculateHardwareMatch(
        req.gpu_vram_gb,
        req.gpu_memory_bandwidth_gb_s,
        req.system_ram_gb,
        req.system_ram_bandwidth_gb_s,
        req.parameters_billion,
        req.bits_per_weight,
        req.target_sequence_length
      );
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ detail: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
  }

  if (path === '/api/v1/hardware/fetch' && request.method === 'POST') {
    // Parse body, validate with FetchGpuRequestSchema
    try {
      const body = await request.json();
      const parsed = FetchGpuRequestSchema.safeParse(body);
      if (!parsed.success) {
        return new Response(JSON.stringify(parsed.error), { status: 422, headers: { 'Content-Type': 'application/json' } });
      }
      
      const gpu = await fetchOrGetGpu(parsed.data.name, env);
      if (!gpu) {
        return new Response(JSON.stringify({ detail: 'Failed to fetch GPU' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      
      return new Response(JSON.stringify(gpu), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ detail: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
  }

  return new Response('Not Found', { status: 404 });
}
