import { z } from 'zod';

export const GpuSchema = z.object({
  id: z.string().uuid().optional(), // optional for new inserts
  name: z.string(),
  slug: z.string(),
  vram_gb: z.number(),
  memory_bandwidth_gb_s: z.number(),
  bus_width_bits: z.number(),
  tdp_watts: z.number().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
});

export const LocalModelSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  family: z.string(),
  slug: z.string(),
  parameter_size_billion: z.number(),
  context_length: z.number(),
  huggingface_repo: z.string().optional().nullable(),
  quantizations: z.array(z.object({
    id: z.string().uuid(),
    model_id: z.string().uuid(),
    quant_type: z.string(),
    bits_per_weight: z.number(),
    file_size_gb: z.number(),
    recommended_vram_gb: z.number(),
  })).optional(),
});

export const HardwareMatchRequestSchema = z.object({
  gpu_vram_gb: z.number(),
  gpu_memory_bandwidth_gb_s: z.number(),
  system_ram_gb: z.number().default(32.0),
  system_ram_bandwidth_gb_s: z.number().default(60.0),
  parameters_billion: z.number(),
  bits_per_weight: z.number(),
  target_sequence_length: z.number().default(2048),
});

export const FetchGpuRequestSchema = z.object({
  name: z.string(),
});

export type Gpu = z.infer<typeof GpuSchema>;
export type LocalModel = z.infer<typeof LocalModelSchema>;
export type HardwareMatchRequest = z.infer<typeof HardwareMatchRequestSchema>;
export type FetchGpuRequest = z.infer<typeof FetchGpuRequestSchema>;

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  GROQ_API_KEY: string;
  OPENROUTER_API_KEY: string;
}
