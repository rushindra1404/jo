import React from 'react';
import { useApp } from '../context/AppContext';
import { Zap, BookOpen } from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { navigate } = useApp();

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-24 pt-5 space-y-7 bg-transparent scrollbar-thin">
      {/* Page Description Header */}
      <div className="space-y-1.5 pl-1">
        <h2 className="text-xl font-black text-slate-850 dark:text-slate-100 font-sans leading-none tracking-tight">Dedicated Learning Hub</h2>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Choose your revision style</p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {/* Card 1: Revision Mode */}
        <div className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-[28px] p-6 shadow-premium flex flex-col justify-between space-y-5 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 rounded-2xl shrink-0">
              <Zap size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 font-sans tracking-tight">Revision Mode</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Practice chapter-wise multiple-choice questions with instant correct/incorrect feedback, reveal answers, and detailed explanations.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('chapter-select')}
            className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-2xl text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer tap-bounce"
            style={{ minHeight: '52px' }}
          >
            Open Revision Mode
          </button>
        </div>

        {/* Card 2: Flash Cards */}
        <div className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-[28px] p-6 shadow-premium flex flex-col justify-between space-y-5 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
              <BookOpen size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-850 dark:text-slate-100 font-sans tracking-tight">Flash Cards</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Review key definitions, points to remember, conceptual summaries, formulas, and bullet notes one chapter at a time.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('flashcards-landing')}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer tap-bounce"
            style={{ minHeight: '52px' }}
          >
            Open Flash Cards
          </button>
        </div>
      </div>
    </div>
  );
};