import React from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, AlertTriangle, ChevronRight } from 'lucide-react';

export const ProgressMistakesHubScreen: React.FC = () => {
  const { navigate } = useApp();

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-20 pt-6 space-y-6 bg-transparent">
      {/* Header */}
      <div className="space-y-1.5 text-center">
        <h2 className="text-2xl font-black text-slate-850 dark:text-slate-100 font-sans leading-none">
          Progress & Mistakes
        </h2>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
          Track your performance or review your mistakes
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Card 1: Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium flex flex-col justify-between space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 rounded-2xl shrink-0">
              <BarChart3 size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                Progress
              </h3>
              <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                Track your learning progress, performance, analytics, and exam readiness.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('progress')}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold rounded-2xl text-sm uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            style={{ minHeight: '52px' }}
          >
            Open Progress <ChevronRight size={16} />
          </button>
        </div>

        {/* Card 2: Mistakes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium flex flex-col justify-between space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-455 rounded-2xl shrink-0">
              <AlertTriangle size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                Mistakes
              </h3>
              <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                Practice incorrect questions and improve weak areas.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('mistakes')}
            className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl text-sm uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            style={{ minHeight: '52px' }}
          >
            Open Mistakes <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
