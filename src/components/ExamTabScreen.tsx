import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useExamStore } from '../store/examStore';
import type { ExamHistoryItem } from '../store/examStore';
import { getChaptersByMaterial } from '../utils/chapters';
import {
  ChevronRight,
  TrendingUp,
  History,
  Play,
  ArrowLeft
} from 'lucide-react';

export const ExamTabScreen: React.FC = () => {
  const { navigate, questions } = useApp();
  const {
    examHistory,
    historyLoading,
    loadHistory,
    setMaterial,
    setChapter,
    setExamMode
  } = useExamStore();

  const [selectedRun, setSelectedRun] = useState<ExamHistoryItem | null>(null);
  const [materialFilter, setMaterialFilter] = useState<'ica' | 'gpoe'>('ica');

  useEffect(() => {
    loadHistory();
  }, []);

  const handleStartExamSetup = (mat: 'ica' | 'gpoe' | 'all') => {
    setMaterial(mat);
    setExamMode('setup');
    navigate('exam');
  };

  const handleStartChapterExamSetup = (mat: 'ica' | 'gpoe', chapterId: string, num: number, title: string) => {
    setMaterial(mat);
    setChapter(chapterId, num, title);
    setExamMode('setup');
    navigate('exam');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate quick mock statistics
  const totalTests = examHistory.length;
  const avgAccuracy = totalTests > 0
    ? Math.round(examHistory.reduce((acc, item) => acc + item.accuracy, 0) / totalTests)
    : 0;
  const bestScore = totalTests > 0
    ? Math.max(...examHistory.map(item => item.accuracy))
    : 0;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  // View exam details page
  if (selectedRun) {
    return (
      <div className="flex-1 flex flex-col justify-between overflow-hidden pb-6 safe-padding-bottom bg-slate-50 dark:bg-slate-950/40">
        <div>
          <div className="px-4 pt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
            <button
              onClick={() => setSelectedRun(null)}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer font-extrabold"
            >
              <ArrowLeft size={14} /> Back to Exams
            </button>
            <span className="font-bold text-slate-400">Exam Details</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 mt-1" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {/* Summary Banner */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-950 dark:from-slate-900/60 dark:to-slate-950/90 rounded-3xl p-5 text-white shadow-premium text-center space-y-3 relative overflow-hidden">
            <h3 className="text-xs uppercase tracking-widest text-slate-400 font-extrabold">Mock Evaluation</h3>
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-cyan-500 bg-white/5 shadow-inner">
              <span className="text-3xl font-black">{selectedRun.correct}</span>
              <span className="text-sm text-slate-450 font-bold">/{selectedRun.totalQuestions}</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-extrabold text-cyan-400 uppercase tracking-wider">{selectedRun.accuracy}% Accuracy</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">
                {selectedRun.material === 'all'
                  ? 'All Chapters Mix'
                  : `${selectedRun.material.toUpperCase()} Chapter ${selectedRun.chapterNum}`}
              </p>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider">
                Date: {formatDate(selectedRun.date)} • Time Taken: {formatDuration(selectedRun.timeTaken)}
              </p>
            </div>
          </div>

          {/* Performance breakdown grid */}
          <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-black">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
              <span className="block text-emerald-600 dark:text-emerald-400 text-lg font-sans">{selectedRun.correct}</span>
              <span className="text-[9px] text-slate-400 font-medium">Correct</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
              <span className="block text-rose-500 text-lg font-sans">{selectedRun.wrong}</span>
              <span className="text-[9px] text-slate-400 font-medium">Wrong</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
              <span className="block text-slate-500 dark:text-slate-400 text-lg font-sans">{selectedRun.unanswered}</span>
              <span className="text-[9px] text-slate-400 font-medium">Skipped</span>
            </div>
          </div>

          {/* Question Breakdown List */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-450 uppercase tracking-wider">Question Review</h4>
            <div className="space-y-4">
              {selectedRun.questions.map((q, idx) => {
                const ans = selectedRun.answers[q.uniqueId];
                const chInfo = getChaptersByMaterial(q.material).find(c => c.id === q.chapterId);
                const isCorrect = ans === q.correct_answer;
                const isUnanswered = !ans;

                return (
                  <div key={q.uniqueId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-premium space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                      <span>Q{idx + 1} • {q.material.toUpperCase()} Ch {chInfo?.num}</span>
                      {isUnanswered ? (
                        <span className="text-slate-550 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">Unanswered</span>
                      ) : isCorrect ? (
                        <span className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg">Correct</span>
                      ) : (
                        <span className="text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg">Wrong</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-normal">{q.question}</p>

                    <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 text-xs font-bold space-y-1.5 border border-slate-150 dark:border-slate-850">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-450 font-medium">Correct Answer:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{q.correct_answer}) {q[`option_${q.correct_answer.toLowerCase()}` as keyof typeof q]}</span>
                      </div>
                      {!isUnanswered && !isCorrect && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-450 font-medium">Your Answer:</span>
                          <span className="text-rose-550 font-extrabold">{ans}) {q[`option_${ans.toLowerCase()}` as keyof typeof q]}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-955/40 border border-slate-100 dark:border-slate-850 rounded-xl p-3 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 font-semibold">
                      <strong className="text-[10px] text-slate-400 uppercase font-black block tracking-wider mb-1">Explanation</strong>
                      {q.explanation || 'No explanation provided.'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="px-4">
          <button
            onClick={() => setSelectedRun(null)}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-2xl text-sm uppercase tracking-wider shadow-md cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
            style={{ minHeight: '52px' }}
          >
            Back to Exams List
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 space-y-6 bg-slate-50 dark:bg-slate-950/40">
      {/* Header */}
      <div>
        <h2 className="text-xs font-black uppercase text-cyan-600 dark:text-cyan-400 tracking-wider">Exam Centre</h2>
        <p className="text-2xl font-black text-slate-800 dark:text-slate-100 font-sans mt-0.5">Mock CBT Exams</p>
      </div>

      {/* Category 1: Full-Length Comprehensive Mock Exams */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sans">1. Full-Length Comprehensive Exams</h3>
        <div className="grid grid-cols-1 gap-3">
          {[
            {
              id: 'all',
              name: '⚡ All Chapters Mixed CBT',
              desc: 'GPOE + ICA Mixed CBT Simulation with equal chapter weights.',
              colorClass: 'border-purple-200 dark:border-purple-950 hover:border-purple-500'
            }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => handleStartExamSetup(opt.id as any)}
              className={`w-full p-4 bg-white dark:bg-slate-900 border ${opt.colorClass} rounded-2xl flex items-center justify-between text-left shadow-sm active:scale-[0.98] transition-all cursor-pointer`}
            >
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-855 dark:text-slate-100 leading-snug">{opt.name}</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal font-semibold max-w-[280px]">
                  {opt.desc}
                </p>
              </div>
              <Play size={16} className="text-cyan-600 dark:text-cyan-400 shrink-0" fill="currentColor" />
            </button>
          ))}
        </div>
      </section>

      {/* Category 2: Chapter-Wise CBT Mock Exams */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">2. Chapter-Wise CBT Mock Exams</h3>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-850 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800/80">
            <button
              onClick={() => setMaterialFilter('ica')}
              className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase cursor-pointer transition-all ${
                materialFilter === 'ica'
                  ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              ICA
            </button>
            <button
              onClick={() => setMaterialFilter('gpoe')}
              className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase cursor-pointer transition-all ${
                materialFilter === 'gpoe'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              GPOE
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1 border border-slate-200/80 dark:border-slate-850 rounded-2xl p-2 bg-slate-50/50 dark:bg-slate-950/20 shadow-inner">
          {getChaptersByMaterial(materialFilter).map((ch) => {
            const chSize = questions.filter(q => q.material === materialFilter && q.chapterId === ch.id).length;
            return (
              <button
                key={ch.id}
                onClick={() => handleStartChapterExamSetup(materialFilter, ch.id, ch.num, ch.title)}
                className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-cyan-500 dark:hover:border-cyan-600 rounded-xl flex items-center justify-between text-left shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase">Chapter {ch.num}</span>
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[220px] leading-snug">{ch.title}</h4>
                </div>
                <span className="shrink-0 py-0.5 px-2 bg-slate-50 dark:bg-slate-800 text-[9px] font-black text-slate-550 dark:text-slate-400 rounded-md border border-slate-100 dark:border-slate-750">
                  {chSize} Qs
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Exam Performance Analytics Header */}
      {totalTests > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">3. Mock Exam Statistics</h3>
            <span className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-0.5"><TrendingUp size={10} /> Active Trends</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-black text-slate-750 dark:text-slate-350">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
              <span className="block text-slate-805 dark:text-slate-150 text-base">{totalTests}</span>
              <span className="text-[9px] text-slate-400 font-medium">Tests Taken</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
              <span className="block text-cyan-600 dark:text-cyan-400 text-base">{avgAccuracy}%</span>
              <span className="text-[9px] text-slate-400 font-medium">Avg Score</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
              <span className="block text-emerald-600 dark:text-emerald-400 text-base">{bestScore}%</span>
              <span className="text-[9px] text-slate-400 font-medium">Best Score</span>
            </div>
          </div>

          {/* Simple Animated Custom SVG Chart displaying the last 6 exam scores */}
          <div className="space-y-1 pt-1">
            <h4 className="text-[9px] font-bold text-slate-400 uppercase">Recent Performance (Last 6 Runs)</h4>
            <div className="h-28 w-full bg-slate-50 dark:bg-slate-950/65 rounded-xl border border-slate-100 dark:border-slate-900 flex items-end justify-around p-3 relative">
              {examHistory.slice(0, 6).reverse().map((item, idx) => {
                const heightPercent = Math.max(10, item.accuracy);
                return (
                  <div key={item.id || idx} className="flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    <span className="absolute -top-6 text-[8px] bg-slate-800 text-white px-1.5 py-0.5 rounded font-black opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.accuracy}%
                    </span>
                    {/* Bar */}
                    <div
                      className="w-4 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-md transition-all duration-500"
                      style={{ height: `${heightPercent * 0.6}px` }}
                    />
                    <span className="text-[8px] text-slate-400 font-extrabold uppercase">{item.material.substring(0, 3)}</span>
                  </div>
                );
              })}
              {examHistory.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 font-semibold">
                  Complete your first exam to view graph.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CBT History Logs */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">4. History Log ({totalTests})</h3>

        {historyLoading ? (
          <div className="p-8 text-center text-xs text-slate-400 font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            Loading exam history logs...
          </div>
        ) : totalTests === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-2 bg-white dark:bg-slate-900 shadow-sm">
            <History className="mx-auto text-slate-300 dark:text-slate-700" size={32} />
            <h4 className="text-xs font-black text-slate-750 dark:text-slate-300 uppercase">No History Found</h4>
            <p className="text-[10px] text-slate-400 leading-normal max-w-xs mx-auto">
              Your mock CBT exam runs and detailed review scores will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {examHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedRun(item)}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 rounded-2xl flex items-center justify-between shadow-sm cursor-pointer active:scale-[0.99] transition-all"
              >
                <div className="space-y-1">
                  <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded uppercase font-black">
                    {item.material === 'all' ? 'MIXED' : item.material.toUpperCase()}
                  </span>
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 font-sans pt-0.5">
                    {item.material === 'all' ? 'All Chapters Practice Test' : item.chapterTitle}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-medium">
                    {formatDate(item.date)} • {formatTime(item.timeTaken)}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <span className="block text-cyan-600 dark:text-cyan-400 font-black text-xs">{item.accuracy}%</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">{item.correct}/{item.totalQuestions} Right</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
