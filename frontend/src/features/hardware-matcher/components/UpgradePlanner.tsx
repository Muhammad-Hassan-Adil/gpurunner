import React, { useState, useMemo } from 'react';
import { calculateHardwareMatch } from '../utils/memoryMath';
import { Card } from '../../../components/common/Card';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { ToolHeader } from '../../../components/common/ToolHeader';
import { GPUSearchSelector } from '../../../components/common/GPUSearchSelector';
import type { GPU } from '../../../types/database.types';

export const UpgradePlanner: React.FC = () => {
  const [selectedGpu, setSelectedGpu] = useState<GPU | null>(null);

  const calculateMaxParams = (vramGb: number) => {
    // Math: total_vram - 1.5 (OS) = params * ((4/8) * 1.15 + 0.1)
    // -> params = (vramGb - 1.5) / 0.675
    const params = (vramGb - 1.5) / 0.675;
    return Math.max(0, Math.floor(params));
  };

  const getSpeedForParams = (vramGb: number, bw: number, params: number) => {
    const res = calculateHardwareMatch({
      gpuVramGb: vramGb,
      gpuMemoryBandwidthGbps: bw,
      systemRamGb: 32,
      systemRamBandwidthGbps: 60,
      parametersBillion: params,
      bitsPerWeight: 4,
      targetSequenceLength: 2048,
    });
    return res.estimatedTokensPerSecond;
  };

  const getEstimatedCost = (gpu: GPU) => {
    if (gpu.vram_gb <= 8) return 300;
    if (gpu.vram_gb <= 12) return 500;
    if (gpu.vram_gb <= 16) return 800;
    if (gpu.vram_gb <= 24) return 1500;
    if (gpu.vram_gb <= 48) return 4000;
    return 12000;
  };

  const currentParams = selectedGpu ? calculateMaxParams(selectedGpu.vram_gb) : 0;
  const currentSpeed = selectedGpu ? getSpeedForParams(selectedGpu.vram_gb, selectedGpu.memory_bandwidth_gb_s || 400, currentParams) : 0;

  const roadmap = useMemo(() => {
    if (!selectedGpu) return { step2: null, step3: null };

    const currentCost = getEstimatedCost(selectedGpu);
    const bw = selectedGpu.memory_bandwidth_gb_s || 400;
    
    let step2;
    let step3;

    if (selectedGpu.vram_gb < 16) {
      step2 = {
        name: `2x ${selectedGpu.name}`,
        vram: selectedGpu.vram_gb * 2,
        bw: bw, // Conservative estimate, assumes limited scaling
        cost: currentCost,
        action: 'Add 1x'
      };
      step3 = {
        name: `1x RTX 4090 (24GB)`,
        vram: 24,
        bw: 1008,
        cost: 1600,
        action: 'Replace with'
      };
    } else if (selectedGpu.vram_gb < 24) {
      step2 = {
        name: `1x RTX 4090 (24GB)`,
        vram: 24,
        bw: 1008,
        cost: 1600,
        action: 'Replace with'
      };
      step3 = {
        name: `2x RTX 4090 (48GB)`,
        vram: 48,
        bw: 1008,
        cost: 3200,
        action: 'Replace with'
      };
    } else if (selectedGpu.vram_gb === 24) {
      step2 = {
        name: `2x ${selectedGpu.name} (48GB)`,
        vram: 48,
        bw: bw,
        cost: currentCost,
        action: 'Add 1x'
      };
      step3 = {
        name: `4x ${selectedGpu.name} (96GB)`,
        vram: 96,
        bw: bw,
        cost: currentCost * 3,
        action: 'Expand to'
      };
    } else {
      step2 = {
        name: `2x ${selectedGpu.name} (${selectedGpu.vram_gb * 2}GB)`,
        vram: selectedGpu.vram_gb * 2,
        bw: bw,
        cost: currentCost,
        action: 'Add 1x'
      };
      step3 = {
        name: `Server Node (8x GPU)`,
        vram: selectedGpu.vram_gb * 8,
        bw: bw,
        cost: currentCost * 7,
        action: 'Expand to'
      };
    }

    return { step2, step3 };
  }, [selectedGpu]);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="mb-8">
        <ToolHeader 
          icon={<TrendingUp className="text-emerald-500" size={24} />}
          title="Upgrade Planner"
          description="See exactly what upgrading your current GPU will allow you to run, and the estimated cost to get there."
          tip="Running multiple GPUs allows you to pool VRAM to run larger models, but doesn't necessarily make smaller models run faster."
        />
      </div>

      <Card className="p-6">
        <div className="max-w-xl mx-auto mb-10">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 text-center">Select Your Current GPU</h3>
          <GPUSearchSelector 
            label=""
            selectedGpu={selectedGpu}
            onSelect={setSelectedGpu}
            placeholder="Search your current GPU..."
          />
        </div>

        {selectedGpu && (
          <>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wide text-center">Upgrade Roadmap</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Connector Lines (desktop only) */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 -z-10 -translate-y-1/2"></div>

              {/* Step 1: Current */}
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center text-center relative z-10 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-base font-bold text-slate-600 dark:text-slate-400 mb-4 ring-4 ring-white dark:ring-slate-950">1</div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Now</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2 h-10 flex items-center justify-center">1x {selectedGpu.name}</p>
                <div className="bg-white dark:bg-slate-950 rounded-lg p-3 w-full border border-slate-100 dark:border-slate-800/60">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Max Model: {currentParams > 0 ? `${currentParams}B` : 'Too small'}</p>
                  <p className="text-xs text-slate-500">Speed: {currentParams > 0 ? `${Math.round(currentSpeed)} tok/s` : 'N/A'}</p>
                </div>
                
                <ArrowRight className="md:hidden text-slate-300 dark:text-slate-700 mt-4" size={24} />
              </div>

              {/* Step 2 */}
              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-xl p-6 flex flex-col items-center text-center relative z-10 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-base font-bold text-blue-600 dark:text-blue-400 mb-4 ring-4 ring-white dark:ring-slate-950">2</div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Next (~${roadmap.step2?.cost})</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2 h-10 flex items-center justify-center flex-col leading-tight">
                  <span className="text-xs font-normal text-slate-500">{roadmap.step2?.action}</span>
                  {roadmap.step2?.name}
                </p>
                <div className="bg-white dark:bg-slate-950 rounded-lg p-3 w-full border border-blue-100 dark:border-blue-900/30">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Max Model: {calculateMaxParams(roadmap.step2?.vram || 0)}B</p>
                  <p className="text-xs text-slate-500">Speed: {Math.round(getSpeedForParams(roadmap.step2?.vram || 0, roadmap.step2?.bw || 400, calculateMaxParams(roadmap.step2?.vram || 0)))} tok/s</p>
                </div>

                <ArrowRight className="md:hidden text-slate-300 dark:text-slate-700 mt-4" size={24} />
              </div>

              {/* Step 3 */}
              <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-6 flex flex-col items-center text-center relative z-10 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-base font-bold text-indigo-600 dark:text-indigo-400 mb-4 ring-4 ring-white dark:ring-slate-950">3</div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Future (~${roadmap.step3?.cost})</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2 h-10 flex items-center justify-center flex-col leading-tight">
                  <span className="text-xs font-normal text-slate-500">{roadmap.step3?.action}</span>
                  {roadmap.step3?.name}
                </p>
                <div className="bg-white dark:bg-slate-950 rounded-lg p-3 w-full border border-indigo-100 dark:border-indigo-900/30">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Max Model: {calculateMaxParams(roadmap.step3?.vram || 0)}B</p>
                  <p className="text-xs text-slate-500">Speed: {Math.round(getSpeedForParams(roadmap.step3?.vram || 0, roadmap.step3?.bw || 400, calculateMaxParams(roadmap.step3?.vram || 0)))} tok/s</p>
                </div>
              </div>
            </div>
          </>
        )}

        {!selectedGpu && (
          <div className="py-12 flex flex-col items-center justify-center text-center opacity-60">
            <TrendingUp size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 max-w-sm">Select your current GPU above to see a personalized upgrade roadmap.</p>
          </div>
        )}
      </Card>
    </div>
  );
};
