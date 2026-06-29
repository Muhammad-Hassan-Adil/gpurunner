import React from 'react';

interface ToolHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  tip?: string;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({ icon, title, description, tip }) => (
  <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{title}</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
        {tip && (
          <div className="mt-2 flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400">
            <span>💡</span>
            <span>{tip}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);
