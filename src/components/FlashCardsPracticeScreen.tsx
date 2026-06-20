import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { loadChapterFlashCards } from '../utils/csvLoader';
import type { FlashCard } from '../utils/csvLoader';
import { getChaptersByMaterial } from '../utils/chapters';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Search,
  BookOpen,
  X,
  Sparkles,
  Info
} from 'lucide-react';

export const FlashCardsPracticeScreen: React.FC = () => {
  const {
    activeMaterial,
    activeChapterId,
    questions,
    progress,
    toggleBookmark,
    navigate,
    updateContinueLearning,
    addRecentActivity
  } = useApp();

  const [cards, setCards] = useState<FlashCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const material = activeMaterial || 'ica';
  const chapterId = activeChapterId || 'chapter01';

  const currentChapter = getChaptersByMaterial(material).find(c => c.id === chapterId);
  const chapterQuestions = questions.filter(
    q => q.material === material && q.chapterId === chapterId
  );

  // Load CSV flashcards on mount, fallback dynamically to chapter question bank questions
  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      try {
        if (currentChapter) {
          const loaded = await loadChapterFlashCards(
            material,
            currentChapter.fileName,
            chapterId,
            chapterQuestions
          );
          setCards(loaded);
          
          // Restore progress if the continue learning state points here
          if (
            progress.continueLearning &&
            progress.continueLearning.material === material &&
            progress.continueLearning.chapterId === chapterId &&
            progress.continueLearning.mode === 'flashcard'
          ) {
            const savedIndex = progress.continueLearning.questionIndex;
            if (savedIndex >= 0 && savedIndex < loaded.length) {
              setCurrentIndex(savedIndex);
            }
          } else {
            setCurrentIndex(0);
          }
        }
      } catch (err) {
        console.error('Failed to load flashcards:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();

    if (currentChapter) {
      addRecentActivity(
        'study',
        material,
        `Started Flashcards: Ch ${currentChapter.num}`,
        currentChapter.title,
        chapterId
      );
    }
  }, [material, chapterId]);

  // Save learning progress on index change
  useEffect(() => {
    if (cards.length > 0 && currentIndex < cards.length) {
      updateContinueLearning(material, chapterId, currentIndex, 'flashcard');
    }
  }, [currentIndex, cards]);

  const handleNextCard = () => {
    setIsFlipped(false);
    if (filteredCards.length > 0) {
      setCurrentIndex(prev => (prev < filteredCards.length - 1 ? prev + 1 : prev));
    }
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    if (filteredCards.length > 0) {
      setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
    }
  };

  const handleExit = () => {
    navigate('learn');
  };

  const filteredCards = cards.filter(
    c =>
      c.point.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.explanation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Safeguard: Clamp current index if search filters change count
  useEffect(() => {
    setIsFlipped(false);
    if (currentIndex >= filteredCards.length && filteredCards.length > 0) {
      setCurrentIndex(filteredCards.length - 1);
    }
  }, [searchQuery, filteredCards.length]);

  const activeCard = filteredCards[currentIndex];
  const isBookmarked = activeCard ? progress.bookmarks.includes(activeCard.uniqueId) : false;

  // Swiping thresholds for Framer Motion drag gestures
  const swipeThreshold = 50;
  const onDragEnd = (_event: any, info: any) => {
    if (info.offset.x < -swipeThreshold) {
      handleNextCard();
    } else if (info.offset.x > swipeThreshold) {
      handlePrevCard();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600"></div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-350 mt-4">Loading Flash Cards...</p>
        <p className="text-xs text-slate-400 mt-1">Fetching summaries for offline review.</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950 space-y-4">
        <X className="text-rose-500 h-12 w-12" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No Content Available</h3>
        <p className="text-xs text-slate-450 dark:text-slate-550 max-w-xs">
          There are no cards or question backups loaded for this chapter yet.
        </p>
        <button
          onClick={handleExit}
          className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase rounded-xl"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden pb-6 safe-padding-bottom bg-slate-50 dark:bg-slate-950/40">
      {/* Top Header */}
      <div>
        <div className="px-4 pt-3 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <button
            onClick={handleExit}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer font-extrabold"
          >
            <ArrowLeft size={14} /> Exit Learn
          </button>
          <span className="truncate max-w-[200px] font-black uppercase text-rose-500">
            Ch {currentChapter?.num}: Flashcards
          </span>
          <span className="font-bold text-slate-400">
            {filteredCards.length > 0 ? `${currentIndex + 1} of ${filteredCards.length}` : '0 of 0'}
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-850 h-1 mt-1">
          <div
            className="bg-rose-500 h-full transition-all duration-200"
            style={{
              width: `${
                filteredCards.length > 0 ? ((currentIndex + 1) / filteredCards.length) * 100 : 0
              }%`
            }}
          />
        </div>
      </div>

      {/* Search Filter Header */}
      <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
        <Search size={14} className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search facts and concepts in this chapter..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none placeholder-slate-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="p-1 text-slate-400 hover:text-slate-655"
            title="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Main Flashcard Interaction Space */}
      <div className="flex-1 px-4 py-4 overflow-y-auto flex items-center justify-center">
        {filteredCards.length === 0 ? (
          <div className="text-center p-8 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-3xl space-y-2 max-w-xs shadow-sm">
            <Search size={28} className="mx-auto text-slate-300 dark:text-slate-700" />
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-350 uppercase">No Search Matches</h4>
            <p className="text-[10px] text-slate-400 leading-normal">
              Try typing a different fact, concept keyword, or chapter reference.
            </p>
          </div>
        ) : (
          <div className="w-full perspective-1000 min-h-[320px] h-[75svh] max-h-[460px] relative">
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={onDragEnd}
              className={`w-full h-full duration-550 preserve-3d relative rounded-3xl shadow-premium cursor-grab active:cursor-grabbing ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front Face: The Point */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between overflow-y-auto select-none">
                <div className="flex justify-between items-start text-xs text-rose-500 font-extrabold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Sparkles size={14} /> Key Point
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(activeCard.uniqueId);
                    }}
                    className="p-1 rounded-xl text-slate-400 hover:text-amber-500 active:scale-95 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-850"
                    title="Bookmark Card"
                  >
                    <Bookmark size={18} className={isBookmarked ? 'fill-amber-500 text-amber-500' : ''} />
                  </button>
                </div>

                <div
                  onClick={() => setIsFlipped(true)}
                  className="flex-1 flex flex-col items-center justify-center text-center px-2 py-4 cursor-pointer"
                >
                  <p className="text-base font-extrabold text-slate-850 dark:text-slate-100 leading-relaxed font-sans">
                    {activeCard.point}
                  </p>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black mt-6 flex items-center gap-1 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-full border border-slate-100 dark:border-slate-850 animate-pulse">
                    <Info size={10} /> Tap Card to Flip
                  </span>
                </div>

                <div className="text-center text-[10px] text-slate-400 font-medium select-none">
                  Swipe Left/Right to Navigate
                </div>
              </div>

              {/* Back Face: Explanation */}
              <div
                onClick={() => setIsFlipped(false)}
                className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl border border-transparent bg-white dark:bg-slate-900 p-6 flex flex-col justify-between overflow-y-auto shadow-2xl select-none"
              >
                <div className="flex justify-between items-start text-xs text-cyan-600 dark:text-cyan-400 font-extrabold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <BookOpen size={14} /> Fact Explanation
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(activeCard.uniqueId);
                    }}
                    className="p-1 rounded-xl text-slate-400 hover:text-amber-500 active:scale-95 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-850"
                    title="Bookmark Card"
                  >
                    <Bookmark size={18} className={isBookmarked ? 'fill-amber-500 text-amber-500' : ''} />
                  </button>
                </div>

                <div className="flex-1 py-4 flex flex-col justify-center cursor-pointer">
                  <p className="text-xs leading-relaxed font-semibold text-slate-750 dark:text-slate-300 font-sans whitespace-pre-line text-left">
                    {activeCard.explanation}
                  </p>
                </div>

                <div className="text-center text-[9px] text-slate-400 uppercase tracking-widest font-black select-none">
                  Tap to see fact prompt
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </div>

      {/* Prev / Next controls */}
      <footer className="px-4 grid grid-cols-2 gap-4 select-none">
        <button
          onClick={handlePrevCard}
          disabled={currentIndex === 0 || filteredCards.length === 0}
          className={`py-3.5 rounded-2xl border text-center font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 min-h-[48px] ${
            currentIndex === 0 || filteredCards.length === 0
              ? 'border-slate-200 dark:border-slate-850 text-slate-300 dark:text-slate-750 cursor-not-allowed opacity-50'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer active:scale-95 transition-all'
          }`}
        >
          <ChevronLeft size={16} /> Prev Fact
        </button>
        <button
          onClick={handleNextCard}
          disabled={currentIndex === filteredCards.length - 1 || filteredCards.length === 0}
          className={`py-3.5 rounded-2xl border text-center font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 min-h-[48px] ${
            currentIndex === filteredCards.length - 1 || filteredCards.length === 0
              ? 'border-slate-200 dark:border-slate-850 text-slate-300 dark:text-slate-750 cursor-not-allowed opacity-50'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer active:scale-95 transition-all'
          }`}
        >
          Next Fact <ChevronRight size={16} />
        </button>
      </footer>
    </div>
  );
};
