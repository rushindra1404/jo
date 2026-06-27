import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { loadChapterFlashCards } from '../utils/csvLoader';
import type { FlashCard } from '../utils/csvLoader';
import { getChaptersByMaterial } from '../utils/chapters';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Search,
  X,
  Zap,
  RotateCcw,
  Filter,
} from 'lucide-react';

// ─── Importance badge config ────────────────────────────────────────────────
const IMPORTANCE_CONFIG = {
  High:   { label: '🔴 High',   cls: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800' },
  Medium: { label: '🟡 Medium', cls: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800' },
  Low:    { label: '🟢 Low',    cls: 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800' },
};

// ─── Category colour mapping ─────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  'Fact':                  'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800',
  'Exam Point':            'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800',
  'Definition':            'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800',
  'Important Point':       'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800',
  'Comparison':            'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-800',
  'Cause-Effect':          'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-805',
  'Cause-Effect Relationship': 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-800',
  'Formula':               'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
  'Process':               'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800',
  'Safety':                'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800',
  'Classification':        'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-800',
  'Memory Hook':           'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-800',
};
const DEFAULT_CAT_CLS = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';

export const FlashCardsPracticeScreen: React.FC = () => {
  const {
    activeMaterial,
    activeChapterId,
    progress,
    toggleBookmark,
    navigate,
    updateContinueLearning,
    addRecentActivity,
  } = useApp();

  const material = activeMaterial || 'ica';
  const chapterId = activeChapterId || 'chapter01';
  const currentChapter = getChaptersByMaterial(material).find(c => c.id === chapterId);

  // ── State ──────────────────────────────────────────────────────────────────
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [importanceFilter, setImportanceFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [showSearch, setShowSearch] = useState(false);
  const [quickRevision, setQuickRevision] = useState(false);
  const [direction, setDirection] = useState<number>(0);
  const autoFlipRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartX = useRef<number>(0);

  // ── Load Cards ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setIsFlipped(false);
      setCurrentIndex(0);
      try {
        if (currentChapter) {
          const loaded = await loadChapterFlashCards(material, currentChapter.fileName, chapterId);
          setCards(loaded);

          // Restore last position
          if (
            progress.continueLearning?.material === material &&
            progress.continueLearning?.chapterId === chapterId &&
            progress.continueLearning?.mode === 'flashcard'
          ) {
            const saved = progress.continueLearning.questionIndex;
            if (saved > 0 && saved < loaded.length) setCurrentIndex(saved);
          }
        }
      } catch (err) {
        console.error('Failed to load flashcards:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();

    if (currentChapter) {
      addRecentActivity('study', material, `Flash Cards: Ch ${currentChapter.num}`, currentChapter.title, chapterId);
    }
  }, [material, chapterId]);

  // ── Save progress on index change ──────────────────────────────────────────
  useEffect(() => {
    if (cards.length > 0) {
      updateContinueLearning(material, chapterId, currentIndex, 'flashcard');
    }
  }, [currentIndex, cards.length]);

  // ── Filtered cards ──────────────────────────────────────────────────────────
  const filteredCards = cards.filter(c => {
    const matchesSearch = !searchQuery ||
      c.point.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.example && c.example.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesImportance = importanceFilter === 'All' || c.importance === importanceFilter;
    return matchesSearch && matchesImportance;
  });

  // Clamp index when filter changes
  useEffect(() => {
    setIsFlipped(false);
    if (currentIndex >= filteredCards.length && filteredCards.length > 0) {
      setCurrentIndex(filteredCards.length - 1);
    }
  }, [searchQuery, importanceFilter, filteredCards.length]);

  const activeCard = filteredCards[currentIndex];
  const isBookmarked = activeCard ? progress.bookmarks.includes(activeCard.uniqueId) : false;

  // ── Navigation handlers ────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (currentIndex < filteredCards.length - 1) {
      setIsFlipped(false);
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    }
  }, [filteredCards.length, currentIndex]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleFlip = () => setIsFlipped(f => !f);

  // ── Quick Revision auto-flip ───────────────────────────────────────────────
  useEffect(() => {
    if (quickRevision) {
      autoFlipRef.current = setTimeout(() => {
        if (!isFlipped) {
          setIsFlipped(true);
        } else {
          setIsFlipped(false);
          setDirection(1);
          setCurrentIndex(prev => {
            if (prev < filteredCards.length - 1) return prev + 1;
            setQuickRevision(false); // done
            return prev;
          });
        }
      }, 2500);
    }
    return () => { if (autoFlipRef.current) clearTimeout(autoFlipRef.current); };
  }, [quickRevision, isFlipped, currentIndex, filteredCards.length]);

  // ── Swipe handlers ─────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - dragStartX.current;
    if (delta < -60) goNext();
    else if (delta > 60) goPrev();
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500 mb-4" />
        <p className="text-sm font-black text-slate-700 dark:text-slate-300">Loading Flash Cards...</p>
        <p className="text-xs text-slate-400 mt-1">Preparing {currentChapter?.title}</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-955 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <X size={28} className="text-slate-400" />
        </div>
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100">No Flash Cards Available</h3>
        <p className="text-xs text-slate-400 max-w-xs">
          The CSV file for this chapter hasn't been uploaded yet. Check back later.
        </p>
        <button
          onClick={() => navigate('flashcards-landing')}
          className="px-5 py-3 bg-rose-500 text-white text-xs font-black rounded-2xl active:scale-95 transition-all cursor-pointer"
        >
          ← Back to Chapters
        </button>
      </div>
    );
  }

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 250 : dir < 0 ? -250 : 0,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 350, damping: 32 },
        opacity: { duration: 0.15 }
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -250 : dir < 0 ? 250 : 0,
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: 'spring', stiffness: 350, damping: 32 },
        opacity: { duration: 0.15 }
      }
    })
  } as any;

  const catCls = activeCard ? (CATEGORY_COLORS[activeCard.category] || DEFAULT_CAT_CLS) : DEFAULT_CAT_CLS;
  const impConf = activeCard ? IMPORTANCE_CONFIG[activeCard.importance] : IMPORTANCE_CONFIG.Medium;
  const progressPct = filteredCards.length > 0 ? ((currentIndex + 1) / filteredCards.length) * 100 : 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-55 dark:bg-slate-950">

      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-805">
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <button
            onClick={() => navigate('flashcards-landing')}
            className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer active:scale-95 transition-all"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-rose-500">
              {material.toUpperCase()} • Ch {currentChapter?.num}
            </p>
            <p className="text-xs font-black text-slate-700 dark:text-slate-200 max-w-[160px] truncate">
              {currentChapter?.title}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(s => !s)}
              className={`p-2 rounded-xl border cursor-pointer active:scale-95 transition-all ${
                showSearch
                  ? 'bg-rose-55 dark:bg-rose-955/30 border-rose-200 dark:border-rose-800 text-rose-500'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              <Search size={15} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
          <motion.div
            className="h-full bg-rose-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* ── Subbar / Search filter ────────────────────────────────────────── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800"
          >
            <div className="p-3.5 space-y-2.5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 bg-slate-55 dark:bg-slate-805 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-rose-505"
                />
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-655"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              {/* Importance filter chips */}
              <div className="flex gap-1.5 flex-wrap">
                {(['All', 'High', 'Medium', 'Low'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setImportanceFilter(f)}
                    className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                      importanceFilter === f
                        ? 'bg-rose-505 text-white border-rose-505'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-505 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {f === 'High' ? '🔴 High' : f === 'Medium' ? '🟡 Medium' : f === 'Low' ? '🟢 Low' : 'All'}
                  </button>
                ))}
                {(searchQuery || importanceFilter !== 'All') && (
                  <button
                    onClick={() => { setSearchQuery(''); setImportanceFilter('All'); }}
                    className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border bg-red-50 dark:bg-red-955/30 text-red-500 border-red-200 dark:border-red-800 cursor-pointer"
                  >
                    <X size={8} className="inline" /> Clear
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Card Area ─────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 py-4 flex flex-col items-center justify-center overflow-hidden">
        {filteredCards.length === 0 ? (
          <div className="text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xs shadow-sm space-y-3">
            <Filter size={32} className="mx-auto text-slate-300 dark:text-slate-655" />
            <p className="text-xs font-black text-slate-550">No cards match your filter.</p>
            <button
              onClick={() => { setSearchQuery(''); setImportanceFilter('All'); }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-black rounded-xl cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          activeCard && (
            <div
              className="w-full relative overflow-hidden flex items-center justify-center"
              style={{ height: 'min(72svh, 460px)' }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="w-full h-full absolute inset-0 animate-in fade-in duration-200"
                  style={{ perspective: '1200px' }}
                >
                  <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="w-full h-full relative"
                  >
                    {!isFlipped ? (
                      /* ─── FRONT FACE ─────────────────────────────────────── */
                      <div
                        className="w-full h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 flex flex-col select-none relative overflow-hidden"
                      >
                        {/* Invisible Touch Zones */}
                        <div
                          onClick={e => { e.stopPropagation(); goPrev(); }}
                          className="absolute left-0 top-0 bottom-0 w-1/2 z-10 cursor-pointer"
                        />
                        <div
                          onClick={e => { e.stopPropagation(); goNext(); }}
                          className="absolute right-0 top-0 bottom-0 w-1/2 z-10 cursor-pointer"
                        />

                        {/* Top row: category + bookmark */}
                        <div className="flex items-start justify-between gap-2 relative z-20">
                          <div className="flex flex-wrap gap-1.5">
                            {activeCard.category && (
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${catCls}`}>
                                {activeCard.category}
                              </span>
                            )}
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${impConf.cls}`}>
                              {impConf.label}
                            </span>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); toggleBookmark(activeCard.uniqueId); }}
                            className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-300 hover:text-amber-500 active:scale-95 transition-all shrink-0 cursor-pointer"
                          >
                            <Bookmark size={16} className={isBookmarked ? 'fill-amber-500 text-amber-500' : ''} />
                          </button>
                        </div>

                        {/* Context title */}
                        {activeCard.title && (
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-3 relative z-20">
                            {activeCard.title}
                          </p>
                        )}

                        {/* Main point — centred, large */}
                        <div className="flex-1 flex items-center justify-center py-4 relative z-20">
                          <p className="text-base font-extrabold text-slate-800 dark:text-slate-100 leading-relaxed text-center font-sans">
                            {activeCard.point}
                          </p>
                        </div>

                        {/* Tap hint */}
                        <div className="flex flex-col items-center justify-center gap-2 py-2 relative z-20">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleFlip(); }}
                            className="flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-55 hover:bg-slate-100 dark:bg-slate-805 dark:hover:bg-slate-700 border border-slate-205 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer active:scale-95 transition-all animate-pulse"
                          >
                            👆 Tap to reveal details
                          </button>
                          <p className="text-center text-[8px] text-slate-350 dark:text-slate-600 font-bold uppercase tracking-wider">Tap left / right sides to navigate</p>
                        </div>
                      </div>
                    ) : (
                      /* ─── BACK FACE ──────────────────────────────────────── */
                      <div
                        className="w-full h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 flex flex-col select-none overflow-y-auto relative"
                        style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                      >
                        {/* Invisible Touch Zones (horizontally flipped local coordinates to align with screen space) */}
                        <div
                          onClick={e => { e.stopPropagation(); goPrev(); }}
                          className="absolute right-0 top-0 bottom-0 w-1/2 z-10 cursor-pointer"
                        />
                        <div
                          onClick={e => { e.stopPropagation(); goNext(); }}
                          className="absolute left-0 top-0 bottom-0 w-1/2 z-10 cursor-pointer"
                        />

                        {/* Top row */}
                        <div className="flex items-start justify-between gap-2 shrink-0 relative z-20">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-cyan-500">
                              📖 Card Details
                            </p>
                            {activeCard.title && (
                              <p className="text-xs font-black text-slate-700 dark:text-slate-200 mt-0.5">
                                {activeCard.title}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); toggleBookmark(activeCard.uniqueId); }}
                            className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-300 hover:text-amber-500 active:scale-95 transition-all shrink-0 cursor-pointer"
                          >
                            <Bookmark size={16} className={isBookmarked ? 'fill-amber-500 text-amber-500' : ''} />
                          </button>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5 mt-2 shrink-0 relative z-20">
                          {activeCard.category && (
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${catCls}`}>
                              {activeCard.category}
                            </span>
                          )}
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${impConf.cls}`}>
                            {impConf.label}
                          </span>
                        </div>

                        {/* Key Point box */}
                        <div className="mt-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700 shrink-0 relative z-20">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Key Point</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
                            {activeCard.point}
                          </p>
                        </div>

                        {/* Example (if present) */}
                        {activeCard.example && (
                          <div className="mt-3 p-3.5 bg-blue-50 dark:bg-blue-955/30 rounded-2xl border border-blue-100 dark:border-blue-900 shrink-0 relative z-20">
                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-wider mb-1">Example</p>
                            <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 leading-relaxed">
                              {activeCard.example}
                            </p>
                          </div>
                        )}

                        {/* Notes (if present) */}
                        {activeCard.notes && (
                          <div className="mt-3 p-3.5 bg-amber-50 dark:bg-amber-955/20 rounded-2xl border border-amber-100 dark:border-amber-900 shrink-0 relative z-20">
                            <p className="text-[9px] font-black text-amber-505 uppercase tracking-wider mb-1">💡 Memory Tip</p>
                            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 leading-relaxed">
                              {activeCard.notes}
                            </p>
                          </div>
                        )}

                        {/* Tap hint */}
                        <div className="flex flex-col items-center justify-center gap-2 py-2 mt-4 shrink-0 relative z-20">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleFlip(); }}
                            className="flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-55 hover:bg-slate-100 dark:bg-slate-805 dark:hover:bg-slate-700 border border-slate-205 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer active:scale-95 transition-all"
                          >
                            👈 Tap to show front
                          </button>
                          <p className="text-center text-[8px] text-slate-355 dark:text-slate-655 font-bold uppercase tracking-wider">Tap left / right sides to navigate</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>
          )
        )}
      </div>

      {/* ── Bottom Controls ────────────────────────────────────────────────── */}
      <div className="px-4 pb-6 pt-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 safe-padding-bottom">
        {/* Quick Revision indicator */}
        {quickRevision && (
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Zap size={11} className="text-rose-500 animate-pulse" />
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">
              Quick Revision Active — Auto flipping...
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {/* Prev */}
          <button
            onClick={goPrev}
            disabled={currentIndex === 0 || filteredCards.length === 0}
            className={`py-4 rounded-2xl border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 min-h-[52px] transition-all cursor-pointer active:scale-95 ${
              currentIndex === 0 || filteredCards.length === 0
                ? 'border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700 opacity-50 cursor-not-allowed'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <ChevronLeft size={18} /> Prev
          </button>

          {/* Flip */}
          <button
            onClick={handleFlip}
            className="py-4 rounded-2xl bg-gradient-to-b from-rose-500 to-pink-600 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 min-h-[52px] shadow-lg shadow-rose-500/30 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw size={16} /> Flip
          </button>

          {/* Next */}
          <button
            onClick={goNext}
            disabled={currentIndex === filteredCards.length - 1 || filteredCards.length === 0}
            className={`py-4 rounded-2xl border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 min-h-[52px] transition-all cursor-pointer active:scale-95 ${
              currentIndex === filteredCards.length - 1 || filteredCards.length === 0
                ? 'border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700 opacity-50 cursor-not-allowed'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
