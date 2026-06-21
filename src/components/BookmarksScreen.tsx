import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bookmark } from 'lucide-react';
import { getChaptersByMaterial } from '../utils/chapters';

export const BookmarksScreen: React.FC = () => {
  const {
    questions,
    progress,
    toggleBookmark,
  } = useApp();

  const [selectedMaterial, setSelectedMaterial] = useState<'all' | 'ica' | 'gpoe'>('all');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');

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

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 space-y-6">
      {/* Bookmarks header */}
      <div className="bg-gradient-to-br from-amber-500 to-amber-700 dark:from-amber-950/40 dark:to-slate-900/60 rounded-3xl p-5 text-white shadow-premium relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
          <Bookmark size={150} />
        </div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-100 opacity-90">Study List</h2>
        <p className="text-3xl font-extrabold font-sans mt-1">Bookmarked</p>
        <p className="text-xs text-amber-100 opacity-95 mt-2">
          Save difficult questions during revision to quickly access and review them later.
        </p>
      </div>

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
              className="w-full h-12 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-amber-500 cursor-pointer"
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
          Bookmarks ({filteredQuestions.length})
        </h3>
        {filteredQuestions.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3 bg-white dark:bg-slate-900/50">
            <div className="mx-auto w-12 h-12 bg-amber-50 dark:bg-amber-950/20 rounded-full flex items-center justify-center text-amber-500">
              <Bookmark size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 font-sans uppercase">No Bookmarks Yet</h4>
              <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider">JO Sphere</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none pt-0.5">Learn • Revise • Succeed</p>
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
                      className="p-1 rounded-lg text-amber-500 active:scale-90 transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
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
                    <p className="text-xs font-semibold leading-normal">
                      <span className="text-slate-400 font-medium">A)</span> {q.option_a}
                    </p>
                    <p className="text-xs font-semibold leading-normal">
                      <span className="text-slate-400 font-medium">B)</span> {q.option_b}
                    </p>
                    <p className="text-xs font-semibold leading-normal">
                      <span className="text-slate-400 font-medium">C)</span> {q.option_c}
                    </p>
                    <p className="text-xs font-semibold leading-normal">
                      <span className="text-slate-400 font-medium">D)</span> {q.option_d}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 text-xs space-y-1.5 border-l-2 border-amber-500 font-semibold text-slate-700 dark:text-slate-300">
                    <p className="flex items-center gap-1.5">
                      <span className="text-slate-400">Correct Answer:</span>
                      <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-lg font-bold">
                        {q.correct_answer}
                      </span>
                    </p>
                    {q.explanation && (
                      <p className="text-slate-600 dark:text-slate-400 leading-normal font-medium">
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
    </div>
  );
};