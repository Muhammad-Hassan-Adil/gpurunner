import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabaseClient';
import type { GPU } from '../../types/database.types';
import { Search } from 'lucide-react';

interface GPUSelectorProps {
  label?: string;
  selectedGpu: GPU | null;
  onSelect: (gpu: GPU) => void;
  placeholder?: string;
}

export const GPUSearchSelector: React.FC<GPUSelectorProps> = ({
  label = 'Select GPU',
  selectedGpu,
  onSelect,
  placeholder = 'Search 85 GPUs...'
}) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { data: gpus = [] } = useQuery({
    queryKey: ['gpus'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gpus')
        .select('*')
        .order('vram_gb', { ascending: true });
      if (error) throw error;
      return data as GPU[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const filtered = gpus.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.manufacturer?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-left text-sm text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-500 transition-colors"
      >
        <span className={selectedGpu ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
          {selectedGpu ? `${selectedGpu.name} (${selectedGpu.vram_gb}GB)` : placeholder}
        </span>
        <Search size={14} className="text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-200 dark:border-slate-700">
            <input
              autoFocus
              type="text"
              placeholder="Search by name or manufacturer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
            />
          </div>
          <div className="max-h-56 overflow-y-auto custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400">No GPUs found</div>
            ) : (
              filtered.map(gpu => (
                <button
                  key={gpu.id}
                  onClick={() => { onSelect(gpu); setIsOpen(false); setSearch(''); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                >
                  <div className="font-medium text-slate-900 dark:text-white">{gpu.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {gpu.vram_gb}GB VRAM · {gpu.memory_bandwidth_gb_s} GB/s
                    {gpu.tdp_watts ? ` · ${gpu.tdp_watts}W TDP` : ''}
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
