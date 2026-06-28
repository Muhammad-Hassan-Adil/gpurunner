// Port of: backend/app/services/hardware_math.py

export interface HardwareMatchResult {
  status: "VRAM_FIT" | "SYSTEM_OFFLOAD" | "OUT_OF_MEMORY";
  m_weights_gb: number;
  m_cache_gb: number;
  total_required_gb: number;
  vram_available_gb: number;
  gpu_weight_fraction: number;
  estimated_tokens_per_second: number;
}

export function calculateHardwareMatch(
  gpuVramGb: number,
  gpuBandwidthGbps: number,
  systemRamGb: number,
  systemRamBandwidthGbps: number,
  modelParamsB: number,
  quantizationBits: number,
  contextLength: number
): HardwareMatchResult {
  // 1. Total Weight Footprint (M_weights)
  // Parameters (Billion) * (Bits-per-weight / 8) * 1.15 (System Overhead Allowance)
  const mWeights = modelParamsB * (quantizationBits / 8.0) * 1.15;

  // 2. Context Memory KV-Cache (M_cache)
  // Simplification: Parameters * 0.1 * (target sequence length / 2048)
  const mCache = modelParamsB * 0.1 * (contextLength / 2048.0);

  const totalRequired = mWeights + mCache;
  const vramAvail = Math.max(0.0, gpuVramGb - 1.5); // OS and UI allocation overhead

  let status: "VRAM_FIT" | "SYSTEM_OFFLOAD" | "OUT_OF_MEMORY";
  let fGpu = 0.0;

  if (totalRequired <= vramAvail) {
    status = "VRAM_FIT";
    fGpu = 1.0;
  } else if (totalRequired > vramAvail + systemRamGb) {
    status = "OUT_OF_MEMORY";
    fGpu = totalRequired > 0 ? vramAvail / totalRequired : 0;
  } else {
    status = "SYSTEM_OFFLOAD";
    fGpu = totalRequired > 0 ? vramAvail / totalRequired : 0;
  }

  // Ensure fGpu is clamped between 0 and 1
  fGpu = Math.max(0.0, Math.min(1.0, fGpu));
  
  // Weights allocation
  const weightsOnGpu = mWeights * fGpu;
  const weightsOnRam = mWeights * (1.0 - fGpu);

  // 4. Estimated Token Speed Calculation
  const timeGpu = gpuBandwidthGbps > 0 ? weightsOnGpu / gpuBandwidthGbps : Infinity;
  const timeRam = systemRamBandwidthGbps > 0 ? weightsOnRam / systemRamBandwidthGbps : Infinity;
  
  const tPerToken = timeGpu + timeRam;
  
  let tokensPerSecond = 0.0;
  if (status === "OUT_OF_MEMORY" || tPerToken <= 0) {
    tokensPerSecond = 0.0;
  } else {
    tokensPerSecond = 1.0 / tPerToken;
  }

  // Helper for rounding to decimals
  const round = (val: number, decimals: number) => {
    const factor = Math.pow(10, decimals);
    return Math.round(val * factor) / factor;
  };

  return {
    status,
    m_weights_gb: round(mWeights, 2),
    m_cache_gb: round(mCache, 2),
    total_required_gb: round(totalRequired, 2),
    vram_available_gb: round(vramAvail, 2),
    gpu_weight_fraction: round(fGpu, 4),
    estimated_tokens_per_second: round(tokensPerSecond, 2)
  };
}
