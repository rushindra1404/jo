import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getChaptersByMaterial, ICA_CHAPTERS, GPOE_CHAPTERS } from '../utils/chapters';
import { Zap, Award, Calendar, Clock, ListChecks, Bookmark, ChevronRight, List, AlertTriangle, Play, FileText, BookOpen } from 'lucide-react';
import { WeeklyMonthlyAnalytics } from './WeeklyMonthlyAnalytics';
import { ActivityInsightsCard } from './ActivityInsightsCard';
import { DashboardCharts } from './DashboardCharts';
import { ICA_MATERIALS, GPOE_MATERIALS } from '../utils/studyMaterials';
import {
  getAllStudyProgress,
  getFavoriteMaterials,
  getRecentMaterials,
} from '../utils/indexedDB';
import type {
  StudyProgress,
  StudyFavorite,
  StudyRecent
} from '../utils/indexedDB';


export const DashboardScreen: React.FC = () => {
  const {
    questions,
    progress,
    navigate,
    setActiveMaterial,
    setActiveChapterId,
    setStudyQuestionIndex,
    startRandomRevision,
    setActivePdfMaterial,
    setActivePdfChapterId
  } = useApp();

  const [recentPdfs, setRecentPdfs] = useState<StudyRecent[]>([]);
  const [favoritePdfs, setFavoritePdfs] = useState<StudyFavorite[]>([]);
  const [openedCount, setOpenedCount] = useState<number>(0);
  const [continueReading, setContinueReading] = useState<StudyProgress | null>(null);

  useEffect(() => {
    const loadLibraryData = async () => {
      try {
        const progressList = await getAllStudyProgress();
        setOpenedCount(progressList.length);

        if (progressList.length > 0) {
          const sorted = [...progressList].sort((a, b) => b.timestamp - a.timestamp);
          setContinueReading(sorted[0]);
        } else {
          setContinueReading(null);
        }

        const recents = await getRecentMaterials();
        setRecentPdfs(recents);

        const favs = await getFavoriteMaterials();
        setFavoritePdfs(favs);
      } catch (err) {
        console.error('Error fetching library stats in Dashboard:', err);
      }
    };
    loadLibraryData();
  }, []);

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
  let readinessColor = 'text-rose-500 bg-rose-50 dark:bg-rose-950/20';
  let readinessBorder = 'border-rose-200 dark:border-rose-900';

  if (examReadinessScore >= 85) {
    readinessStatus = 'Excellent';
    readinessColor = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
    readinessBorder = 'border-emerald-200 dark:border-emerald-900';
  } else if (examReadinessScore >= 70) {
    readinessStatus = 'Good';
    readinessColor = 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
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

  const stats = progress.sessionStats;
  const sessionsCount = stats.sessionsCount || 1;
  const averageDuration = stats.averageDuration || 5;

  const reviewedCount = attemptedQuestions;
  const completedChaptersCount = allStats.filter(ch => ch.completion === 100).length;
  const dailyAverageAttempts = Math.round(reviewedCount / Math.max(1, sessionsCount));

  const progressRadius = 40;
  const progressCircumference = 2 * Math.PI * progressRadius;
  const progressStrokeDashoffset = progressCircumference - (overallCompletion / 100) * progressCircumference;

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4 space-y-6">
      
      {/* Welcome & Target revision banner */}
      <section className="bg-gradient-to-br from-cyan-700 to-teal-800 text-white rounded-3xl p-5 shadow-premium relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-black font-sans">Welcome Back</h2>
            <p className="text-[10px] text-cyan-200 mt-1 uppercase font-bold tracking-wider">
              Last Studied: {progress.recentActivity[0] ? new Date(progress.recentActivity[0].timestamp).toLocaleString() : 'No activity logged'}
            </p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-sm">
            <Zap size={20} className="text-amber-300" />
          </div>
        </div>

        <div className="mt-5 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-cyan-100">
            <span className="uppercase tracking-wider">
              {progress.continueLearning ? progress.continueLearning.material.toUpperCase() : 'GPOE'} Revision Target
            </span>
            <span>
              Ch {progress.continueLearning ? getChaptersByMaterial(progress.continueLearning.material).find(e => e.id === progress.continueLearning?.chapterId)?.num : 1}
            </span>
          </div>
          <h3 className="text-sm font-extrabold line-clamp-1">
            {progress.continueLearning ? getChaptersByMaterial(progress.continueLearning.material).find(e => e.id === progress.continueLearning?.chapterId)?.title : GPOE_CHAPTERS[0].title}
          </h3>
          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-cyan-200 font-semibold uppercase">
              Question: {progress.continueLearning ? progress.continueLearning.questionIndex + 1 : 1}
            </div>
            <button
              onClick={handleContinueLearning}
              className="py-2 px-4 bg-white text-cyan-800 hover:bg-cyan-50 font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-sm flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
            >
              <Play size={10} fill="currentColor" /> Continue
            </button>
          </div>
        </div>
      </section>

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
          <h3 className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
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
                <div key={ch.id} className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex-1 pr-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-red-700 dark:text-red-400">
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
                    <p className="text-xs text-emerald-600 dark:text-emerald-450 font-extrabold mt-1">Accuracy: {ch.accuracy}%</p>
                  </div>
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-450 rounded-xl">
                    <Award size={16} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

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

      {/* Quick Access Section */}
      <section className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('home')}
          className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-left shadow-premium flex items-center gap-3 cursor-pointer"
        >
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 rounded-xl">
            <BookOpen size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">Flashcards</h4>
            <p className="text-[9px] text-slate-400 font-semibold">Study Mode</p>
          </div>
        </button>
        <button
          onClick={() => navigate('exam')}
          className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-left shadow-premium flex items-center gap-3 cursor-pointer"
        >
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-450 rounded-xl">
            <ListChecks size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">Quiz Mode</h4>
            <p className="text-[9px] text-slate-400 font-semibold">CBT Exams</p>
          </div>
        </button>
      </section>

      {continueReading && (
        <section className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-3xl p-5 shadow-premium space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] text-purple-200 font-extrabold uppercase tracking-widest flex items-center gap-1">
                <BookOpen size={10} fill="currentColor" /> Continue Reading
              </span>
              <h4 className="text-sm font-extrabold mt-1 font-sans leading-tight">
                {continueReading.material.toUpperCase()} Chapter {continueReading.chapterNum}: {continueReading.chapterTitle}
              </h4>
              <p className="text-[10px] text-purple-200 mt-1 font-semibold">
                Page {continueReading.lastPageRead} of {continueReading.totalPages} ({continueReading.percentage}% Completed)
              </p>
            </div>
            <button
              onClick={() => {
                setActivePdfMaterial(continueReading.material);
                setActivePdfChapterId(continueReading.chapterId);
                navigate('pdf-viewer');
              }}
              className="py-2.5 px-4 bg-white text-purple-800 hover:bg-purple-50 font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-sm shrink-0 active:scale-95 transition-all cursor-pointer font-sans"
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {/* Study Materials Library Selection */}
      <section className="space-y-3">
        <div>
          <h3 className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
            📚 Study Materials
          </h3>
          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-0.5">
            Access all ICA and GPOE study material PDFs.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setActivePdfMaterial('ica');
              navigate('study-library');
            }}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-left shadow-premium hover:shadow-premium-hover transition-all flex flex-col justify-between h-32 cursor-pointer"
          >
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 rounded-lg w-fit">
              <FileText size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">ICA Study Material</h4>
              <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{ICA_MATERIALS.length} Chapters</p>
            </div>
          </button>

          <button
            onClick={() => {
              setActivePdfMaterial('gpoe');
              navigate('study-library');
            }}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-left shadow-premium hover:shadow-premium-hover transition-all flex flex-col justify-between h-32 cursor-pointer"
          >
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-lg w-fit">
              <FileText size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">GPOE Study Material</h4>
              <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{GPOE_MATERIALS.length} Chapters</p>
            </div>
          </button>
        </div>
      </section>

      {/* Study Materials Library Widgets & History */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
        <h3 className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
          Library Stats & Widgets
        </h3>
        
        {/* Count widgets grid */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="block text-purple-650 dark:text-purple-400 text-base font-black font-sans">
              {ICA_MATERIALS.length + GPOE_MATERIALS.length}
            </span>
            <span className="text-[8px] text-slate-400 block font-bold uppercase mt-0.5">Chapters Available</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="block text-cyan-600 dark:text-cyan-400 text-base font-black font-sans">
              {openedCount}
            </span>
            <span className="text-[8px] text-slate-400 block font-bold uppercase mt-0.5">PDFs Opened</span>
          </div>
        </div>

        {/* Recently Read list */}
        {recentPdfs.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">
              📖 Recently Read
            </p>
            <div className="space-y-1.5">
              {recentPdfs.map(ch => (
                <button
                  key={ch.chapterUniqueId}
                  onClick={() => {
                    setActivePdfMaterial(ch.material);
                    setActivePdfChapterId(ch.chapterId);
                    navigate('pdf-viewer');
                  }}
                  className="w-full text-left p-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-105 dark:hover:bg-slate-850 rounded-xl text-xs flex justify-between items-center font-bold text-slate-750 dark:text-slate-250 cursor-pointer"
                >
                  <span className="truncate pr-2">
                    {ch.material.toUpperCase()} Ch {ch.chapterNum}: {ch.chapterTitle}
                  </span>
                  <span className="text-[8px] text-purple-600 dark:text-purple-400 uppercase font-bold shrink-0">
                    Reopen
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Favorites list */}
        {favoritePdfs.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">
              ⭐ Favorites
            </p>
            <div className="space-y-1.5">
              {favoritePdfs.map(ch => (
                <button
                  key={ch.chapterUniqueId}
                  onClick={() => {
                    setActivePdfMaterial(ch.material);
                    setActivePdfChapterId(ch.chapterId);
                    navigate('pdf-viewer');
                  }}
                  className="w-full text-left p-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-105 dark:hover:bg-slate-850 rounded-xl text-xs flex justify-between items-center font-bold text-slate-750 dark:text-slate-250 cursor-pointer"
                >
                  <span className="truncate pr-2">
                    {ch.material.toUpperCase()} Ch {ch.chapterNum}: {ch.chapterTitle}
                  </span>
                  <span className="text-[8px] text-cyan-600 dark:text-cyan-400 uppercase font-bold shrink-0">
                    Read
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Revision Queue Module */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
        <h3 className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
          Revision Queue
        </h3>
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold pb-2">
          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="block text-rose-500 text-base font-black font-sans">{progress.mistakes.length}</span>
            <span className="text-[9px] text-slate-400 font-medium">Mistakes</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="block text-amber-500 text-base font-black font-sans">{progress.bookmarks.length}</span>
            <span className="text-[9px] text-slate-400 font-medium">Bookmarks</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="block text-slate-800 dark:text-slate-100 text-base font-black font-sans">{remainingQuestions}</span>
            <span className="text-[9px] text-slate-400 font-medium">Unattempted</span>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <button
            onClick={() => navigate('mistakes')}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm"
          >
            <AlertTriangle size={14} /> Revise Mistakes
          </button>
          <button
            onClick={() => navigate('bookmarks')}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm"
          >
            <Bookmark size={14} /> Revise Bookmarks
          </button>
          <button
            onClick={() => startRandomRevision('all')}
            className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-extrabold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all border border-slate-200 dark:border-slate-800"
          >
            <Play size={14} /> Continue Unattempted Questions
          </button>
        </div>
      </section>

      {/* Mistake Bank & Resolutions Summary */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
            Mistake Bank
          </h3>
          <button
            onClick={() => navigate('mistakes')}
            className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-0.5 cursor-pointer"
          >
            Open Bank <ChevronRight size={14} />
          </button>
        </div>

        {(() => {
          const resolvedCount = progress.resolvedMistakesCount || 0;
          const pendingCount = progress.mistakes.length;
          const totalLogged = resolvedCount + pendingCount;
          const improvementRate = totalLogged > 0 ? Math.round((resolvedCount / totalLogged) * 100) : 0;

          return (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <span className="block text-slate-800 dark:text-slate-100 font-sans text-base">{totalLogged}</span>
                  <span className="text-[9px] text-slate-400 font-medium">Logged</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <span className="block text-emerald-600 font-sans text-base">{resolvedCount}</span>
                  <span className="text-[9px] text-slate-400 font-medium">Resolved</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <span className="block text-rose-500 font-sans text-base">{pendingCount}</span>
                  <span className="text-[9px] text-slate-400 font-medium">Pending</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>MISTAKES RESOLUTION</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{improvementRate}% IMPROVEMENT</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${improvementRate}%` }} />
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Bookmarks Summary */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
            Bookmark Summary
          </h3>
          <button
            onClick={() => navigate('bookmarks')}
            className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-0.5 cursor-pointer"
          >
            View All <ChevronRight size={14} />
          </button>
        </div>

        {(() => {
          const bookmarked = questions.filter(q => progress.bookmarks.includes(q.uniqueId));
          const icaBookmarks = bookmarked.filter(q => q.material === 'ica').length;
          const gpoeBookmarks = bookmarked.filter(q => q.material === 'gpoe').length;
          const recentBookmarks = bookmarked.slice(-3).reverse();

          return (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <span className="block text-slate-800 dark:text-slate-100 font-sans text-base">{bookmarked.length}</span>
                  <span className="text-[9px] text-slate-400 font-medium">Total</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <span className="block text-emerald-600 font-sans text-base">{icaBookmarks}</span>
                  <span className="text-[9px] text-slate-400 font-medium">in ICA</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <span className="block text-indigo-500 font-sans text-base">{gpoeBookmarks}</span>
                  <span className="text-[9px] text-slate-400 font-medium">in GPOE</span>
                </div>
              </div>

              {recentBookmarks.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Recently Bookmarked</p>
                  <div className="space-y-1.5">
                    {recentBookmarks.map(q => (
                      <div key={q.uniqueId} className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs line-clamp-1 font-semibold text-slate-700 dark:text-slate-300">
                        {q.question}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate('bookmarks')}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all shadow-sm"
              >
                Quick Revision
              </button>
            </div>
          );
        })()}
      </section>

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
              let cellClass = 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700';
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
              let cellClass = 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700';
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
            <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 rounded-xl">
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