import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GPOE_CHAPTERS, ICA_CHAPTERS, getChaptersByMaterial } from '../utils/chapters';
import {
  Search,
  BookOpen,
  FileText,
  Sliders,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export const LearnScreen: React.FC = () => {
  const { navigate, setActiveMaterial, setActiveChapterId, setStudyQuestionIndex, questions } = useApp();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const startFlashcards = (mat: 'ica' | 'gpoe', chId: string) => {
    setActiveMaterial(mat);
    setActiveChapterId(chId);
    navigate('flashcards-viewer');
  };

  const startRevision = (mat: 'ica' | 'gpoe', chId: string) => {
    setActiveMaterial(mat);
    setActiveChapterId(chId);
    setStudyQuestionIndex(0);
    navigate('study');
  };

  // Filtered chapters or questions search list
  const chaptersPool = [...ICA_CHAPTERS, ...GPOE_CHAPTERS];
  const filteredChapters = searchQuery
    ? chaptersPool.filter(
        ch =>
          ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ch.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredQuestions = searchQuery
    ? questions.filter(
        q =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.explanation.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10) // Limit to top 10 question results to avoid screen overflow
    : [];

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 space-y-6 bg-transparent">
      {/* Tab Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xs font-black uppercase text-cyan-600 dark:text-cyan-400 tracking-wider">JO Sphere Learning Hub</h2>
          <p className="text-2xl font-black text-slate-800 dark:text-white font-sans mt-0.5">Choose Mode</p>
        </div>
        <button
          onClick={() => navigate('study-library')}
          className="flex items-center gap-1.5 text-xs uppercase font-extrabold tracking-wider bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 active:scale-95 transition-all cursor-pointer min-h-[44px]"
        >
          <FileText size={14} /> Open Library <ArrowRight size={10} />
        </button>
      </div>

      {/* Global Search Bar */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3 min-h-[52px]">
        <Search size={18} className="text-slate-400 dark:text-slate-500 shrink-0" />
        <input
          type="text"
          placeholder="Search chapters, concepts, questions, or flash cards..."
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

      {/* Search results overlay mapping if searching */}
      {searchQuery && (
        <div className="space-y-4 animate-fade-in">
          {filteredChapters.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-405 dark:text-slate-500">Chapters Found ({filteredChapters.length})</h3>
              <div className="space-y-2">
                {filteredChapters.map(ch => (
                  <div
                    key={`${ch.material}_${ch.id}`}
                    className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs font-semibold gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-black uppercase tracking-wider">{ch.material}</span>
                      <p className="text-slate-900 dark:text-white mt-1.5 font-extrabold leading-snug">Ch {ch.num}: {ch.title}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => startFlashcards(ch.material, ch.id)}
                        className="h-10 px-3.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-black rounded-xl border border-rose-150 dark:border-rose-900/60 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                      >
                        Cards
                      </button>
                      <button
                        onClick={() => startRevision(ch.material, ch.id)}
                        className="h-10 px-3.5 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/30 dark:hover:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 text-xs font-black rounded-xl border border-cyan-150 dark:border-cyan-900/60 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                      >
                        Practice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredQuestions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-405 dark:text-slate-500">Questions Found ({filteredQuestions.length})</h3>
              <div className="space-y-2.5">
                {filteredQuestions.map(q => {
                  const ch = getChaptersByMaterial(q.material).find(c => c.id === q.chapterId);
                  return (
                    <div
                      key={q.uniqueId}
                      onClick={() => startRevision(q.material, q.chapterId)}
                      className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-2 cursor-pointer hover:border-cyan-500 dark:hover:border-cyan-500 active:scale-[0.99] transition-all"
                    >
                      <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">
                        <span>{q.material.toUpperCase()} • Ch {ch?.num}</span>
                        <span className="text-cyan-600 dark:text-cyan-400">Start Chapter MCQ <ChevronRight size={10} className="inline ml-0.5" /></span>
                      </div>
                      <p className="text-xs font-bold text-slate-850 dark:text-slate-200 leading-normal line-clamp-2">{q.question}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredChapters.length === 0 && filteredQuestions.length === 0 && (
            <div className="text-center p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 dark:text-slate-500 font-semibold text-xs">
              No matching chapters or questions found.
            </div>
          )}
        </div>
      )}

      {/* Main Options: Learning Mode Selection */}
      {!searchQuery && (
        <div className="flex flex-col gap-5 pt-2">
          {/* Revision Card */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium space-y-4 hover:border-cyan-500/30 dark:hover:border-cyan-400/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                <Sliders size={26} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  🔄 Revision Mode
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  Practice Questions • Explanations • Active Recall
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
              Answer multiple-choice questions with instant correct/incorrect visual feedback and detailed explanations to reinforce understanding.
            </p>
            <button
              onClick={() => navigate('chapter-select')}
              className="w-full flex items-center justify-center gap-2 h-14 bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white font-extrabold rounded-2xl shadow-md active:scale-95 transition-all cursor-pointer text-xs uppercase tracking-wider"
            >
              Open Revision Mode <ArrowRight size={16} />
            </button>
          </div>

          {/* Flash Cards Card */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-premium space-y-4 hover:border-rose-500/30 dark:hover:border-rose-400/30 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
                <BookOpen size={26} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  📖 Flash Cards
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  Important Points • Key Facts • Quick Revision
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
              Study key concepts, definitions, formulas, and critical summaries using interactive memory-reinforcing flashcards with auto-flip options.
            </p>
            <button
              onClick={() => navigate('flashcards-landing')}
              className="w-full flex items-center justify-center gap-2 h-14 bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700 text-white font-extrabold rounded-2xl shadow-md active:scale-95 transition-all cursor-pointer text-xs uppercase tracking-wider"
            >
              Open Flash Cards <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

