import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabaseClient';
import type { CloudModel } from '../../types/database.types';
import { Search, X } from 'lucide-react';

interface CloudModelSelectorProps {
  label?: string;
  selectedModel: CloudModel | null;
  onSelect: (model: CloudModel | null) => void;
  placeholder?: string;
  excludeIds?: string[];
  allowClear?: boolean;
}

export const CloudModelSelector: React.FC<CloudModelSelectorProps> = ({
  label,
  selectedModel,
  onSelect,
  placeholder = 'Search models...',
  excludeIds = [],
  allowClear = false,
}) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { data: models = [] } = useQuery({
    queryKey: ['cloud-models-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cloud_models')
        .select('*, cloud_providers(name)')
        .eq('is_active', true)
        .order('friendly_name');
      if (error) throw error;
      return data as (CloudModel & { cloud_providers: { name: string } })[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = models
    .filter(m => !excludeIds.includes(m.id))
    .filter(m =>
      m.friendly_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.cloud_providers?.name || '').toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="relative">
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
      <div className="relative flex items-center w-full">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-left text-sm text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-500 transition-colors pr-10"
        >
          <span className={selectedModel ? 'text-slate-900 dark:text-white truncate' : 'text-slate-400'}>
            {selectedModel ? selectedModel.friendly_name : placeholder}
          </span>
          <Search size={14} className="text-slate-400 flex-shrink-0 ml-2" />
        </button>
        {allowClear && selectedModel && (
          <button 
            onClick={(e) => { e.stopPropagation(); onSelect(null); }}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-200 dark:border-slate-700">
            <input
              autoFocus
              type="text"
              placeholder="Search by model or provider..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
            />
          </div>
          <div className="max-h-56 overflow-y-auto custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400">No models found</div>
            ) : (
              filtered.map(model => (
                <button
                  key={model.id}
                  onClick={() => { onSelect(model); setIsOpen(false); setSearch(''); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                >
                  <div className="font-medium text-slate-900 dark:text-white">{model.friendly_name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {model.cloud_providers?.name} · ${model.prompt_price_per_1m_usd}/1M in · ${model.completion_price_per_1m_usd}/1M out
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
