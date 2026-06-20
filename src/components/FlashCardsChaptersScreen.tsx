import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getChaptersByMaterial } from '../utils/chapters';
import { loadChapterFlashCards } from '../utils/csvLoader';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface ChapterMeta {
  chapterId: string;
  totalCards: number;
  loading: boolean;
}

export const FlashCardsChaptersScreen: React.FC = () => {
  const {
    activeMaterial,
    setActiveChapterId,
    navigate,
    progress,
    addRecentActivity,
  } = useApp();

  const material = activeMaterial || 'ica';
  const chapters = getChaptersByMaterial(material);

  const [chapterMeta, setChapterMeta] = useState<Record<string, ChapterMeta>>({});

  // Load card counts for all chapters in background
  useEffect(() => {
    let cancelled = false;
    const fetchCounts = async () => {
      for (const ch of chapters) {
        if (cancelled) break;
        try {
          const cards = await loadChapterFlashCards(material, ch.fileName, ch.id);
          if (!cancelled) {
            setChapterMeta(prev => ({
              ...prev,
              [ch.id]: { chapterId: ch.id, totalCards: cards.length, loading: false },
            }));
          }
        } catch {
          if (!cancelled) {
            setChapterMeta(prev => ({
              ...prev,
              [ch.id]: { chapterId: ch.id, totalCards: 0, loading: false },
            }));
          }
        }
      }
    };
    fetchCounts();
    return () => { cancelled = true; };
  }, [material]);

  // Get last viewed index for a chapter from progress
  const getLastIndex = (chId: string): number => {
    if (
      progress.continueLearning?.material === material &&
      progress.continueLearning?.chapterId === chId &&
      progress.continueLearning?.mode === 'flashcard'
    ) {
      return progress.continueLearning.questionIndex;
    }
    return 0;
  };

  // Count bookmarks for a chapter
  const getBookmarkCount = (chId: string): number => {
    return progress.bookmarks.filter(id => id.startsWith(`fc_${material}_${chId}_`)).length;
  };

  const handleSelectChapter = (chapterId: string) => {
    setActiveChapterId(chapterId);
    const ch = chapters.find(c => c.id === chapterId);
    if (ch) {
      addRecentActivity(
        'study',
        material,
        `Flash Cards: Ch ${ch.num} — ${ch.title}`,
        ch.title,
        chapterId
      );
    }
    navigate('flashcards-viewer');
  };

  const isResumeChapter = (chId: string) =>
    progress.continueLearning?.material === material &&
    progress.continueLearning?.chapterId === chId &&
    progress.continueLearning?.mode === 'flashcard';

  const materialColor = material === 'ica'
    ? { bg: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-900', hover: 'hover:border-blue-400 dark:hover:border-blue-500', ring: 'border-blue-400 dark:border-blue-500', gradient: 'from-blue-500 to-indigo-600' }
    : { bg: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900', hover: 'hover:border-emerald-400 dark:hover:border-emerald-500', ring: 'border-emerald-400 dark:border-emerald-500', gradient: 'from-emerald-500 to-teal-600' };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900">
        <button
          onClick={() => navigate('flashcards-landing')}
          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Flash Cards</p>
          <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 font-sans">
            {material === 'ica' ? '📘 ICA Chapters' : '📗 GPOE Chapters'}
          </h1>
        </div>
        <div className={`px-3 py-1.5 rounded-xl ${materialColor.light} ${materialColor.text} text-[10px] font-black uppercase tracking-wider border ${materialColor.border}`}>
          {chapters.length} Chapters
        </div>
      </div>

      {/* Chapter List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-2.5">
        {chapters.map((ch, idx) => {
          const meta = chapterMeta[ch.id];
          const totalCards = meta?.totalCards ?? null;
          const isLoading = meta?.loading !== false;
          const lastIndex = getLastIndex(ch.id);
          const bookmarkCount = getBookmarkCount(ch.id);
          const isResume = isResumeChapter(ch.id);
          const progressPct = totalCards && totalCards > 0
            ? Math.round(((lastIndex + 1) / totalCards) * 100)
            : 0;

          return (
            <motion.button
              key={ch.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => handleSelectChapter(ch.id)}
              className={`w-full text-left p-4 bg-white dark:bg-slate-900 border rounded-2xl shadow-sm transition-all cursor-pointer active:scale-[0.98] ${
                isResume
                  ? `border-2 ${materialColor.ring}`
                  : `border-slate-200 dark:border-slate-800 ${materialColor.hover}`
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Chapter number badge */}
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${materialColor.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                  <span className="text-white font-black text-sm">{ch.num}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate leading-snug">
                      {ch.title}
                    </h3>
                    {isResume && (
                      <span className="shrink-0 text-[8px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        Resume
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    {material.toUpperCase()} • Chapter {ch.num}
                  </p>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 mt-1.5">
                    {isLoading ? (
                      <span className="text-[10px] text-slate-300 dark:text-slate-600 font-bold italic">Loading...</span>
                    ) : (
                      <>
                        <span className={`text-[10px] font-black ${materialColor.text}`}>
                          <BookOpen size={9} className="inline mr-0.5" />
                          {totalCards ?? 0} cards
                        </span>
                        {isResume && lastIndex > 0 && (
                          <span className="text-[10px] text-amber-500 font-bold">
                            <Clock size={9} className="inline mr-0.5" />
                            Card {lastIndex + 1}
                          </span>
                        )}
                        {bookmarkCount > 0 && (
                          <span className="text-[10px] text-amber-500 font-bold">
                            ⭐ {bookmarkCount}
                          </span>
                        )}
                        {progressPct === 100 && (
                          <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                            <CheckCircle2 size={9} /> Done
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 shrink-0" />
              </div>

              {/* Progress bar — only if started */}
              {!isLoading && totalCards && totalCards > 0 && lastIndex > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-[9px] text-slate-400 font-black uppercase mb-1">
                    <span>{progressPct}% viewed</span>
                    <span>{lastIndex + 1} / {totalCards}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1">
                    <div
                      className={`bg-gradient-to-r ${materialColor.gradient} h-1 rounded-full transition-all duration-500`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
