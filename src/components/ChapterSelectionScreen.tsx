import React from 'react';
import { useApp } from '../context/AppContext';
import { getChaptersByMaterial } from '../utils/chapters';
import { BookOpen, ChevronRight } from 'lucide-react';

export const ChapterSelectionScreen: React.FC = () => {
  const {
    questions,
    activeMaterial,
    progress,
    navigate,
    setActiveChapterId,
    setStudyQuestionIndex,
  } = useApp();

  if (!activeMaterial) return null;

  const chapters = getChaptersByMaterial(activeMaterial);

  const handleSelectChapter = (chapterId: string) => {
    setActiveChapterId(chapterId);
    if (
      progress.continueLearning &&
      progress.continueLearning.material === activeMaterial &&
      progress.continueLearning.chapterId === chapterId
    ) {
      setStudyQuestionIndex(progress.continueLearning.questionIndex);
    } else {
      setStudyQuestionIndex(0);
    }
    navigate('study');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 space-y-4">
      {/* Chapter header */}
      <div className="p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {activeMaterial.toUpperCase()} Exam Revision
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select a chapter card below to begin flashcard study
          </p>
        </div>
        <div className="p-2.5 bg-cyan-600 text-white rounded-xl">
          <BookOpen size={20} />
        </div>
      </div>

      {/* Chapters list */}
      <div className="space-y-3">
        {chapters.map((ch) => {
          const chQuestions = questions.filter(
            q => q.material === activeMaterial && q.chapterId === ch.id
          );
          const totalQuestions = chQuestions.length;
          const attemptedCount = chQuestions.filter(q => progress.attempts[q.uniqueId] !== undefined).length;
          const correctCount = chQuestions.filter(q => progress.attempts[q.uniqueId]?.correct).length;

          const progressPercent = totalQuestions > 0 ? Math.round((attemptedCount / totalQuestions) * 100) : 0;
          const accuracyPercent = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

          let borderClass = 'border-slate-200 dark:border-slate-800';
          let badgeClass = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
          let statusText = 'Not Started';

          if (attemptedCount > 0) {
            if (accuracyPercent >= 85) {
              borderClass = 'border-emerald-500 dark:border-emerald-950/70 border-l-4';
              badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400';
              statusText = 'Strong';
            } else if (accuracyPercent >= 70) {
              borderClass = 'border-amber-500 dark:border-amber-950/70 border-l-4';
              badgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
              statusText = 'Moderate';
            } else {
              borderClass = 'border-rose-500 dark:border-rose-950/70 border-l-4';
              badgeClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400';
              statusText = 'Weak';
            }
          }

          return (
            <button
              key={ch.id}
              onClick={() => handleSelectChapter(ch.id)}
              className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between text-left shadow-premium hover:shadow-premium-hover active:scale-[0.99] transition-all cursor-pointer ${borderClass}`}
            >
              <div className="flex-1 pr-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    Chapter {ch.num}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeClass}`}>
                    {statusText}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1 line-clamp-2">
                  {ch.title}
                </h3>
                <div className="mt-3.5 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span>
                    Progress: {progressPercent}% ({attemptedCount}/{totalQuestions})
                  </span>
                  {attemptedCount > 0 && (
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Accuracy: {accuracyPercent}%
                    </span>
                  )}
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-cyan-600 dark:bg-cyan-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-400 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};