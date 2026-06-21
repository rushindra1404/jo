import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getChaptersByMaterial } from '../utils/chapters';
import { loadChapterFlashCards } from '../utils/csvLoader';
import { ChevronRight, Search, BookOpen, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';

interface ChapterMeta {
  chapterId: string;
  totalCards: number;
  loading: boolean;
}

export const FlashCardsLandingScreen: React.FC = () => {
  const {
    activeMaterial,
    setActiveMaterial,
    setActiveChapterId,
    navigate,
    progress,
    addRecentActivity,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [chapterMeta, setChapterMeta] = useState<Record<string, ChapterMeta>>({});

  // Fallback to 'ica' if no material is active
  const material = activeMaterial || 'ica';

  const chapters = getChaptersByMaterial(material);

  // Load counts for all chapters in background
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

  const getBookmarkCount = (chId: string): number => {
    return progress.bookmarks.filter(id => id.startsWith(`fc_${material}_${chId}_`)).length;
  };

  const isResumeChapter = (chId: string) =>
    progress.continueLearning?.material === material &&
    progress.continueLearning?.chapterId === chId &&
    progress.continueLearning?.mode === 'flashcard';

  const filteredChapters = searchQuery
    ? chapters.filter(
        ch =>
          ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ch.num.toString().includes(searchQuery.toLowerCase())
      )
    : chapters;

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 space-y-5 bg-transparent">
      {/* Header Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('learn')}
          className="p-2 -ml-2 rounded-xl text-slate-655 dark:text-slate-350 active:bg-slate-105 dark:active:bg-slate-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h2 className="text-xs font-black uppercase text-rose-500 tracking-wider">JO Sphere Flashcards</h2>
          <p className="text-lg font-black text-slate-900 dark:text-white font-sans mt-0.5">Memory Reinforcement</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3 min-h-[52px]">
        <Search size={18} className="text-slate-400 dark:text-slate-500 shrink-0" />
        <input
          type="text"
          placeholder="Search flash cards or chapters..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-400 dark:text-slate-500 font-bold hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer px-1 py-0.5"
          >
            Clear
          </button>
        )}
      </div>

      {/* Selector Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
        <button
          onClick={() => setActiveMaterial('ica')}
          className={`flex items-center justify-center gap-2 h-14 rounded-2xl transition-all duration-200 font-extrabold cursor-pointer border ${
            material === 'ica'
              ? 'bg-rose-500 dark:bg-rose-600 text-white border-transparent shadow-md'
              : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-202 dark:border-slate-800'
          }`}
        >
          <span className="text-base">📘</span> ICA (16 Chapters)
        </button>
        <button
          onClick={() => setActiveMaterial('gpoe')}
          className={`flex items-center justify-center gap-2 h-14 rounded-2xl transition-all duration-200 font-extrabold cursor-pointer border ${
            material === 'gpoe'
              ? 'bg-rose-500 dark:bg-rose-600 text-white border-transparent shadow-md'
              : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-202 dark:border-slate-800'
          }`}
        >
          <span className="text-base">📗</span> GPOE (8 Chapters)
        </button>
      </div>

      {/* Chapters list */}
      <div className="space-y-3.5">
        {filteredChapters.map((ch) => {
          const meta = chapterMeta[ch.id];
          const totalCards = meta?.totalCards ?? null;
          const isLoading = meta?.loading !== false;
          const lastIndex = getLastIndex(ch.id);
          const bookmarkCount = getBookmarkCount(ch.id);
          const isResume = isResumeChapter(ch.id);
          const progressPct = totalCards && totalCards > 0
            ? Math.round(((lastIndex + 1) / totalCards) * 100)
            : 0;

          let borderClass = isResume
            ? 'border-rose-500 dark:border-rose-500 border-2'
            : 'border-slate-200 dark:border-slate-800';

          return (
            <button
              key={ch.id}
              onClick={() => handleSelectChapter(ch.id)}
              className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-2xl p-5 flex items-center justify-between text-left shadow-premium hover:shadow-premium-hover active:scale-[0.99] transition-all cursor-pointer ${borderClass}`}
            >
              <div className="flex-1 pr-3 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-550">
                    Chapter {ch.num}
                  </span>
                  {isResume && (
                    <span className="text-[9px] font-extrabold bg-amber-500 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse shrink-0">
                      ⏱ Continue
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2">
                  {ch.title}
                </h3>

                {/* Stats row */}
                <div className="flex items-center gap-3.5 pt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isLoading ? (
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 font-bold italic">Loading cards...</span>
                  ) : (
                    <>
                      <span className="flex items-center gap-1">
                        <BookOpen size={12} className="text-rose-500" />
                        {totalCards ?? 0} cards
                      </span>
                      {isResume && lastIndex > 0 && (
                        <span className="flex items-center gap-1 text-amber-500">
                          <Clock size={12} />
                          Card {lastIndex + 1}
                        </span>
                      )}
                      {bookmarkCount > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-550">
                          ⭐ {bookmarkCount} bookmarked
                        </span>
                      )}
                      {progressPct === 100 && (
                        <span className="flex items-center gap-1 text-emerald-500">
                          <CheckCircle2 size={12} /> Complete
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Progress bar — only if started */}
                {!isLoading && totalCards && totalCards > 0 && lastIndex > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[9px] text-slate-450 font-black uppercase">
                      <span>{progressPct}% viewed</span>
                      <span>{lastIndex + 1} / {totalCards}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 dark:bg-rose-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <ChevronRight size={18} className="text-slate-400 dark:text-slate-550 shrink-0 ml-2" />
            </button>
          );
        })}

        {filteredChapters.length === 0 && (
          <div className="text-center p-8 bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-3xl text-slate-400 dark:text-slate-500 font-semibold text-xs">
            No matching chapters found.
          </div>
        )}
      </div>
    </div>
  );
};
