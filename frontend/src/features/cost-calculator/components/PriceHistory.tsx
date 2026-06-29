import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
import { supabase } from '../../../services/supabaseClient';
import { CloudModelSelector } from '../../../components/common/CloudModelSelector';
import type { CloudModel } from '../../../types/database.types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ToolHeader } from '../../../components/common/ToolHeader';
import { LineChart as LineChartIcon } from 'lucide-react';

export const PriceHistory: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<CloudModel | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedModel) {
      setHistoryData([]);
      return;
    }
    
    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('model_id', selectedModel.id)
        .order('date', { ascending: true });
        
      if (!error && data) {
        const latestPoint = {
          date: new Date().toISOString().split('T')[0],
          prompt_price: selectedModel.prompt_price_per_1m_usd,
          completion_price: selectedModel.completion_price_per_1m_usd
        };

        const formatted = data.map(row => ({
          date: row.date,
          prompt_price: Number(row.prompt_price_per_1m_usd),
          completion_price: Number(row.completion_price_per_1m_usd)
        }));
        
        if (formatted.length === 0 || formatted[formatted.length - 1].date !== latestPoint.date) {
          formatted.push(latestPoint);
        }

        setHistoryData(formatted);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [selectedModel]);

  return (
    <Card className="p-6">
      <ToolHeader 
        icon={<LineChartIcon className="text-blue-500" size={24} />}
        title="Price History"
        description="Track how AI model pricing has changed over time. Useful for budgeting and understanding pricing trends across providers."
        tip="Prices tend to drop 40-60% every 6-12 months for major models — check before signing long-term contracts."
      />
      
      <div className="flex flex-col gap-4 mb-8 max-w-md mx-auto relative z-20">
        <CloudModelSelector 
          label="Select Model"
          selectedModel={selectedModel}
          onSelect={setSelectedModel}
          allowClear={true}
        />
      </div>

      <div className="h-80 w-full mt-4 relative z-10">
        {!selectedModel ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <SearchIcon className="mb-2 opacity-50" size={24} />
            <p className="text-sm">Search and select a model above to view its price history</p>
          </div>
        ) : loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-slate-500 animate-pulse font-medium">Loading history...</div>
          </div>
        ) : historyData.length <= 1 ? (
          <div className="w-full h-full flex items-center justify-center text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="text-sm">No historical price changes recorded for this model yet.</div>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={historyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  tickMargin={10}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                  label={{ value: 'Price / 1M Tokens (USD)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12 } }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '14px' }}
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                />
                <Legend verticalAlign="top" height={36} />
                <Line 
                  type="stepAfter" 
                  dataKey="prompt_price" 
                  name="Input Price"
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="stepAfter" 
                  dataKey="completion_price" 
                  name="Output Price"
                  stroke="#10b981" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-center mt-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 mr-4">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Verified data
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full border border-blue-500"></span> Estimated from public announcements
              </span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

const SearchIcon = ({ className, size }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);
