import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card } from '../../../components/common/Card';
import { Slider } from '../../../components/common/Slider';
import { useCostCalculator } from '../hooks/useCostCalculator';
import { Clock, Zap } from 'lucide-react';
import { ToolHeader } from '../../../components/common/ToolHeader';
import { CloudModelSelector } from '../../../components/common/CloudModelSelector';
import type { CloudModel } from '../../../types/database.types';

export const BatchVsRealtime: React.FC = () => {
  const { models } = useCostCalculator();
  const [selectedModel, setSelectedModel] = useState<CloudModel | null>(null);
  const [requestsPerMonth, setRequestsPerMonth] = useState(10000);
  const [inputTokens, setInputTokens] = useState(2000);
  const [outputTokens, setOutputTokens] = useState(500);

  const activeModels = models.filter(m => m.is_active).sort((a, b) => a.friendly_name.localeCompare(b.friendly_name));

  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedModel && tableRef.current) {
      const row = tableRef.current.querySelector(`[data-model-id="${selectedModel.id}"]`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedModel]);

  const costs = useMemo(() => {
    return activeModels.map(m => {
      const costPerRequest = 
        ((m.prompt_price_per_1m_usd / 1000000) * inputTokens) + 
        ((m.completion_price_per_1m_usd / 1000000) * outputTokens);
      
      const realtimeMonthly = costPerRequest * requestsPerMonth;
      const batchMonthly = realtimeMonthly * 0.5;
      const savings = realtimeMonthly - batchMonthly;
      
      return {
        ...m,
        realtimeMonthly,
        batchMonthly,
        savings
      };
    }).sort((a, b) => b.savings - a.savings);
  }, [activeModels, requestsPerMonth, inputTokens, outputTokens]);

  const selectedCosts = costs.find(c => c.id === selectedModel?.id);
  const displayCosts = selectedCosts || { realtimeMonthly: 0, batchMonthly: 0, savings: 0 };

  return (
    <Card className="p-6">
      <ToolHeader 
        icon={<Clock className="text-blue-500" size={24} />}
        title="Batch vs Realtime Savings"
        description="Compare the cost of standard real-time API calls vs asynchronous batch processing. Batch APIs are 50% cheaper but results take up to 24 hours."
        tip="If your use case doesn't need instant responses (data processing, analysis, classification), batch mode can halve your API costs."
      />
      
      <div className="mb-8">
        <div className="max-w-md">
          <CloudModelSelector 
            label="Filter by model (optional)"
            selectedModel={selectedModel}
            onSelect={setSelectedModel}
            allowClear={true}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <Slider
            label="Requests per Month"
            min={1000} max={1000000} step={1000}
            value={requestsPerMonth}
            onChange={setRequestsPerMonth}
          />
        </div>

        <div className="space-y-6">
          <Slider
            label="Avg Input Tokens per Request"
            min={10} max={128000} step={100}
            value={inputTokens}
            onChange={setInputTokens}
          />
          <Slider
            label="Avg Output Tokens per Request"
            min={10} max={32000} step={100}
            value={outputTokens}
            onChange={setOutputTokens}
          />
        </div>
      </div>

      {selectedModel && (
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mb-8">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-6 text-center">
            Estimated for {selectedModel.friendly_name}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center">
              <Zap className="text-amber-500 mb-3" size={24} />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Realtime API</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                ${displayCosts.realtimeMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-slate-500">per month</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800/50 flex flex-col items-center text-center">
              <Clock className="text-blue-500 mb-3" size={24} />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Batch API (50% off)</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                ${displayCosts.batchMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-slate-500">per month</p>
            </div>
            
            <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800/50 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-2">Total Savings</p>
              <p className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-2">
                ${displayCosts.savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-600 font-medium">every month</p>
            </div>
          </div>
        </div>
      )}

      <div className="pt-6 border-t border-slate-200 dark:border-slate-800" ref={tableRef}>
        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">All Models Comparison</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium rounded-tl-lg">Model</th>
                <th className="px-4 py-3 font-medium text-right">Realtime Cost</th>
                <th className="px-4 py-3 font-medium text-right">Batch Cost</th>
                <th className="px-4 py-3 font-medium text-right text-emerald-600 dark:text-emerald-500 rounded-tr-lg">Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {costs.map(m => {
                const isSelected = selectedModel?.id === m.id;
                return (
                  <tr 
                    key={m.id} 
                    data-model-id={m.id}
                    className={`transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-inset ring-blue-500' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {m.friendly_name}
                      {isSelected && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">Selected</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                      ${m.realtimeMonthly.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                      ${m.batchMonthly.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      ${m.savings.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <p className="mt-6 text-xs text-center text-slate-500">
          Note: Batch APIs (like OpenAI Batch or Anthropic Message Batch) require submitting requests in a file and returning results within 24 hours. They are ideal for bulk processing where immediate responses are not required.
        </p>
      </div>
    </Card>
  );
};
