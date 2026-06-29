import React, { useState, useMemo } from 'react';
import { Card } from '../../../components/common/Card';
import { Slider } from '../../../components/common/Slider';
import { useCostCalculator } from '../hooks/useCostCalculator';
import { ToolHeader } from '../../../components/common/ToolHeader';
import { Calculator } from 'lucide-react';
import { CloudModelSelector } from '../../../components/common/CloudModelSelector';
import type { CloudModel } from '../../../types/database.types';

export const BudgetCalculator: React.FC = () => {
  const { models } = useCostCalculator();
  const [budget, setBudget] = useState(100);
  const [inputTokens, setInputTokens] = useState(1000);
  const [outputTokens, setOutputTokens] = useState(500);
  
  const [viewMode, setViewMode] = useState<'all' | 'single'>('all');
  const [selectedModel, setSelectedModel] = useState<CloudModel | null>(null);

  const activeModels = models.filter(m => m.is_active);

  const calculatedRequests = useMemo(() => {
    return activeModels.map(m => {
      const inCost = (m.prompt_price_per_1m_usd / 1000000) * inputTokens;
      const outCost = (m.completion_price_per_1m_usd / 1000000) * outputTokens;
      const costPerRequest = inCost + outCost;
      
      const requests = costPerRequest > 0 ? Math.floor(budget / costPerRequest) : 0;
      
      return {
        ...m,
        inCost,
        outCost,
        costPerRequest,
        requests
      };
    }).sort((a, b) => b.requests - a.requests);
  }, [activeModels, budget, inputTokens, outputTokens]);

  const topModels = calculatedRequests.filter(m => m.requests > 0).slice(0, 10);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const selectedModelData = useMemo(() => {
    if (!selectedModel) return null;
    return calculatedRequests.find(m => m.id === selectedModel.id);
  }, [selectedModel, calculatedRequests]);

  return (
    <Card className="p-6">
      <ToolHeader 
        icon={<Calculator className="text-blue-500" size={24} />}
        title="Budget Calculator"
        description="Work backwards from your budget. Enter how much you can spend and see exactly how many API requests you can afford per model."
        tip="Switch to 'Single Model' view for a detailed per-hour and per-minute breakdown of your request capacity."
      />

      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button 
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            All Models
          </button>
          <button 
            onClick={() => setViewMode('single')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'single' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Single Model
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Total Monthly Budget ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input
                type="number"
                min="1"
                value={budget}
                onChange={(e) => setBudget(Math.max(1, Number(e.target.value)))}
                className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
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

      <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
        {viewMode === 'all' ? (
          <>
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Requests within budget</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topModels.map(m => (
                <div key={m.id} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                  <div className="overflow-hidden pr-2">
                    <p className="font-semibold text-slate-900 dark:text-white truncate" title={m.friendly_name}>
                      {m.friendly_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      ${m.costPerRequest < 0.0001 ? '<0.0001' : m.costPerRequest.toFixed(4)} / req
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatNumber(m.requests)}
                    </p>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Requests</p>
                  </div>
                </div>
              ))}
              {topModels.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-500">
                  No models available or budget is too low.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            <CloudModelSelector 
              label="Select a Model"
              selectedModel={selectedModel}
              onSelect={setSelectedModel}
            />

            {selectedModelData && (
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-800 mt-6">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  {selectedModelData.friendly_name} <span className="text-sm font-normal text-slate-500 ml-2">— {(selectedModelData as any).cloud_providers?.name}</span>
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Monthly Budget</div>
                    <div className="font-semibold text-slate-900 dark:text-white">${budget.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Input tokens/request</div>
                    <div className="font-semibold text-slate-900 dark:text-white">{inputTokens.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Output tokens/request</div>
                    <div className="font-semibold text-slate-900 dark:text-white">{outputTokens.toLocaleString()}</div>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                  <h5 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">YOU CAN AFFORD:</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-bold text-blue-600 dark:text-blue-400">{selectedModelData.requests.toLocaleString()}</span>
                      <span className="text-slate-600 dark:text-slate-300">requests per month</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{Math.floor(selectedModelData.requests / 30).toLocaleString()}</span>
                      <span className="text-slate-500">requests per day</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{Math.floor(selectedModelData.requests / (30 * 24)).toLocaleString()}</span>
                      <span className="text-slate-500">requests per hour</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedModelData.requests > 0 
                          ? `~1 request every ${Math.ceil((30 * 24 * 60) / selectedModelData.requests).toLocaleString()} minutes`
                          : '0'}
                      </span>
                      <span className="text-slate-500">frequency</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cost per request:</span>
                      <span className="font-medium text-slate-900 dark:text-white">${selectedModelData.costPerRequest.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Input cost/req:</span>
                      <span className="font-medium text-slate-900 dark:text-white">${selectedModelData.inCost.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Output cost/req:</span>
                      <span className="font-medium text-slate-900 dark:text-white">${selectedModelData.outCost.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!selectedModel && (
              <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Select a model above to see a detailed capacity breakdown.
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
