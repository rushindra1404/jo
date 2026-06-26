import React from 'react';
import { useApp } from '../context/AppContext';
import { Bookmark, AlertTriangle, Award, BookOpen, Play, ChevronRight, FileText } from 'lucide-react';
import { getChaptersByMaterial } from '../utils/chapters';

export const HomeScreen: React.FC = () => {
  const {
    questions,
    progress,
    navigate,
    setActiveMaterial,
    setStudyQuestionIndex,
    setActiveChapterId,
    startRandomRevision,
  } = useApp();

  const totalQuestions = questions.length || 3750;
  const attemptedQuestions = Object.keys(progress.attempts).length;
  const correctQuestions = Object.values(progress.attempts).filter(a => a.correct).length;
  const overallAccuracy = attemptedQuestions > 0 
    ? Math.round((correctQuestions / attemptedQuestions) * 100) 
    : 0;

  const selectMaterial = (material: 'ica' | 'gpoe') => {
    setActiveMaterial(material);
    navigate('chapter-select');
  };

  const handleContinueLearning = () => {
    if (progress.continueLearning) {
      const { material, chapterId, questionIndex } = progress.continueLearning;
      setActiveMaterial(material);
      setActiveChapterId(chapterId);
      setStudyQuestionIndex(questionIndex);
      navigate('study');
    } else {
      setActiveMaterial('gpoe');
      setActiveChapterId('chapter01');
      setStudyQuestionIndex(0);
      navigate('study');
    }
  };

  const [now] = React.useState(() => Date.now());

  const formatTimeAgo = (timestamp: number) => {
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return hours < 24 
      ? `${hours}h ago` 
      : new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getActivityIcon = (type: 'study' | 'exam' | 'mistake' | 'bookmark' | 'library') => {
    switch (type) {
      case 'bookmark':
        return <Bookmark size={16} className="text-amber-500" />;
      case 'mistake':
        return <AlertTriangle size={16} className="text-rose-500" />;
      case 'exam':
        return <Award size={16} className="text-emerald-500" />;
      case 'library':
        return <FileText size={16} className="text-cyan-500" />;
      default:
        return <BookOpen size={16} className="text-cyan-500" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 space-y-6">
      {/* Overall Progress Banner */}
      <section className="bg-gradient-to-br from-cyan-600 to-teal-700 dark:from-cyan-950/40 dark:to-slate-900/60 rounded-3xl p-5 text-white shadow-premium relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
          <Award size={180} />
        </div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-cyan-100 opacity-90">
          Overall revision progress
        </h2>
        <p className="text-3xl font-extrabold font-sans mt-1">
          Promotion Ready
        </p>
        <div className="grid grid-cols-3 gap-2 mt-5 text-center bg-white/10 dark:bg-slate-800/20 backdrop-blur-sm rounded-2xl p-3">
          <div>
            <span className="block text-xl font-bold font-sans">{attemptedQuestions}</span>
            <span className="text-[10px] text-cyan-100 uppercase tracking-wider font-medium">Attempted</span>
          </div>
          <div className="border-x border-white/10">
            <span className="block text-xl font-bold font-sans">{overallAccuracy}%</span>
            <span className="text-[10px] text-cyan-100 uppercase tracking-wider font-medium">Accuracy</span>
          </div>
          <div>
            <span className="block text-xl font-bold font-sans">{totalQuestions}</span>
            <span className="text-[10px] text-cyan-100 uppercase tracking-wider font-medium">Bank size</span>
          </div>
        </div>
      </section>

      {/* Resume Session Widget */}
      <section>
        <button
          onClick={handleContinueLearning}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium hover:shadow-premium-hover active:scale-[0.98] transition-all duration-150 cursor-pointer text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-xl">
              <Play size={20} fill="currentColor" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                {progress.continueLearning ? 'Resume active revision' : 'Start learning'}
              </p>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {progress.continueLearning
                  ? `${progress.continueLearning.material.toUpperCase()} Chapter ${
                      getChaptersByMaterial(progress.continueLearning.material).find(
                        c => c.id === progress.continueLearning?.chapterId
                      )?.num || 1
                    }`
                  : 'Begin GPOE Chapter 1'}
              </h3>
            </div>
          </div>
          <ChevronRight size={20} className="text-slate-400" />
        </button>
      </section>

      {/* Study Materials Cards */}
      <section className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
          Study Materials
        </h2>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => selectMaterial('ica')}
            className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium active:scale-[0.99] transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">ICA revision</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  16 Study Chapters • Core concepts
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-400" />
          </button>

          <button
            onClick={() => selectMaterial('gpoe')}
            className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium active:scale-[0.99] transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <BookOpen size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">GPOE revision</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  9 Technical Chapters • Systems & tools
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-400" />
          </button>
        </div>
      </section>

      {/* Random Practice Mix Banner */}
      <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 dark:from-indigo-950/40 dark:to-slate-900/60 rounded-3xl p-5 text-white shadow-premium">
        <h3 className="text-lg font-bold text-white">Random practice mix</h3>
        <p className="text-xs text-indigo-100 dark:text-slate-300 mt-1">
          Test your memory with shuffled questions compiled from the bank.
        </p>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            onClick={() => startRandomRevision('ica')}
            className="py-2.5 px-2 bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-bold rounded-xl text-center cursor-pointer font-sans"
          >
            ICA Mix
          </button>
          <button
            onClick={() => startRandomRevision('gpoe')}
            className="py-2.5 px-2 bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-bold rounded-xl text-center cursor-pointer font-sans"
          >
            GPOE Mix
          </button>
          <button
            onClick={() => startRandomRevision('all')}
            className="py-2.5 px-2 bg-white/20 hover:bg-white/30 active:scale-95 transition-all text-xs font-bold rounded-xl text-center cursor-pointer font-sans"
          >
            Full Mix
          </button>
        </div>
      </section>

      {/* Recent Activity Section */}
      <section className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
          Recent Activity
        </h2>
        {progress.recentActivity.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            No activity logged yet. Start studying to see logs.
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 shadow-premium overflow-hidden">
            {progress.recentActivity.slice(0, 5).map(act => (
              <div key={act.id} className="p-4 flex items-start justify-between gap-3 text-sm">
                <div className="flex gap-3">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl mt-0.5">
                    {getActivityIcon(act.type)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{act.label}</h4>
                    {act.detail && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                        {act.detail}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">{formatTimeAgo(act.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};