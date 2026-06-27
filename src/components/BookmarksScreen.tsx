import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Bookmark, ArrowLeft } from 'lucide-react';
import { getChaptersByMaterial, ICA_CHAPTERS, GPOE_CHAPTERS } from '../utils/chapters';
import { loadChapterFlashCards } from '../utils/csvLoader';
import type { FlashCard } from '../utils/csvLoader';

export const BookmarksScreen: React.FC = () => {
  const {
    questions,
    progress,
    toggleBookmark,
    getShuffledQuestion,
    navigate,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'questions' | 'flashcards'>('questions');
  const [selectedMaterial, setSelectedMaterial] = useState<'all' | 'ica' | 'gpoe'>('all');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');

  // Flashcards state
  const [bookmarkedFlashcards, setBookmarkedFlashcards] = useState<FlashCard[]>([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);

  // Filter bookmarked questions
  const bookmarkedQuestions = questions.filter(q => progress.bookmarks.includes(q.uniqueId));

  const filteredQuestions = bookmarkedQuestions
    .filter(q => selectedMaterial === 'all' ? true : q.material === selectedMaterial)
    .filter(q => selectedChapterId === 'all' ? true : q.chapterId === selectedChapterId);

  const availableChapters = getChaptersByMaterial(selectedMaterial === 'all' ? 'ica' : selectedMaterial)
    .filter(ch => bookmarkedQuestions.some(q => q.material === ch.material && q.chapterId === ch.id));

  const handleMaterialChange = (mat: 'all' | 'ica' | 'gpoe') => {
    setSelectedMaterial(mat);
    setSelectedChapterId('all');
  };

  // Load bookmarked flashcards
  useEffect(() => {
    let cancelled = false;
    const fetchFlashcards = async () => {
      setLoadingFlashcards(true);
      const allBookmarkedIds = progress.bookmarks.filter(id => id.startsWith('fc_'));
      if (allBookmarkedIds.length === 0) {
        setBookmarkedFlashcards([]);
        setLoadingFlashcards(false);
        return;
      }

      const results: FlashCard[] = [];
      const allChapters = [
        ...ICA_CHAPTERS.map(ch => ({ ...ch, material: 'ica' as const })),
        ...GPOE_CHAPTERS.map(ch => ({ ...ch, material: 'gpoe' as const }))
      ];

      for (const ch of allChapters) {
        if (cancelled) break;
        // Optimize: only load CSV if there is a bookmarked flashcard matching this chapter prefix
        const hasBookmarksInChapter = allBookmarkedIds.some(id => id.startsWith(`fc_${ch.material}_${ch.id}_`));
        if (!hasBookmarksInChapter) continue;

        try {
          const cards = await loadChapterFlashCards(ch.material, ch.fileName, ch.id);
          const bookmarkedInChapter = cards.filter(c => allBookmarkedIds.includes(c.uniqueId));
          results.push(...bookmarkedInChapter);
        } catch (e) {
          console.warn('Failed to load flashcards for chapter', ch.id, e);
        }
      }

      if (!cancelled) {
        setBookmarkedFlashcards(results);
        setLoadingFlashcards(false);
      }
    };

    fetchFlashcards();
    return () => { cancelled = true; };
  }, [progress.bookmarks]);

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 space-y-6 bg-transparent">
      {/* Back button */}
      <div className="flex items-center">
        <button
          onClick={() => navigate('more')}
          className="flex items-center gap-1 text-slate-550 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer font-extrabold text-xs"
        >
          <ArrowLeft size={14} /> Back to More
        </button>
      </div>

      {/* Bookmarks header */}
      <div className="bg-gradient-to-br from-amber-500 to-amber-700 dark:from-amber-950/40 dark:to-slate-900/60 rounded-3xl p-5 text-white shadow-premium relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
          <Bookmark size={150} />
        </div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-100 opacity-90">Study List</h2>
        <p className="text-3xl font-extrabold font-sans mt-1">Bookmarked</p>
        <p className="text-xs text-amber-100 opacity-95 mt-2">
          Review saved questions and flashcards during your revision to lock down key concepts.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveTab('questions')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTab === 'questions'
              ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 shadow-sm'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
          }`}
        >
          Questions ({bookmarkedQuestions.length})
        </button>
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTab === 'flashcards'
              ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 shadow-sm'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
          }`}
        >
          Flash Cards ({progress.bookmarks.filter(id => id.startsWith('fc_')).length})
        </button>
      </div>

      {activeTab === 'questions' ? (
        <>
          {/* Filters card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-premium space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {(['all', 'ica', 'gpoe'] as const).map((mat) => (
                <button
                  key={mat}
                  onClick={() => handleMaterialChange(mat)}
                  className={`h-12 px-1 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer flex items-center justify-center ${
                    selectedMaterial === mat
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {mat === 'all' ? 'All' : mat.toUpperCase()}
                </button>
              ))}
            </div>

            {availableChapters.length > 0 && selectedMaterial !== 'all' && (
              <div className="space-y-1">
                <label htmlFor="chapter-filter" className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  Filter by Chapter
                </label>
                <select
                  id="chapter-filter"
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="w-full h-12 px-3 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">All Chapters</option>
                  {availableChapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      Chapter {ch.num}: {ch.title.substring(0, 30)}...
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Bookmarks List */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">
              Bookmarked Questions ({filteredQuestions.length})
            </h3>
            {filteredQuestions.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3 bg-white dark:bg-slate-900/50">
                <div className="mx-auto w-12 h-12 bg-amber-50 dark:bg-amber-955/20 rounded-full flex items-center justify-center text-amber-500">
                  <Bookmark size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-805 dark:text-slate-100 font-sans uppercase">No Bookmarks Yet</h4>
                  <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider">JO Sphere</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {bookmarkedQuestions.length === 0
                    ? 'Start learning and bookmark difficult questions to see them here.'
                    : 'No bookmarks match the active filters.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((q) => {
                  const ch = getChaptersByMaterial(q.material).find(c => c.id === q.chapterId);
                  const shuffled = getShuffledQuestion(q);
                  return (
                    <div
                      key={q.uniqueId}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-premium space-y-3"
                    >
                      <div className="flex justify-between items-start text-xs font-bold">
                        <span className="text-slate-400">
                          {q.material.toUpperCase()} • Chapter {ch?.num}
                        </span>
                        <button
                          onClick={() => toggleBookmark(q.uniqueId)}
                          className="p-1 rounded-lg text-amber-500 active:scale-90 transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center border border-slate-100 dark:border-slate-850"
                          title="Remove bookmark"
                          aria-label="Remove bookmark"
                        >
                          <Bookmark size={20} className="fill-amber-500 text-amber-500" />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                        {q.question}
                      </p>
                      <div className="space-y-1.5 pt-1 text-slate-700 dark:text-slate-300">
                        {shuffled.options.map(opt => (
                          <p key={opt.key} className="text-xs font-semibold leading-normal">
                            <span className="text-slate-400 font-medium">{opt.key})</span> {opt.text}
                          </p>
                        ))}
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 text-xs space-y-1.5 border-l-2 border-amber-500 font-semibold text-slate-700 dark:text-slate-300">
                        <p className="flex items-center gap-1.5">
                          <span className="text-slate-400">Correct Answer:</span>
                          <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450 px-2 py-0.5 rounded-lg font-bold">
                            {shuffled.correctAnswer}
                          </span>
                        </p>
                        {q.explanation && (
                          <p className="text-slate-655 dark:text-slate-400 leading-normal font-medium">
                            <strong className="uppercase text-[9px] tracking-wider block opacity-75 mt-1">Explanation:</strong>
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Flashcards Bookmarks Listing */
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">
            Bookmarked Flash Cards ({bookmarkedFlashcards.length})
          </h3>
          {loadingFlashcards ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mb-3" />
              <p className="text-xs font-black text-slate-600 dark:text-slate-350">Loading Bookmarked Cards...</p>
            </div>
          ) : bookmarkedFlashcards.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3 bg-white dark:bg-slate-900/50">
              <div className="mx-auto w-12 h-12 bg-amber-50 dark:bg-amber-955/20 rounded-full flex items-center justify-center text-amber-500">
                <Bookmark size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-805 dark:text-slate-100 font-sans uppercase">No Flash Cards Bookmarked</h4>
                <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider">JO Sphere</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                Bookmark key summary points while practicing Flash Cards to see them in this folder.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookmarkedFlashcards.map((fc) => {
                const parts = fc.uniqueId.split('_');
                const mat = parts[1];
                const chId = parts[2];
                const ch = getChaptersByMaterial(mat === 'gpoe' ? 'gpoe' : 'ica').find(c => c.id === chId);

                return (
                  <div
                    key={fc.uniqueId}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-3"
                  >
                    {/* Top row: chapter + remove bookmark */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-450 leading-tight">
                          {mat.toUpperCase()} • Ch {ch?.num}
                        </span>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate max-w-[220px] leading-snug">
                          {ch?.title}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleBookmark(fc.uniqueId)}
                        className="p-1 rounded-lg text-amber-500 hover:text-amber-600 active:scale-90 transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center border border-slate-100 dark:border-slate-850"
                        title="Remove bookmark"
                      >
                        <Bookmark size={20} className="fill-amber-500 text-amber-500" />
                      </button>
                    </div>

                    {/* Category & priority chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {fc.category && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                          {fc.category}
                        </span>
                      )}
                      {fc.importance && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900">
                          {fc.importance} Priority
                        </span>
                      )}
                    </div>

                    {/* Title and main content point */}
                    <div className="space-y-1.5 pt-1">
                      {fc.title && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">
                          {fc.title}
                        </p>
                      )}
                      <p className="text-sm font-extrabold text-slate-800 dark:text-slate-150 leading-relaxed font-sans">
                        {fc.point}
                      </p>
                      {fc.explanation && fc.explanation !== fc.point && (
                        <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 text-xs mt-2 border-l-2 border-cyan-500 font-semibold text-slate-700 dark:text-slate-300">
                          <p className="text-slate-600 dark:text-slate-400 leading-normal font-medium">
                            <strong className="uppercase text-[9px] tracking-wider block opacity-75 mb-0.5">Details:</strong>
                            {fc.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};