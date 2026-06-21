import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getChaptersByMaterial } from '../utils/chapters';
import { ChevronRight, Search } from 'lucide-react';

export const ChapterSelectionScreen: React.FC = () => {
  const {
    questions,
    activeMaterial,
    setActiveMaterial,
    progress,
    navigate,
    setActiveChapterId,
    setStudyQuestionIndex,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  // Fallback to 'ica' if no material is active
  const material = activeMaterial || 'ica';

  const handleSelectChapter = (chapterId: string) => {
    setActiveChapterId(chapterId);
    if (
      progress.continueLearning &&
      progress.continueLearning.material === material &&
      progress.continueLearning.chapterId === chapterId &&
      progress.continueLearning.mode === 'study'
    ) {
      setStudyQuestionIndex(progress.continueLearning.questionIndex);
    } else {
      setStudyQuestionIndex(0);
    }
    navigate('study');
  };

  const chapters = getChaptersByMaterial(material);
  const filteredChapters = searchQuery
    ? chapters.filter(
        ch =>
          ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ch.num.toString().includes(searchQuery.toLowerCase())
      )
    : chapters;

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 space-y-5 bg-transparent">
      {/* Search Bar */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3 min-h-[52px]">
        <Search size={18} className="text-slate-400 dark:text-slate-500 shrink-0" />
        <input
          type="text"
          placeholder="Search chapters or concepts..."
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
              ? 'bg-cyan-600 dark:bg-cyan-600 text-white border-transparent shadow-md'
              : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="text-base">📘</span> ICA (16 Chapters)
        </button>
        <button
          onClick={() => setActiveMaterial('gpoe')}
          className={`flex items-center justify-center gap-2 h-14 rounded-2xl transition-all duration-200 font-extrabold cursor-pointer border ${
            material === 'gpoe'
              ? 'bg-cyan-600 dark:bg-cyan-600 text-white border-transparent shadow-md'
              : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="text-base">📗</span> GPOE (8 Chapters)
        </button>
      </div>

      {/* Chapters list */}
      <div className="space-y-3.5">
        {filteredChapters.map((ch) => {
          const chQuestions = questions.filter(
            q => q.material === material && q.chapterId === ch.id
          );
          const totalQuestions = chQuestions.length;
          const attemptedCount = chQuestions.filter(q => progress.attempts[q.uniqueId] !== undefined).length;
          const correctCount = chQuestions.filter(q => progress.attempts[q.uniqueId]?.correct).length;

          const progressPercent = totalQuestions > 0 ? Math.round((attemptedCount / totalQuestions) * 100) : 0;
          const accuracyPercent = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

          const isContinue = progress.continueLearning?.material === material && 
                             progress.continueLearning?.chapterId === ch.id && 
                             progress.continueLearning?.mode === 'study';

          let borderClass = 'border-slate-200 dark:border-slate-800';
          let badgeClass = 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
          let statusText = 'Not Started';

          if (attemptedCount > 0) {
            if (accuracyPercent >= 85) {
              borderClass = 'border-emerald-500 dark:border-emerald-500 border-l-4';
              badgeClass = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400';
              statusText = 'Strong';
            } else if (accuracyPercent >= 70) {
              borderClass = 'border-amber-500 dark:border-amber-500 border-l-4';
              badgeClass = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400';
              statusText = 'Moderate';
            } else {
              borderClass = 'border-rose-500 dark:border-rose-500 border-l-4';
              badgeClass = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400';
              statusText = 'Weak';
            }
          }

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
                  <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${badgeClass}`}>
                    {statusText}
                  </span>
                  {isContinue && (
                    <span className="text-[9px] font-extrabold bg-amber-500 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse shrink-0">
                      ⏱ Continue
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2">
                  {ch.title}
                </h3>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 pt-1">
                  <span>
                    Progress: {progressPercent}% ({attemptedCount}/{totalQuestions} questions)
                  </span>
                  {attemptedCount > 0 && (
                    <span className="font-extrabold text-slate-700 dark:text-slate-300">
                      Accuracy: {accuracyPercent}%
                    </span>
                  )}
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-600 dark:bg-cyan-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
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