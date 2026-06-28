// Port of: backend/app/services/openrouter_service.py
import { Env } from '../types';

export async function fetchGpuSpecsFromLLM(
  gpuName: string,
  env: Env
): Promise<Record<string, unknown> | null> {
  let url = '';
  let headers: Record<string, string> = {};
  let modelName = '';

  if (env.GROQ_API_KEY) {
    url = "https://api.groq.com/openai/v1/chat/completions";
    headers = {
      "Authorization": `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    };
    modelName = "llama3-8b-8192";
  } else {
    url = "https://openrouter.ai/api/v1/chat/completions";
    headers = {
      "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    };
    modelName = "meta-llama/llama-3-8b-instruct";
  }
  
  const prompt = `
    You are a technical AI hardware expert. The user wants specifications for the following GPU: "${gpuName}".
    Return ONLY a valid JSON object matching this exact schema, with no markdown formatting, no explanation, and no backticks:
    {
        "vram_gb": <float, e.g. 24.0>,
        "memory_bandwidth_gb_s": <float, e.g. 1008.0>,
        "bus_width_bits": <int, e.g. 384>,
        "manufacturer": <string, e.g. "NVIDIA", "AMD", "Intel", "Apple", or "Unknown">
    }
    If the exact specs are unknown or unreleased, provide your best educated estimate based on leaks or the tier of the card.
    `;
    
  const payload = {
    model: modelName,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.0,
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`LLM API returned ${response.status}`);
    }
    
    const data = await response.json() as any;
    let content = data.choices[0].message.content as string;
    
    // Clean up the response if the LLM still returns markdown blocks
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // Try to extract just the JSON object if there's surrounding text
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      content = match[0];
    }
        
    return JSON.parse(content);
  } catch (e) {
    console.error(`LLM API error:`, e);
    
    // Smart fallback: Try to extract VRAM from the name (e.g. "RTX 4050 6GB")
    let vram = 16.0; // Default if we can't find anything
    const match = gpuName.match(/(\d+)GB/i);
    if (match && match[1]) {
      vram = parseFloat(match[1]);
    }
        
    return {
      vram_gb: vram,
      memory_bandwidth_gb_s: 500.0,
      bus_width_bits: 256,
      manufacturer: "Unknown"
    };
  }
}
