import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, X, Bookmark } from 'lucide-react';
import { getChaptersByMaterial } from '../utils/chapters';

export const SearchScreen: React.FC = () => {
  const {
    questions,
    progress,
    toggleBookmark,
  } = useApp();

  const [query, setQuery] = useState('');
  const [searchMaterial, setSearchMaterial] = useState<'all' | 'ica' | 'gpoe'>('all');

  const handleClear = () => {
    setQuery('');
  };

  // Perform search locally
  const getSearchResults = () => {
    if (!query.trim()) return [];
    
    const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (searchTerms.length === 0) return [];

    let pool = questions;
    if (searchMaterial !== 'all') {
      pool = questions.filter(q => q.material === searchMaterial);
    }

    return pool.filter((q) => {
      const matchText = `
        ${q.question}
        ${q.option_a}
        ${q.option_b}
        ${q.option_c}
        ${q.option_d}
        ${q.explanation}
      `.toLowerCase();

      // Ensure all terms match (AND search)
      return searchTerms.every(term => matchText.includes(term));
    });
  };

  const results = getSearchResults();
  const limitedResults = results.slice(0, 50); // Limit to top 50 for performance

  return (
    <div className="flex-1 flex flex-col overflow-hidden pb-16">
      
      {/* Search Header Container */}
      <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3.5 shrink-0 transition-colors duration-200">
        
        {/* Search bar input wrapper */}
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400 dark:text-slate-500">
            <Search size={18} />
          </span>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Chapters, Concepts, Questions, Flash Cards..."
            className="w-full h-13 pl-10 pr-10 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-2xl text-sm font-semibold outline-none focus:border-cyan-600 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-500 transition-all shadow-inner"
            aria-label="Search questions"
          />
          
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3.5 p-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center"
              aria-label="Clear search query"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Material Selection Tabs */}
        <div className="flex gap-2">
          {(['all', 'ica', 'gpoe'] as const).map((mat) => (
            <button
              key={mat}
              onClick={() => setSearchMaterial(mat)}
              className={`h-12 px-4 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer flex items-center justify-center ${
                searchMaterial === mat
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {mat === 'all' ? 'All Materials' : mat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Results Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {query.trim() ? (
          limitedResults.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-600 space-y-2 mt-8">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-400">No results found</h4>
              <p className="text-xs">
                We couldn't find any questions matching "{query}". Try checking spelling or using broader keywords.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              <div className="text-xs font-semibold text-slate-400 px-1">
                Showing {limitedResults.length} of {results.length} matches
              </div>

              {limitedResults.map((q) => {
                const ch = getChaptersByMaterial(q.material).find(c => c.id === q.chapterId);
                const isBookmarked = progress.bookmarks.includes(q.uniqueId);

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
                        className="p-1 rounded-lg text-slate-400 hover:text-amber-500 active:scale-90 transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title="Bookmark question"
                        aria-label="Bookmark"
                      >
                        {isBookmarked ? (
                          <Bookmark size={20} className="text-amber-500 fill-amber-500" />
                        ) : (
                          <Bookmark size={20} />
                        )}
                      </button>
                    </div>

                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                      {q.question}
                    </p>

                    <div className="space-y-1 pt-1">
                      <p className="text-xs font-medium leading-normal text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400 font-extrabold">A)</span> {q.option_a}
                      </p>
                      <p className="text-xs font-medium leading-normal text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400 font-extrabold">B)</span> {q.option_b}
                      </p>
                      <p className="text-xs font-medium leading-normal text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400 font-extrabold">C)</span> {q.option_c}
                      </p>
                      <p className="text-xs font-medium leading-normal text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400 font-extrabold">D)</span> {q.option_d}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 text-xs space-y-1.5 border-l-2 border-cyan-600 font-semibold">
                      <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400">Correct Option:</span>
                        <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-lg font-extrabold">
                          {q.correct_answer}
                        </span>
                      </p>
                      {q.explanation && (
                        <p className="text-slate-600 dark:text-slate-400 leading-normal font-medium">
                          <strong className="text-[9px] uppercase tracking-wider block opacity-75 mt-1">Explanation:</strong>
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="p-8 text-center text-slate-400 dark:text-slate-600 space-y-2 mt-8">
            <div className="mx-auto w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center">
              <Search size={22} />
            </div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-400 font-sans">Search Question Bank</h4>
            <p className="text-xs">
              Type search terms above to query questions, choices, or detailed explanations instantly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};