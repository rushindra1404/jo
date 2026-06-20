import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ICA_CHAPTERS, GPOE_CHAPTERS } from '../utils/chapters';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Zap,
  RotateCcw,
  Star,
} from 'lucide-react';

export const FlashCardsLandingScreen: React.FC = () => {
  const { navigate, progress, setActiveMaterial } = useApp();
  const [icaTotal] = useState(ICA_CHAPTERS.length);
  const [gpoeTotal] = useState(GPOE_CHAPTERS.length);

  const continueLearning = progress.continueLearning;
  const hasResume =
    continueLearning !== null && continueLearning?.mode === 'flashcard';

  const handleSelectMaterial = (mat: 'ica' | 'gpoe') => {
    setActiveMaterial(mat);
    navigate('flashcards-chapters');
  };

  const handleResume = () => {
    if (!continueLearning) return;
    setActiveMaterial(continueLearning.material);
    navigate('flashcards-chapters');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={() => navigate('learn')}
          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">
            Learning Hub
          </p>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 font-sans">
            Flash Cards
          </h1>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-5 pt-2">

        {/* Info Banner */}
        <div className="p-4 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl shadow-lg text-white">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-yellow-300" />
            <span className="text-xs font-black uppercase tracking-wider text-rose-100">Quick Memory Boost</span>
          </div>
          <p className="text-sm font-bold leading-snug">
            Key facts, definitions, formulas &amp; important points — designed for last-minute revision.
          </p>
          <div className="flex gap-3 mt-3 text-[10px] font-black uppercase text-rose-100 tracking-wider">
            <span className="flex items-center gap-1"><BookOpen size={10} /> Key Points</span>
            <span className="flex items-center gap-1"><Star size={10} /> Bookmarks</span>
            <span className="flex items-center gap-1"><RotateCcw size={10} /> Auto Flip</span>
          </div>
        </div>

        {/* Continue Learning Banner */}
        {hasResume && continueLearning && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-500/60 rounded-2xl shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-500 mb-0.5">
                  ⏱ Resume Session
                </p>
                <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                  {continueLearning.material.toUpperCase()} Flash Cards
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {continueLearning.chapterId.replace('chapter', 'Chapter ')} — Card {continueLearning.questionIndex + 1}
                </p>
              </div>
              <button
                onClick={handleResume}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 text-white text-xs font-black rounded-xl active:scale-95 transition-all cursor-pointer shadow-md"
              >
                Continue <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Select Material */}
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
            Select Study Material
          </h2>
          <div className="space-y-3">

            {/* ICA Card */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelectMaterial('ica')}
              className="w-full text-left p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm active:scale-[0.98] transition-all cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
                    <span className="text-2xl">📘</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100">ICA</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                      Industrial Controls &amp; Administration
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800">
                        {icaTotal} Chapters
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">16 modules</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors shrink-0" />
              </div>

              {/* Progress bar placeholder */}
              <div className="mt-4">
                <div className="flex justify-between text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">
                  <span>Progress</span>
                  <span className="text-blue-500">Tap to Start</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
            </motion.button>

            {/* GPOE Card */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelectMaterial('gpoe')}
              className="w-full text-left p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm active:scale-[0.98] transition-all cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                    <span className="text-2xl">📗</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100">GPOE</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                      General Plant Operations &amp; Engineering
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                        {gpoeTotal} Chapters
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">8 modules</span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors shrink-0" />
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">
                  <span>Progress</span>
                  <span className="text-emerald-500">Tap to Start</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
            </motion.button>
          </div>
        </div>

        {/* Tips */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/60 rounded-2xl space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">How to use Flash Cards</p>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
            <p>👆 <span className="font-bold text-slate-700 dark:text-slate-300">Tap</span> a card to flip and reveal details</p>
            <p>👈 <span className="font-bold text-slate-700 dark:text-slate-300">Swipe left/right</span> to navigate between cards</p>
            <p>⭐ <span className="font-bold text-slate-700 dark:text-slate-300">Bookmark</span> important cards for quick access</p>
            <p>⚡ <span className="font-bold text-slate-700 dark:text-slate-300">Quick Revision</span> mode auto-flips all cards</p>
          </div>
        </div>
      </div>
    </div>
  );
};
