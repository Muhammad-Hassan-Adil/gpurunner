// Port of: backend/app/services/fetcher.py
import { Env, Gpu, GpuSchema } from '../types';
import { fetchGpuSpecsFromLLM } from './openrouter';

export async function fetchOrGetGpu(
  gpuName: string,
  env: Env
): Promise<Gpu | null> {
  const nameLower = gpuName.toLowerCase();
  const slug = nameLower.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const headers = {
    'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  // 1. Check if GPU exists in Supabase gpus table
  try {
    const checkRes = await fetch(`${env.SUPABASE_URL}/rest/v1/gpus?slug=eq.${slug}&select=*`, {
      method: 'GET',
      headers
    });
    
    if (checkRes.ok) {
      const data = await checkRes.json() as any[];
      if (data && data.length > 0) {
        return data[0] as Gpu;
      }
    }
  } catch (e) {
    console.error(`Error checking existing GPU:`, e);
  }

  // 2. If not, call fetchGpuSpecsFromLLM()
  const specs = await fetchGpuSpecsFromLLM(gpuName, env);
  
  const rawGpu = {
    name: gpuName,
    slug,
    ...specs
  };

  // 3. Clean and validate the returned JSON with Zod
  const validationResult = GpuSchema.safeParse(rawGpu);
  if (!validationResult.success) {
    console.error(`Validation failed for fetched GPU specs`, validationResult.error);
    // Return with temporary ID anyway
    return {
      id: "00000000-0000-0000-0000-000000000000",
      ...(rawGpu as any)
    };
  }
  
  const validGpu = validationResult.data;

  // 4. Insert into Supabase gpus table using service role key
  try {
    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/gpus`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(validGpu)
    });

    if (insertRes.ok) {
      const data = await insertRes.json() as any[];
      if (data && data.length > 0) {
        return data[0] as Gpu;
      }
    } else {
      const errText = await insertRes.text();
      console.error(`Error inserting GPU:`, errText);
    }
  } catch (e) {
    console.error(`Error inserting GPU:`, e);
  }

  // 5. Return the GPU object
  return {
    id: "00000000-0000-0000-0000-000000000000",
    ...validGpu
  } as Gpu;
}
