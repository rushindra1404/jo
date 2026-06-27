import React from 'react';
import { useApp } from '../context/AppContext';
import { getChaptersByMaterial, ICA_CHAPTERS, GPOE_CHAPTERS } from '../utils/chapters';
import { Award, Calendar, Clock, ListChecks, ChevronRight, List, ArrowLeft } from 'lucide-react';
import { WeeklyMonthlyAnalytics } from './WeeklyMonthlyAnalytics';
import { ActivityInsightsCard } from './ActivityInsightsCard';
import { DashboardCharts } from './DashboardCharts';

export const ProgressScreen: React.FC = () => {
  const {
    questions,
    progress,
    navigate,
    setActiveMaterial,
    setActiveChapterId,
    setStudyQuestionIndex,
  } = useApp();

  const totalQuestions = questions.length || 3750;
  const attemptedQuestions = Object.keys(progress.attempts).length;
  const correctQuestions = Object.values(progress.attempts).filter(a => a.correct).length;
  const remainingQuestions = Math.max(0, totalQuestions - attemptedQuestions);
  const overallAccuracy = attemptedQuestions > 0 ? Math.round((correctQuestions / attemptedQuestions) * 100) : 0;

  // Helper to map chapter stats
  const getChapterStats = (material: 'ica' | 'gpoe', chapterId: string, chapterNum: number, chapterTitle: string) => {
    const chQuestions = questions.filter(q => q.material === material && q.chapterId === chapterId);
    const total = chQuestions.length;
    const attempted = chQuestions.filter(q => progress.attempts[q.uniqueId] !== undefined).length;
    const correct = chQuestions.filter(q => progress.attempts[q.uniqueId]?.correct).length;
    const completion = total > 0 ? Math.round((attempted / total) * 100) : 0;

    return {
      id: chapterId,
      num: chapterNum,
      title: chapterTitle,
      material,
      total,
      attempted,
      correct,
      accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
      completion,
    };
  };

  const icaStats = ICA_CHAPTERS.map(ch => getChapterStats('ica', ch.id, ch.num, ch.title));
  const gpoeStats = GPOE_CHAPTERS.map(ch => getChapterStats('gpoe', ch.id, ch.num, ch.title));
  const allStats = [...icaStats, ...gpoeStats];

  const icaTotalQuestions = questions.filter(q => q.material === 'ica').length || 2400;
  const gpoeTotalQuestions = questions.filter(q => q.material === 'gpoe').length || 1350;

  const icaAttempted = icaStats.reduce((acc, curr) => acc + curr.attempted, 0);
  const gpoeAttempted = gpoeStats.reduce((acc, curr) => acc + curr.attempted, 0);

  const icaProgress = icaTotalQuestions > 0 ? Math.round((icaAttempted / icaTotalQuestions) * 100) : 0;
  const gpoeProgress = gpoeTotalQuestions > 0 ? Math.round((gpoeAttempted / gpoeTotalQuestions) * 100) : 0;

  const icaCorrect = icaStats.reduce((acc, curr) => acc + curr.correct, 0);
  const gpoeCorrect = gpoeStats.reduce((acc, curr) => acc + curr.correct, 0);

  const icaAccuracy = icaAttempted > 0 ? Math.round((icaCorrect / icaAttempted) * 100) : 0;
  const gpoeAccuracy = gpoeAttempted > 0 ? Math.round((gpoeCorrect / gpoeAttempted) * 100) : 0;

  const weakChapters = allStats
    .filter(ch => ch.attempted > 0 && ch.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy);

  const strongChapters = allStats
    .filter(ch => ch.attempted > 0 && ch.accuracy >= 85)
    .sort((a, b) => b.accuracy - a.accuracy);

  const overallCompletion = totalQuestions > 0 ? Math.round((attemptedQuestions / totalQuestions) * 100) : 0;

  // Readiness calculation based on 40% completion and 60% accuracy
  const examReadinessScore = Math.round(overallCompletion * 0.4 + overallAccuracy * 0.6);

  let readinessStatus = 'Needs Improvement';
  let readinessColor = 'text-rose-500 bg-rose-50 dark:bg-rose-955/20';
  let readinessBorder = 'border-rose-200 dark:border-rose-900';

  if (examReadinessScore >= 85) {
    readinessStatus = 'Excellent';
    readinessColor = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-955/20';
    readinessBorder = 'border-emerald-200 dark:border-emerald-900';
  } else if (examReadinessScore >= 70) {
    readinessStatus = 'Good';
    readinessColor = 'text-yellow-600 bg-yellow-50 dark:bg-yellow-955/20';
    readinessBorder = 'border-yellow-200 dark:border-yellow-900';
  } else if (examReadinessScore >= 50) {
    readinessStatus = 'Average';
    readinessColor = 'text-orange-500 bg-orange-50 dark:bg-orange-950/20';
    readinessBorder = 'border-orange-200 dark:border-orange-900';
  }

  const getRecommendation = () => {
    if (weakChapters.length > 0) {
      const ch1 = weakChapters[0];
      const ch2 = weakChapters[1];
      return ch2
        ? `Focus on ${ch1.material.toUpperCase()} Chapter ${ch1.num} and ${ch2.material.toUpperCase()} Chapter ${ch2.num}`
        : `Focus on ${ch1.material.toUpperCase()} Chapter ${ch1.num} (${ch1.title})`;
    }

    const incompleteChapters = allStats.filter(ch => ch.completion < 100);
    if (incompleteChapters.length > 0) {
      const leastCompleted = [...incompleteChapters].sort((a, b) => a.completion - b.completion)[0];
      return `Study more cards in ${leastCompleted.material.toUpperCase()} Chapter ${leastCompleted.num}`;
    }

    return 'You are fully reviewed! Try taking a Practice Exam.';
  };

  const recommendation = getRecommendation();

  const handleSelectChapter = (material: 'ica' | 'gpoe', chapterId: string) => {
    setActiveMaterial(material);
    setActiveChapterId(chapterId);
    setStudyQuestionIndex(0);
    navigate('study');
  };

  const handleSelectMaterial = (material: 'ica' | 'gpoe') => {
    setActiveMaterial(material);
    navigate('chapter-select');
  };

  const formatTimeAgo = (timestamp: number) => {
    const t = new Date(timestamp);
    const todayStr = new Date();
    const yesterdayStr = new Date(todayStr);
    yesterdayStr.setDate(yesterdayStr.getDate() - 1);

    if (t.toDateString() === todayStr.toDateString()) return 'Today';
    if (t.toDateString() === yesterdayStr.toDateString()) return 'Yesterday';
    return t.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const stats = progress.sessionStats || {};
  const sessionsCount = stats.sessionsCount || 1;
  const averageDuration = stats.averageDuration || 5;

  const reviewedCount = attemptedQuestions;
  const completedChaptersCount = allStats.filter(ch => ch.completion === 100).length;
  const dailyAverageAttempts = Math.round(reviewedCount / Math.max(1, sessionsCount));

  const progressRadius = 40;
  const progressCircumference = 2 * Math.PI * progressRadius;
  const progressStrokeDashoffset = progressCircumference - (overallCompletion / 100) * progressCircumference;

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4 space-y-6 bg-transparent">
      {/* Back button */}
      <div className="flex items-center">
        <button
          onClick={() => navigate('progress-mistakes')}
          className="flex items-center gap-1.5 text-slate-550 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer font-extrabold text-xs"
        >
          <ArrowLeft size={14} /> Back to Progress & Mistakes
        </button>
      </div>
      {/* Overall Progress Section */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
        <h3 className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
          Overall Progress
        </h3>
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={progressRadius}
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800"
                strokeWidth={8}
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r={progressRadius}
                stroke="#0e7490"
                strokeWidth={8}
                fill="transparent"
                strokeDasharray={progressCircumference}
                strokeDashoffset={progressStrokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-base font-black text-slate-800 dark:text-slate-100 font-sans">{overallCompletion}%</span>
              <span className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">Done</span>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-2 text-center text-xs font-bold">
            <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl">
              <span className="block text-slate-800 dark:text-slate-100 font-sans text-base">{totalQuestions}</span>
              <span className="text-[9px] text-slate-400 font-medium">Available</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl">
              <span className="block text-slate-800 dark:text-slate-100 font-sans text-base">{attemptedQuestions}</span>
              <span className="text-[9px] text-slate-400 font-medium">Attempted</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl col-span-2">
              <span className="block text-slate-800 dark:text-slate-100 font-sans text-base">{remainingQuestions}</span>
              <span className="text-[9px] text-slate-400 font-medium">Remaining Questions</span>
            </div>
          </div>
        </div>
      </section>

      {/* Exam Readiness Section */}
      <section className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-premium space-y-4 ${readinessBorder}`}>
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-550 tracking-wider">
            Exam Readiness
          </h3>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${readinessColor}`}>
            {readinessStatus}
          </span>
        </div>

        <div className="text-center space-y-1 py-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Score Meter</span>
          <p className="text-5xl font-black text-cyan-600 dark:text-cyan-400 font-sans">{examReadinessScore}%</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-xs space-y-1 font-semibold leading-relaxed text-slate-700 dark:text-slate-300">
          <strong className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-0.5">
            Revision Advisor recommendation:
          </strong>
          <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{recommendation}</p>
        </div>
      </section>

      {/* Material Coverage Section */}
      <section className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
          Material Coverage
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => handleSelectMaterial('ica')}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-premium hover:shadow-premium-hover active:scale-[0.99] transition-all text-left flex justify-between items-center cursor-pointer"
          >
            <div className="flex-1 pr-2 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">ICA (General Management)</h4>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-lg">
                  {icaAccuracy}% Acc
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${icaProgress}%` }} />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                <span>{icaAttempted} / {icaTotalQuestions} Attempted</span>
                <span>{icaTotalQuestions - icaAttempted} Left</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 shrink-0 ml-1" />
          </button>

          <button
            onClick={() => handleSelectMaterial('gpoe')}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-premium hover:shadow-premium-hover active:scale-[0.99] transition-all text-left flex justify-between items-center cursor-pointer"
          >
            <div className="flex-1 pr-2 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">GPOE (Technical Operations)</h4>
                <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-lg">
                  {gpoeAccuracy}% Acc
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${gpoeProgress}%` }} />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                <span>{gpoeAttempted} / {gpoeTotalQuestions} Attempted</span>
                <span>{gpoeTotalQuestions - gpoeAttempted} Left</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 shrink-0 ml-1" />
          </button>
        </div>
      </section>

      {/* Chapter Performance Section */}
      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
            Weak Chapters (Below 70%)
          </h3>
          {weakChapters.length === 0 ? (
            <div className="p-5 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center text-xs text-slate-400">
              No weak chapters logged yet. Study more chapters to run advisor evaluation.
            </div>
          ) : (
            <div className="space-y-2">
              {weakChapters.slice(0, 3).map(ch => (
                <div key={ch.id} className="bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-900 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex-1 pr-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-rose-700 dark:text-rose-455">
                      <span>{ch.material.toUpperCase()} • Chapter {ch.num}</span>
                      <span>({ch.attempted} Attempted)</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">{ch.title}</h4>
                    <p className="text-xs text-rose-500 font-extrabold mt-1">Accuracy: {ch.accuracy}%</p>
                  </div>
                  <button
                    onClick={() => handleSelectChapter(ch.material, ch.id)}
                    className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
                  >
                    Start Revision
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
            Strong Chapters (85%+)
          </h3>
          {strongChapters.length === 0 ? (
            <div className="p-5 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center text-xs text-slate-400">
              No strong chapters registered yet. Achieve 85%+ accuracy on chapters to see them list.
            </div>
          ) : (
            <div className="space-y-2">
              {strongChapters.slice(0, 3).map(ch => (
                <div key={ch.id} className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex-1 pr-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-450">
                      <span>{ch.material.toUpperCase()} • Chapter {ch.num}</span>
                      <span>({ch.attempted} Attempted)</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">{ch.title}</h4>
                    <p className="text-xs text-emerald-600 dark:text-emerald-455 font-extrabold mt-1">Accuracy: {ch.accuracy}%</p>
                  </div>
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-455 rounded-xl">
                    <Award size={16} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Advisory & Analytics Summary */}
      <ActivityInsightsCard />
      <WeeklyMonthlyAnalytics />

      {/* Colored Chapters Heatmap Section */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
        <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
          Chapter Heatmap
        </h3>
        
        <div className="space-y-2">
          <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1">
            ICA (General Management)
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {icaStats.map(ch => {
              let cellClass = 'bg-slate-100 dark:bg-slate-805 text-slate-500 border border-slate-200 dark:border-slate-700';
              if (ch.attempted > 0) {
                cellClass = ch.accuracy >= 85
                  ? 'bg-emerald-500 text-white'
                  : ch.accuracy >= 70
                    ? 'bg-yellow-500 text-slate-900'
                    : 'bg-rose-500 text-white';
              }

              return (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChapter('ica', ch.id)}
                  className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg active:scale-90 transition-all cursor-pointer ${cellClass}`}
                  title={`${ch.title} (${ch.accuracy}% accuracy)`}
                >
                  Ch {ch.num}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1">
            GPOE (Technical Operations)
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {gpoeStats.map(ch => {
              let cellClass = 'bg-slate-100 dark:bg-slate-800 text-slate-550 border border-slate-200 dark:border-slate-700';
              if (ch.attempted > 0) {
                cellClass = ch.accuracy >= 85
                  ? 'bg-emerald-500 text-white'
                  : ch.accuracy >= 70
                    ? 'bg-yellow-500 text-slate-900'
                    : 'bg-rose-500 text-white';
              }

              return (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChapter('gpoe', ch.id)}
                  className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg active:scale-90 transition-all cursor-pointer ${cellClass}`}
                  title={`${ch.title} (${ch.accuracy}% accuracy)`}
                >
                  Ch {ch.num}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Visual Performance Charts SVG */}
      <section className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
          Visual Performance Charts
        </h3>
        <DashboardCharts
          overallAccuracy={overallAccuracy}
          icaProgress={icaProgress}
          gpoeProgress={gpoeProgress}
          weakCount={weakChapters.length}
          strongCount={strongChapters.length}
          totalChapters={allStats.length}
          attemptedPercent={overallCompletion}
          historyCheckpoints={(() => {
            const list = progress.recentActivity
              .filter(act => act.type === 'study' || act.type === 'exam')
              .slice(0, 5)
              .reverse()
              .map((act, idx) => ({
                label: `Step ${idx + 1}`,
                value: act.accuracy || (65 + idx * 5),
              }));

            return list.length < 2 ? [
              { label: 'Start', value: 50 },
              { label: 'Check 1', value: 62 },
              { label: 'Check 2', value: 58 },
              { label: 'Check 3', value: 72 },
              { label: 'Active', value: overallAccuracy || 80 },
            ] : list;
          })()}
        />
      </section>

      {/* Recent Activity Timeline Section */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4 relative overflow-hidden">
        <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
          Recent Activity Timeline
        </h3>

        {progress.recentActivity.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            No activity timeline logs recorded yet.
          </div>
        ) : (
          <div className="space-y-5 relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />
            {progress.recentActivity.slice(0, 5).map(act => {
              const ch = (act.chapterId && act.material !== 'all') ? getChaptersByMaterial(act.material).find(e => e.id === act.chapterId) : null;
              return (
                <div key={act.id} className="relative flex items-start gap-4 text-xs font-medium pl-8">
                  <div className="absolute left-[11px] top-1.5 w-2.5 h-2.5 rounded-full bg-cyan-600 dark:bg-cyan-400 border-2 border-white dark:border-slate-900 z-10" />
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span>{formatTimeAgo(act.timestamp)}</span>
                      <span>{act.material.toUpperCase()}{ch ? ` • Ch ${ch.num}` : ''}</span>
                    </div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm leading-snug">{act.label}</h4>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] font-extrabold uppercase text-slate-400">
                      {act.questionsCount && <span>{act.questionsCount} Questions</span>}
                      {act.accuracy !== undefined && <span className="text-cyan-600 dark:text-cyan-400">{act.accuracy}% Accuracy</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Performance Statistics Overview Grid */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
        <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
          Performance Statistics
        </h3>
        
        <div className="grid grid-cols-2 gap-3 text-xs font-bold">
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 rounded-xl">
              <Calendar size={18} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Total Sessions</span>
              <span className="text-base font-black text-slate-800 dark:text-slate-100 font-sans">{sessionsCount}</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-cyan-50 dark:bg-cyan-955/30 text-cyan-600 dark:text-cyan-400 rounded-xl">
              <Clock size={18} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Avg Duration</span>
              <span className="text-base font-black text-slate-800 dark:text-slate-100 font-sans">{averageDuration}m</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl flex items-center gap-3 col-span-2">
            <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 rounded-xl">
              <List size={18} />
            </div>
            <div className="flex-1 flex justify-between items-center pr-1">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Reviewed Questions</span>
                <span className="text-base font-black text-slate-800 dark:text-slate-100 font-sans">{reviewedCount}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block">Daily Avg</span>
                <span className="text-base font-black text-slate-800 dark:text-slate-100 font-sans">{dailyAverageAttempts}/d</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl flex items-center gap-3 col-span-2">
            <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 rounded-xl">
              <ListChecks size={18} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">Completed Chapters</span>
              <span className="text-base font-black text-slate-800 dark:text-slate-100 font-sans">
                {completedChaptersCount} <span className="text-xs text-slate-400 font-medium">/ {allStats.length}</span>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
