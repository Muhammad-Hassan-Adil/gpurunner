import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
import { useHardwareMatcher } from '../hooks/useHardwareMatcher';
import { Copy, Check, Upload, Share2, X, Plus } from 'lucide-react';
import { ToolHeader } from '../../../components/common/ToolHeader';
import { GPUSearchSelector } from '../../../components/common/GPUSearchSelector';
import { Slider } from '../../../components/common/Slider';
import type { GPU } from '../../../types/database.types';

export const ShareConfig: React.FC = () => {
  const { hardwareItems } = useHardwareMatcher();
  const [copied, setCopied] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  
  // Local state for editing before sharing, initialized from global state
  const [localItems, setLocalItems] = useState(hardwareItems);
  const [showGpuPicker, setShowGpuPicker] = useState(false);

  // Sync with global state if it changes significantly (e.g. initial load)
  useEffect(() => {
    setLocalItems(hardwareItems);
  }, [hardwareItems]);

  const generateShareUrl = () => {
    const config = {
      version: 1,
      items: localItems.map(item => ({
        type: item.type,
        name: item.name,
        vramGb: item.vramGb,
        bandwidthGbps: item.bandwidthGbps,
        systemRamGb: item.systemRamGb,
      }))
    };
    
    const encoded = btoa(JSON.stringify(config));
    const url = new URL(window.location.href);
    url.pathname = '/rig-configurator/share';
    url.search = '';
    url.searchParams.set('cfg', encoded);
    
    return url.toString();
  };

  const shareUrl = generateShareUrl();

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    if (!importUrl) return;
    try {
      const url = new URL(importUrl);
      const cfg = url.searchParams.get('cfg');
      if (cfg) {
        window.location.href = importUrl;
      } else {
        alert('Invalid share link: Missing configuration data.');
      }
    } catch {
      alert('Invalid URL format.');
    }
  };

  const handleAddGpu = (gpu: GPU) => {
    setLocalItems([...localItems, {
      id: `gpu-${Date.now()}`,
      type: 'gpu',
      name: gpu.name,
      vramGb: gpu.vram_gb,
      bandwidthGbps: gpu.memory_bandwidth_gb_s || 0
    }]);
    setShowGpuPicker(false);
  };

  const removeLocalItem = (id: string) => {
    setLocalItems(localItems.filter(i => i.id !== id));
  };

  const updateSystemRam = (ram: number) => {
    const hasCpu = localItems.some(i => i.type === 'ram');
    if (hasCpu) {
      setLocalItems(localItems.map(i => i.type === 'ram' ? { ...i, systemRamGb: ram } : i));
    } else {
      setLocalItems([...localItems, {
        id: `ram-${Date.now()}`,
        type: 'ram',
        name: 'System Platform',
        systemRamGb: ram,
        bandwidthGbps: 100 // default dummy
      }]);
    }
  };

  const currentRam = localItems.find(i => i.type === 'ram')?.systemRamGb || 32;

  return (
    <Card className="p-6 overflow-visible">
      <ToolHeader 
        icon={<Share2 className="text-blue-500" size={24} />}
        title="Share Configuration"
        description="Generate a unique link to share your specific hardware setup with others."
        tip="You can edit the setup here before generating the link. This won't affect your actual saved rig configuration."
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Edit Before Sharing</h4>
            
            <div className="space-y-3 mb-6">
              {localItems.filter(i => i.type === 'gpu').map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white mr-2">🖥 {item.name}</span>
                    <span className="text-slate-500">({item.vramGb}GB VRAM)</span>
                  </div>
                  <button onClick={() => removeLocalItem(item.id)} className="text-slate-400 hover:text-red-500 p-1">
                    <X size={16} />
                  </button>
                </div>
              ))}
              
              {showGpuPicker ? (
                <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 mb-4 relative z-20 overflow-visible">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Select GPU to add:</span>
                    <button onClick={() => setShowGpuPicker(false)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
                  </div>
                  <div className="relative z-10">
                    <GPUSearchSelector selectedGpu={null} onSelect={handleAddGpu} />
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowGpuPicker(true)} className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                  <Plus size={16} /> Add GPU to Share
                </button>
              )}
            </div>

            <div className="mb-6">
              <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">System RAM</h5>
              <Slider
                label="Total System RAM"
                min={16} max={512} step={16}
                value={currentRam}
                onChange={updateSystemRam}
                suffix="GB"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copied to Clipboard!' : 'Copy Share Link'}
              </button>
              
              <div className="mt-4 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <p className="text-xs text-slate-500 truncate font-mono select-all">
                  {shareUrl}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Import a Config</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Paste a share link below to load someone else's rig configuration.
            </p>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://airigcheck.com/rig-configurator/share?cfg=..."
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
              />
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <Upload size={16} /> Load
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
