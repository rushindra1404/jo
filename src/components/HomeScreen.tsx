import React from 'react';
import { useApp } from '../context/AppContext';
import { Zap, BookOpen } from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { navigate } = useApp();

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 space-y-6 bg-transparent">
      {/* Page Description Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-black text-slate-850 dark:text-slate-100 font-sans leading-none">Dedicated Learning Hub</h2>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Choose your revision style</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Card 1: Revision Mode */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium flex flex-col justify-between space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 rounded-2xl shrink-0">
              <Zap size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-850 dark:text-slate-100">Revision Mode</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Practice chapter-wise multiple-choice questions with instant correct/incorrect feedback, reveal answers, and detailed explanations.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('chapter-select')}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold rounded-2xl text-sm uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            style={{ minHeight: '52px' }}
          >
            Open Revision Mode
          </button>
        </div>

        {/* Card 2: Flash Cards */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium flex flex-col justify-between space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-445 rounded-2xl shrink-0">
              <BookOpen size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-850 dark:text-slate-100">Flash Cards</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Review key definitions, points to remember, conceptual summaries, formulas, and bullet notes one chapter at a time.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('flashcards-landing')}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-sm uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            style={{ minHeight: '52px' }}
          >
            Open Flash Cards
          </button>
        </div>
      </div>
    </div>
  );
};