import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useExamStore } from '../store/examStore';
import type { ExamHistoryItem } from '../store/examStore';
import { getChaptersByMaterial } from '../utils/chapters';
import {
  Award,
  BookOpen,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Home,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  FileText,
  Star,
  History,
  TrendingUp,
  Sliders
} from 'lucide-react';

export const ExamModeScreen: React.FC = () => {
  const { questions, progress, recordAttempt, toggleBookmark, addRecentActivity } = useApp();
  
  // Zustand Store binding
  const {
    selectedMaterial,
    selectedChapterId,
    selectedChapterTitle,
    selectedChapterNum,
    questions: examQuestions,
    currentIndex: examCurrentIndex,
    answers: examAnswers,
    markedForReview,
    visited,
    timeLeft,
    answerMode,
    examMode,
    examHistory,
    historyLoading,
    activeExamSaved,
    
    setMaterial,
    setChapter,
    setExamMode,
    setCurrentIndex,
    startExam,
    selectOption,
    clearResponse,
    toggleMarkForReview,
    tickTimer,
    submitExam,
    retakeExam,
    exitExam,
    loadHistory,
    checkActiveExam,
    resumeActiveExam,
    discardActiveExam,
  } = useExamStore();

  // Component local views and configs
  const [selectedMatTab, setSelectedMatTab] = useState<'ica' | 'gpoe' | 'all'>('ica');
  const [qCountChoice, setQCountChoice] = useState<number>(-1); // -1 means All

  const [timerChoice, setTimerChoice] = useState<number | null>(45); // in minutes, default 45
  const [customTimerMin, setCustomTimerMin] = useState<string>('');
  const [showCustomTimerInput, setShowCustomTimerInput] = useState<boolean>(false);
  const [orderChoice, setOrderChoice] = useState<'original' | 'randomized'>('randomized');
  const [feedbackChoice, setFeedbackChoice] = useState<'after_submission' | 'instant'>('after_submission');
  
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showPalette, setShowPalette] = useState<boolean>(false);
  const [viewingHistoryTab, setViewingHistoryTab] = useState<boolean>(false);
  const [selectedHistoryRun, setSelectedHistoryRun] = useState<ExamHistoryItem | null>(null);
  
  // Initial DB checks
  useEffect(() => {
    loadHistory();
    checkActiveExam();
  }, []);

  // Timer Tick implementation
  useEffect(() => {
    if (examMode !== 'running') return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [examMode, tickTimer]);

  // Auto-submit checker
  useEffect(() => {
    if (examMode === 'running' && timeLeft === 0) {
      alert('Time Up! Submitting your test automatically.');
      handleConfirmSubmit();
    }
  }, [timeLeft, examMode]);

  // Active question dynamic binding
  const currentQuestion = examQuestions[examCurrentIndex];
  const userChoice = currentQuestion ? examAnswers[currentQuestion.uniqueId] : undefined;

  // Question counts by chapter
  const getQuestionsCountForChapter = (material: 'ica' | 'gpoe' | 'all', chapterId: string) => {
    if (material === 'all') return questions.length;
    return questions.filter(q => q.material === material && q.chapterId === chapterId).length;
  };

  const handleSelectChapter = (material: 'ica' | 'gpoe' | 'all', chapterId: string, num: number, title: string) => {
    setMaterial(material);
    setChapter(chapterId, num, title);
    
    // Auto preset configurations based on chapter size
    const chapterSize = getQuestionsCountForChapter(material, chapterId);
    setQCountChoice(-1); // Default to All questions
    setShowCustomTimerInput(false);
    
    // Adjust default timer depending on chapter size
    if (chapterSize <= 10) setTimerChoice(15);
    else if (chapterSize <= 30) setTimerChoice(30);
    else if (chapterSize <= 50) setTimerChoice(45);
    else if (chapterSize <= 100) setTimerChoice(90);
    else setTimerChoice(120);
    
    setExamMode('setup');
  };

  // Equal fair-share selector for All Mix Mode
  const selectEqualMixedQuestions = (poolQuestions: typeof questions, limit: number): typeof questions => {
    // Group questions by material and chapterId to identify active chapters
    const chapterMap = new Map<string, typeof questions>();
    poolQuestions.forEach(q => {
      const key = `${q.material}_${q.chapterId}`;
      if (!chapterMap.has(key)) {
        chapterMap.set(key, []);
      }
      chapterMap.get(key)!.push(q);
    });

    const chapters = Array.from(chapterMap.keys());
    const numChapters = chapters.length;
    if (numChapters === 0) return [];

    // Shuffle each chapter's list of questions
    const shuffledChapters = new Map<string, typeof questions>();
    chapterMap.forEach((qs, key) => {
      shuffledChapters.set(key, [...qs].sort(() => Math.random() - 0.5));
    });

    const selectedList: typeof questions = [];
    const targetPerChapter = Math.floor(limit / numChapters);

    // Phase 1: Draw targetPerChapter questions from each chapter
    chapters.forEach(key => {
      const qs = shuffledChapters.get(key)!;
      const countToTake = Math.min(targetPerChapter, qs.length);
      for (let i = 0; i < countToTake; i++) {
        selectedList.push(qs.pop()!);
      }
    });

    // Phase 2: If we still need questions (due to rounding or a chapter having fewer questions), draw from remaining leftovers
    let remainingNeeded = limit - selectedList.length;
    if (remainingNeeded > 0) {
      const leftoverPool: typeof questions = [];
      shuffledChapters.forEach(qs => {
        leftoverPool.push(...qs);
      });
      leftoverPool.sort(() => Math.random() - 0.5);
      const extra = leftoverPool.slice(0, remainingNeeded);
      selectedList.push(...extra);
    }

    // Final shuffle to mix questions from different chapters
    return selectedList.sort(() => Math.random() - 0.5);
  };

  const handleStartPracticeTest = () => {
    if (!selectedMaterial || !selectedChapterId) return;

    let selectedPool: typeof questions = [];

    if (selectedMaterial === 'all') {
      const totalAvailable = questions.length;
      if (totalAvailable === 0) {
        alert('The question bank is empty. Please check your data source.');
        return;
      }
      // Determine selection limit
      const limit = (qCountChoice > 0 && qCountChoice < totalAvailable) ? qCountChoice : totalAvailable;
      
      // Select questions using our equal distribution algorithm
      selectedPool = selectEqualMixedQuestions(questions, limit);
    } else {
      const pool = questions.filter(
        q => q.material === selectedMaterial && q.chapterId === selectedChapterId
      );

      if (pool.length === 0) {
        alert('The question bank for this chapter is empty or still caching. Please try again in a moment.');
        return;
      }

      selectedPool = [...pool];
      if (qCountChoice > 0 && qCountChoice < pool.length) {
        // Shuffle first to pick randomly if choosing a subset, even if order is original
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        selectedPool = shuffled.slice(0, qCountChoice);
      }
    }

    const finalMinutes = showCustomTimerInput ? (parseInt(customTimerMin) || 45) : timerChoice;

    startExam(selectedPool, finalMinutes, orderChoice, feedbackChoice);
    setShowPalette(false);
    setShowSubmitModal(false);
  };

  const handleConfirmSubmit = async () => {
    setShowSubmitModal(false);
    setShowPalette(false);
    await submitExam(
      (uid, isCorrect) => recordAttempt(uid, isCorrect),
      (type, mat, label, detail, chId, count, acc) => {
        addRecentActivity(type, mat, label, detail, chId, count, acc);
      }
    );
  };

  // Timer formatter
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return 'No Timer';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  // Color logic for Question Palette
  const getPaletteBtnColor = (qId: string, idx: number) => {
    const isCurrent = examCurrentIndex === idx;
    const isAnswered = examAnswers[qId] !== undefined;
    const isMarked = markedForReview.includes(qId);
    const isVisited = visited.includes(qId);

    let baseColor = 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'; // Not Visited
    
    if (isAnswered && isMarked) {
      baseColor = 'bg-purple-500 text-white border-purple-600'; // Answered + Marked
    } else if (isAnswered) {
      baseColor = 'bg-emerald-500 text-white border-emerald-600'; // Answered
    } else if (isMarked) {
      baseColor = 'bg-yellow-500 text-slate-900 border-yellow-600'; // Marked for Review
    } else if (isVisited) {
      baseColor = 'bg-sky-500 text-white border-sky-600'; // Visited not answered
    }

    return `${baseColor} ${isCurrent ? 'ring-4 ring-cyan-600 ring-offset-2 dark:ring-offset-slate-900 scale-105' : ''}`;
  };

  // CBT status count helper
  const getCBTStats = () => {
    const total = examQuestions.length;
    let answered = 0;
    let marked = 0;
    let answeredAndMarked = 0;
    let visitedCount = 0;

    examQuestions.forEach(q => {
      const hasAns = examAnswers[q.uniqueId] !== undefined;
      const hasMark = markedForReview.includes(q.uniqueId);
      const hasVisited = visited.includes(q.uniqueId);

      if (hasAns) answered++;
      if (hasMark) marked++;
      if (hasAns && hasMark) answeredAndMarked++;
      if (hasVisited) visitedCount++;
    });

    return {
      total,
      answered,
      unanswered: total - answered,
      marked,
      visited: visitedCount,
      notVisited: total - visitedCount
    };
  };

  // Render Resume Guard Overlay
  if (activeExamSaved) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto w-14 h-14 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-2xl flex items-center justify-center">
            <AlertTriangle size={30} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-sans">Resume Active Exam?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              We detected an unfinished exam session for <strong>{activeExamSaved.selectedChapterTitle}</strong>. 
              Would you like to resume from where you left off or discard it?
            </p>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => resumeActiveExam()}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold uppercase rounded-xl tracking-wider active:scale-[0.98] transition-all cursor-pointer"
            >
              Resume Practice Exam
            </button>
            <button
              onClick={() => discardActiveExam()}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase rounded-xl tracking-wider active:scale-[0.98] transition-all cursor-pointer"
            >
              Discard & Start New
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- SUB-VIEW 1: LANDING EXAM MODE CENTER ---
  if (examMode === 'setup' && !selectedChapterId) {
    const totalExams = examHistory.length;
    const bestScore = totalExams > 0 ? Math.max(...examHistory.map(h => h.accuracy)) : 0;
    const avgAccuracy = totalExams > 0 ? Math.round(examHistory.reduce((acc, curr) => acc + curr.accuracy, 0) / totalExams) : 0;
    
    // Chapters grouped lists
    const icaChapters = getChaptersByMaterial('ica');
    const gpoeChapters = getChaptersByMaterial('gpoe');

    return (
      <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 space-y-6">
        {/* Navigation/Landing Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setViewingHistoryTab(false)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              !viewingHistoryTab ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ClipboardList size={14} /> CBT Exam Center
          </button>
          <button
            onClick={() => setViewingHistoryTab(true)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewingHistoryTab ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History size={14} /> Exam History ({totalExams})
          </button>
        </div>

        {viewingHistoryTab ? (
          // HISTORY LOG VIEW
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">Completed Exam Logs</h3>
            {historyLoading ? (
              <div className="py-12 text-center text-xs font-bold text-slate-500">Loading history...</div>
            ) : examHistory.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
                No exam history recorded yet. Complete an exam to see logs here.
              </div>
            ) : (
              <div className="space-y-3">
                {examHistory.map(run => (
                  <button
                    key={run.id}
                    onClick={() => setSelectedHistoryRun(run)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-left shadow-premium hover:shadow-premium-hover transition-all flex items-start justify-between gap-3 cursor-pointer"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-cyan-50 dark:bg-cyan-950/30 text-[9px] text-cyan-600 dark:text-cyan-400 font-extrabold uppercase rounded">
                          {run.material.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {new Date(run.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 font-sans leading-tight">
                        {run.material === 'all' ? 'All Chapters Mixed' : `Chapter ${run.chapterNum}: ${run.chapterTitle}`}
                      </h4>
                      <div className="flex gap-3 text-[10px] font-extrabold uppercase text-slate-400">
                        <span>Score: {run.score}/{run.totalQuestions}</span>
                        <span className={run.accuracy >= 80 ? 'text-emerald-500' : run.accuracy >= 65 ? 'text-yellow-600' : 'text-rose-500'}>
                          Accuracy: {run.accuracy}%
                        </span>
                        <span>Duration: {formatDuration(run.timeTaken)}</span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-400 mt-1 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // CBT LANDING VIEW
          <>
            {/* Analytics Dashboard mini summary */}
            {totalExams > 0 && (
              <section className="bg-gradient-to-br from-cyan-600 to-cyan-800 text-white rounded-3xl p-5 shadow-premium space-y-4">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-cyan-100" />
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-cyan-100 opacity-90">
                    CBT Performance Analytics
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
                    <span className="block text-lg font-bold font-sans">{totalExams}</span>
                    <span className="text-[8px] text-cyan-100 uppercase font-medium">Exams Taken</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
                    <span className="block text-lg font-bold font-sans">{bestScore}%</span>
                    <span className="text-[8px] text-cyan-100 uppercase font-medium">Best Score</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
                    <span className="block text-lg font-bold font-sans">{avgAccuracy}%</span>
                    <span className="text-[8px] text-cyan-100 uppercase font-medium">Avg Accuracy</span>
                  </div>
                </div>
              </section>
            )}

            {/* Choose Material Section */}
            <section className="space-y-3.5">
              <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Choose Study Material</h3>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => setSelectedMatTab('ica')}
                  className={`p-3 text-left rounded-2xl border shadow-premium transition-all flex flex-col justify-between h-36 cursor-pointer ${
                    selectedMatTab === 'ica'
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-xl w-fit">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 font-sans leading-tight">ICA General</h4>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{icaChapters.length} Chapters</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedMatTab('gpoe')}
                  className={`p-3 text-left rounded-2xl border shadow-premium transition-all flex flex-col justify-between h-36 cursor-pointer ${
                    selectedMatTab === 'gpoe'
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 rounded-xl w-fit">
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 font-sans leading-tight">GPOE Tech</h4>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{gpoeChapters.length} Chapters</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedMatTab('all')}
                  className={`p-3 text-left rounded-2xl border shadow-premium transition-all flex flex-col justify-between h-36 cursor-pointer ${
                    selectedMatTab === 'all'
                      ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="p-2.5 bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl w-fit">
                    <Sliders size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 font-sans leading-tight">All Mix</h4>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{icaChapters.length + gpoeChapters.length} Chapters</p>
                  </div>
                </button>
              </div>
            </section>

            {selectedMatTab === 'all' ? (
              <section className="space-y-3">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-250">
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-2xl w-fit">
                      <Sliders size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Competitive CBT All-Mix</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Equal Chapter Distribution</p>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                    This mock exam combines questions from all <strong>{icaChapters.length} ICA chapters</strong> and <strong>{gpoeChapters.length} GPOE chapters</strong>.
                    To ensure balanced coverage, questions are selected in equal quantities from every chapter, with any leftovers randomly distributed.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-3.5 space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-350">
                    <div className="flex justify-between">
                      <span>Total Chapters:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">
                        {icaChapters.length + gpoeChapters.length} Chapters
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Question Pool:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">{questions.length} Qs available</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Selection Method:</span>
                      <span className="font-extrabold text-purple-600 dark:text-purple-455">Equal Fair-Share Draw</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectChapter('all', 'all', 0, 'All Chapters Mixed')}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase rounded-xl tracking-wider active:scale-[0.98] transition-all cursor-pointer text-center font-sans"
                  >
                    Configure All-Mix Practice Exam
                  </button>
                </div>
              </section>
            ) : (
              /* Chapters list */
              <section className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">
                    {selectedMatTab.toUpperCase()} Chapters
                  </h3>
                  <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold">
                    {(selectedMatTab === 'ica' ? icaChapters : gpoeChapters).length} chapters available
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(selectedMatTab === 'ica' ? icaChapters : gpoeChapters).map(ch => {
                    const chSize = getQuestionsCountForChapter(selectedMatTab, ch.id);
                    return (
                      <button
                        key={ch.id}
                        onClick={() => handleSelectChapter(selectedMatTab, ch.id, ch.num, ch.title)}
                        className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left shadow-premium hover:shadow-premium-hover active:scale-[0.99] transition-all flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                            Chapter {ch.num}
                          </span>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1 leading-snug">
                            {ch.title}
                          </h4>
                        </div>
                        <span className="shrink-0 py-1 px-2.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-350 rounded-lg">
                          {chSize} Qs
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    );
  }

  // --- SUB-VIEW 2: SELECTED HISTORY RUN DETAILS OVERLAY ---
  if (selectedHistoryRun) {
    const run = selectedHistoryRun;


    return (
      <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setSelectedHistoryRun(null)}
            className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Back to History List"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Practice Exam Details</h3>
        </div>

        {/* Info card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
          <div className="text-center space-y-1">
            <span className="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-950/40 text-[10px] text-cyan-600 dark:text-cyan-400 font-extrabold uppercase rounded-lg">
              {run.material === 'all' ? 'ALL MIX' : `${run.material.toUpperCase()} Chapter ${run.chapterNum}`}
            </span>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 pt-1 font-sans">{run.chapterTitle}</h4>
            <span className="text-[10px] text-slate-400 block font-semibold">
              Attempted on {new Date(run.date).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-450 block uppercase tracking-wider font-semibold">Accuracy</span>
              <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-sans">{run.accuracy}%</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-450 block uppercase tracking-wider font-semibold">Score</span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-sans">{run.score} / {run.totalQuestions}</span>
            </div>
          </div>

          <div className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl">
              <span className="text-slate-400 flex items-center gap-1"><Check size={14} className="text-emerald-500" /> Correct Answers:</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-100">{run.correct}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl">
              <span className="text-slate-400 flex items-center gap-1"><X size={14} className="text-rose-500" /> Wrong Answers:</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-100">{run.wrong}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl">
              <span className="text-slate-400 flex items-center gap-1"><HelpCircle size={14} className="text-slate-500" /> Unanswered:</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-100">{run.unanswered}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl">
              <span className="text-slate-400 flex items-center gap-1"><Clock size={14} className="text-indigo-500" /> Time Spent:</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-100">{formatDuration(run.timeTaken)}</span>
            </div>
          </div>
        </div>

        {/* Review list */}
        <div className="space-y-3 pt-1">
          <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Review Exam Questions</h4>
          <div className="space-y-4">
            {run.questions.map((q, idx) => {
              const userAns = run.answers[q.uniqueId];
              const isCorrect = userAns === q.correct_answer;
              return (
                <div
                  key={q.uniqueId}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 space-y-3 shadow-premium ${
                    isCorrect ? 'border-emerald-200 dark:border-emerald-950/60' : 'border-rose-200 dark:border-rose-900/60'
                  }`}
                >
                  <div className="flex justify-between items-start text-xs font-bold">
                    <span className="text-slate-400 font-bold">Question {idx + 1}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider text-[10px] ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-450'
                      }`}
                    >
                      {isCorrect ? <Check size={10} /> : <X size={10} />}
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                    {q.question}
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 text-xs space-y-1.5 font-semibold">
                    <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <span className="text-slate-400">Your Answer:</span>
                      <span className={isCorrect ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                        {userAns ? `${userAns}) ${q[`option_${userAns.toLowerCase()}` as keyof typeof q]}` : 'Unanswered'}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400">Correct Answer:</span>
                        <span className="text-emerald-600 font-bold">
                          {q.correct_answer}) {q[`option_${q.correct_answer.toLowerCase()}` as keyof typeof q]}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="text-xs border-t border-slate-100 dark:border-slate-800 pt-2.5 space-y-1 font-medium text-slate-700 dark:text-slate-350">
                    <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">
                      Explanation:
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 leading-normal font-medium">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setSelectedHistoryRun(null)}
          className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold uppercase rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all text-center"
        >
          Back to History Logs
        </button>
      </div>
    );
  }

  // --- SUB-VIEW 3: CONFIGURATION SCREEN ---
  if (examMode === 'setup' && selectedChapterId) {
    const chapterQuestionsCount = getQuestionsCountForChapter(selectedMaterial!, selectedChapterId);
    
    // Configurations arrays
    const qCountOptions = [
      { label: 'All', value: -1 },
      { label: '25 Qs', value: 25 },
      { label: '50 Qs', value: 50 },
      { label: '75 Qs', value: 75 },
      { label: '100 Qs', value: 100 },
      { label: '150 Qs', value: 150 },
      ...(selectedMaterial === 'all' ? [
        { label: '200 Qs', value: 200 },
        { label: '250 Qs', value: 250 }
      ] : [])
    ];

    const timerOptions = [
      { label: 'No Timer', value: null },
      { label: '15m', value: 15 },
      { label: '30m', value: 30 },
      { label: '45m', value: 45 },
      { label: '60m', value: 60 },
      { label: '90m', value: 90 },
      { label: '120m', value: 120 },
    ];

    return (
      <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setChapter(null, 0, '')}
            className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer animate-in fade-in"
            aria-label="Back to landing"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-extrabold uppercase">
              Configure Practice Test
            </span>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 font-sans mt-0.5 line-clamp-1 leading-snug">
              {selectedMaterial === 'all' ? selectedChapterTitle : `Ch ${selectedChapterNum}: ${selectedChapterTitle}`}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-5">
          {/* Question Count Selection */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Sliders size={13} className="text-cyan-600" /> Question Count
              </label>
              <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold">
                Max: {chapterQuestionsCount} Questions
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {qCountOptions
                .filter(opt => opt.value === -1 || opt.value < chapterQuestionsCount)
                .map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setQCountChoice(opt.value)}
                    className={`py-3 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      qCountChoice === opt.value
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opt.value === -1 ? `All (${chapterQuestionsCount})` : opt.label}
                  </button>
                ))}
            </div>
          </div>

          {/* Timer Settings Selection */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Clock size={13} className="text-cyan-600" /> Timer Options
              </label>
              <button
                onClick={() => {
                  setShowCustomTimerInput(!showCustomTimerInput);
                  if (!showCustomTimerInput) setTimerChoice(null);
                }}
                className={`text-[10px] font-bold uppercase transition-colors ${showCustomTimerInput ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 hover:text-slate-650'}`}
              >
                Custom Timer
              </button>
            </div>
            
            {showCustomTimerInput ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Minutes (e.g. 45)"
                  value={customTimerMin}
                  onChange={(e) => setCustomTimerMin(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:border-cyan-600 text-slate-800 dark:text-slate-100"
                />
                <button
                  onClick={() => setShowCustomTimerInput(false)}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-350 text-xs font-bold rounded-xl"
                >
                  Preset List
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {timerOptions.map((opt) => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setTimerChoice(opt.value)}
                    className={`py-3 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      timerChoice === opt.value
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Randomized Questions order toggle */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <FileText size={13} className="text-cyan-600" /> Question Order
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOrderChoice('original')}
                className={`py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  orderChoice === 'original'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Original Order
              </button>
              <button
                onClick={() => setOrderChoice('randomized')}
                className={`py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  orderChoice === 'randomized'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Randomized Mix
              </button>
            </div>
          </div>

          {/* Feedback mode selector */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <Award size={13} className="text-cyan-600" /> Answer Feedback Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFeedbackChoice('after_submission')}
                className={`py-3 px-1 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer leading-snug ${
                  feedbackChoice === 'after_submission'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-305 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                CBT Exam (No Feedback)
              </button>
              <button
                onClick={() => setFeedbackChoice('instant')}
                className={`py-3 px-1 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer leading-snug ${
                  feedbackChoice === 'instant'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-305 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Instant Answer Check
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleStartPracticeTest}
          className="w-full py-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-sm font-bold uppercase tracking-wider rounded-2xl shadow-md cursor-pointer active:scale-[0.98] transition-all text-center block font-sans"
        >
          Begin Exam
        </button>
      </div>
    );
  }

  // --- SUB-VIEW 4: CBT RUNNING EXAM SCREEN ---
  if (examMode === 'running') {
    if (!currentQuestion) return null;

    const optionsList = [
      { key: 'A', text: currentQuestion.option_a },
      { key: 'B', text: currentQuestion.option_b },
      { key: 'C', text: currentQuestion.option_c },
      { key: 'D', text: currentQuestion.option_d },
    ];

    const stats = getCBTStats();

    // Color feedback classes if Instant Feedback is selected and user answered
    const showFeedback = answerMode === 'instant' && userChoice !== undefined;
    const isChoiceCorrect = userChoice === currentQuestion.correct_answer;

    const handleSelectChoice = (option: string) => {
      // If instant feedback is on, prevent changing once answered
      if (answerMode === 'instant' && userChoice !== undefined) return;
      selectOption(currentQuestion.uniqueId, option);
    };

    const handleSaveAndNext = () => {
      if (examCurrentIndex < stats.total - 1) {
        setCurrentIndex(examCurrentIndex + 1);
      } else {
        setShowSubmitModal(true);
      }
    };

    return (
      <div className="flex-1 flex flex-col justify-between overflow-hidden pb-6 safe-padding-bottom relative">
        {/* Sticky CBT Header */}
        <header className="sticky top-0 z-20 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-4 space-y-3 shrink-0">
          <div className="flex justify-between items-center">
            <div className="min-w-0 pr-4">
              <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-extrabold uppercase tracking-wide">
                {selectedMaterial === 'all' ? 'All Chapters Mix' : `Chapter ${selectedChapterNum}`}
              </span>
              <h2 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 font-sans truncate">
                {selectedChapterTitle}
              </h2>
            </div>
            <div className="shrink-0 flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Clock size={14} className="text-cyan-600" />
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-sans tracking-wide">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
              <span>Question {examCurrentIndex + 1} of {stats.total}</span>
              <span>{stats.answered} Answered</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-cyan-600 h-full transition-all duration-200 rounded-full"
                style={{ width: `${((examCurrentIndex + 1) / stats.total) * 100}%` }}
              />
            </div>
          </div>
        </header>

        {/* Question Area Scroll Container */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">
                Question {examCurrentIndex + 1}
              </span>
              {markedForReview.includes(currentQuestion.uniqueId) && (
                <span className="px-2 py-0.5 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 text-[8px] font-black uppercase tracking-wider rounded-lg border border-yellow-200 dark:border-yellow-900 flex items-center gap-0.5">
                  <Star size={8} fill="currentColor" /> Marked
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-relaxed font-sans select-none">
              {currentQuestion.question}
            </h3>

            {/* Option Buttons */}
            <div className="space-y-2.5 pt-2">
              {optionsList.map((opt) => {
                const isSelected = userChoice === opt.key;
                const isCorrectOption = opt.key === currentQuestion.correct_answer;

                let optBorderColor = 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200';
                
                if (showFeedback) {
                  if (isSelected && isCorrectOption) {
                    optBorderColor = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300';
                  } else if (isSelected && !isCorrectOption) {
                    optBorderColor = 'border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300';
                  } else if (isCorrectOption) {
                    optBorderColor = 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-800 dark:text-emerald-300';
                  }
                } else if (isSelected) {
                  optBorderColor = 'border-cyan-600 bg-cyan-50/40 dark:bg-cyan-950/20 text-cyan-800 dark:text-cyan-300 font-bold';
                }

                return (
                  <button
                    key={opt.key}
                    onClick={() => handleSelectChoice(opt.key)}
                    className={`w-full px-4 py-3.5 rounded-xl border text-left text-sm font-semibold transition-all flex items-start gap-3 cursor-pointer ${optBorderColor}`}
                    style={{ minHeight: '52px' }}
                  >
                    <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black shrink-0 ${
                      isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      {opt.key}
                    </span>
                    <span className="flex-1 leading-normal pt-0.5">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Instant Feedback Explanation Area */}
            {showFeedback && (
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2 space-y-2 animate-in fade-in slide-in-from-top-4 duration-200">
                <div className="flex items-center gap-1.5">
                  {isChoiceCorrect ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs uppercase flex items-center gap-1"><CheckCircle2 size={14} /> Correct Option!</span>
                  ) : (
                    <span className="text-rose-500 font-extrabold text-xs uppercase flex items-center gap-1"><XCircle size={14} /> Incorrect</span>
                  )}
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-3 text-xs leading-relaxed text-slate-650 dark:text-slate-400 font-medium">
                  <strong className="text-[10px] font-black uppercase text-slate-400 block mb-1">CBT Explanation:</strong>
                  {currentQuestion.explanation}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom controls panel */}
        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-2.5">
            <button
              onClick={() => toggleMarkForReview(currentQuestion.uniqueId)}
              className={`flex-1 py-3 px-1 border rounded-xl text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all ${
                markedForReview.includes(currentQuestion.uniqueId)
                  ? 'bg-yellow-500 border-yellow-500 text-slate-900'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <Star size={13} fill={markedForReview.includes(currentQuestion.uniqueId) ? 'currentColor' : 'none'} />
              Review
            </button>

            <button
              onClick={() => clearResponse(currentQuestion.uniqueId)}
              disabled={answerMode === 'instant' && userChoice !== undefined}
              className={`flex-1 py-3 px-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-center text-xs font-bold uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer`}
            >
              Clear
            </button>

            <button
              onClick={() => setShowPalette(!showPalette)}
              className="py-3 px-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-center text-xs font-bold uppercase flex items-center justify-center cursor-pointer"
              title="Toggle Question Palette"
            >
              <ClipboardList size={16} />
            </button>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center cursor-pointer active:scale-95 transition-all"
            >
              Submit
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCurrentIndex(examCurrentIndex - 1)}
              disabled={examCurrentIndex === 0}
              className="py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={14} /> Prev
            </button>

            <button
              onClick={handleSaveAndNext}
              className="py-3 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-1 active:scale-[0.98] transition-all cursor-pointer"
            >
              Save & Next <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* --- QUESTION NAVIGATOR PALETTE SLIDEOVER OVERLAY --- */}
        {showPalette && (
          <div className="absolute inset-0 z-30 flex flex-col justify-end bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-5 shadow-2xl space-y-4 max-h-[75%] flex flex-col animate-in slide-in-from-bottom duration-250">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <ClipboardList size={14} className="text-cyan-650" /> CBT Navigator Palette
                </h4>
                <button
                  onClick={() => setShowPalette(false)}
                  className="text-xs font-bold text-cyan-600 dark:text-cyan-400"
                >
                  Hide Palette
                </button>
              </div>

              {/* Grid palette numbers */}
              <div className="flex-1 overflow-y-auto grid grid-cols-5 gap-2.5 py-1">
                {examQuestions.map((q, idx) => (
                  <button
                    key={q.uniqueId}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowPalette(false);
                    }}
                    className={`aspect-square border rounded-xl flex items-center justify-center text-xs font-black shadow-sm transition-all active:scale-90 cursor-pointer ${getPaletteBtnColor(q.uniqueId, idx)}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {/* Legend index indicator */}
              <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-150 dark:border-slate-800 text-[8px] font-black uppercase text-slate-400 tracking-wider">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700" />
                  <span>Not Visited ({stats.notVisited})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-sky-500 border border-sky-600" />
                  <span>Visited ({stats.visited - stats.answered})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 border border-emerald-600" />
                  <span>Answered ({stats.answered - markedForReview.filter(id => examAnswers[id] !== undefined).length})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-yellow-500 border border-yellow-600" />
                  <span>Review ({stats.marked - markedForReview.filter(id => examAnswers[id] !== undefined).length})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-purple-500 border border-purple-600" />
                  <span>Ans + Review ({markedForReview.filter(id => examAnswers[id] !== undefined).length})</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- SUBMIT CONFIRMATION DIALOG MODAL --- */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center px-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="mx-auto w-14 h-14 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-2xl flex items-center justify-center">
                <AlertTriangle size={30} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 font-sans">Submit Practice Exam?</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Verify your CBT exam stats below before submitting:
                </p>
              </div>

              {/* Counts grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="block text-emerald-500 text-base font-black font-sans">{stats.answered}</span>
                  <span className="text-[8px] text-slate-400 block font-bold uppercase mt-0.5">Answered</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="block text-rose-500 text-base font-black font-sans">{stats.unanswered}</span>
                  <span className="text-[8px] text-slate-400 block font-bold uppercase mt-0.5">Unanswered</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="block text-yellow-500 text-base font-black font-sans">{stats.marked}</span>
                  <span className="text-[8px] text-slate-400 block font-bold uppercase mt-0.5">For Review</span>
                </div>
              </div>

              {stats.unanswered > 0 && (
                <p className="text-[10px] text-rose-500 font-semibold uppercase leading-snug">
                  ⚠️ WARNING: You have left {stats.unanswered} questions unanswered.
                </p>
              )}

              <div className="space-y-2 pt-1">
                <button
                  onClick={handleConfirmSubmit}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase rounded-xl tracking-wider cursor-pointer active:scale-95 transition-all shadow-sm"
                >
                  Submit Practice Test
                </button>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-202 text-xs font-bold uppercase rounded-xl tracking-wider cursor-pointer transition-all"
                >
                  Continue Exam
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- SUB-VIEW 5: RESULTS SCREEN & PERFORMANCE SUMMARY ---
  if (examMode === 'result') {
    // Re-calculate statistics for active completed test from history
    const lastRun = examHistory[0];
    if (!lastRun) return null;

    const correctPercent = lastRun.accuracy;
    
    // Rank Style indicator mapping
    let rankLabel = 'Bronze Rank';
    let rankColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900';
    if (correctPercent >= 90) {
      rankLabel = 'Platinum Rank';
      rankColor = 'text-indigo-650 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900';
    } else if (correctPercent >= 80) {
      rankLabel = 'Gold Rank';
      rankColor = 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900';
    } else if (correctPercent >= 65) {
      rankLabel = 'Silver Rank';
      rankColor = 'text-slate-500 bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700';
    }

    // SVG Circular score progress indicators
    const radius = 36;
    const circ = 2 * Math.PI * radius;
    const strokeDash = circ - (correctPercent / 100) * circ;

    if (viewingHistoryTab) {
      // REVIEW EXAM SECTION
      return (
        <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              onClick={() => setViewingHistoryTab(false)}
              className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Back to Summary"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Review Exam Answers</h3>
          </div>

          <div className="space-y-4">
            {lastRun.questions.map((q, idx) => {
              const ans = lastRun.answers[q.uniqueId];
              const isCorrect = ans === q.correct_answer;
              const isBookmarked = progress.bookmarks.includes(q.uniqueId);
              
              return (
                <div
                  key={q.uniqueId}
                  className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 space-y-3.5 shadow-premium relative ${
                    isCorrect ? 'border-emerald-200 dark:border-emerald-950/60' : 'border-rose-200 dark:border-rose-950/60'
                  }`}
                >
                  <div className="flex justify-between items-start text-xs font-bold pr-7">
                    <span className="text-slate-400 font-bold">Question {idx + 1}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider text-[9px] ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                      }`}
                    >
                      {isCorrect ? <Check size={10} /> : <X size={10} />}
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  {/* Bookmark star inside review */}
                  <button
                    onClick={() => toggleBookmark(q.uniqueId)}
                    className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-amber-500 cursor-pointer transition-colors"
                    title="Bookmark Question"
                  >
                    <Star size={18} fill={isBookmarked ? '#f59e0b' : 'none'} className={isBookmarked ? 'text-amber-500' : ''} />
                  </button>

                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed font-sans select-none">
                    {q.question}
                  </p>

                  <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-3.5 text-xs space-y-2 font-semibold">
                    <p className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                      <span className="text-slate-450 shrink-0">Your Answer:</span>
                      <span className={isCorrect ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                        {ans ? `${ans}) ${q[`option_${ans.toLowerCase()}` as keyof typeof q]}` : 'Unanswered'}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                        <span className="text-slate-450 shrink-0">Correct Option:</span>
                        <span className="text-emerald-600 font-bold">
                          {q.correct_answer}) {q[`option_${q.correct_answer.toLowerCase()}` as keyof typeof q]}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="text-xs border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5 font-medium text-slate-700 dark:text-slate-350">
                    <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[9px] block">
                      Explanation:
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setViewingHistoryTab(false)}
            className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold uppercase rounded-xl cursor-pointer text-center active:scale-95 transition-all shadow-sm"
          >
            Back to Summary Dashboard
          </button>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto px-4 pb-20 pt-6 space-y-6">
        {/* Results Banner Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-cyan-500 to-teal-500 text-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
            <Award size={36} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 pt-1">CBT Score Breakdown</h2>
          <p className="text-xs text-slate-450 dark:text-slate-500 font-medium">Practice exam evaluation finalized successfully.</p>
        </div>

        {/* Circular Progress Ring Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium flex items-center justify-around gap-4">
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-850"
                strokeWidth={7}
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="#0ea5e9"
                strokeWidth={7}
                fill="transparent"
                strokeDasharray={circ}
                strokeDashoffset={strokeDash}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-slate-800 dark:text-slate-100 font-sans">{correctPercent}%</span>
              <span className="text-[7px] text-slate-400 uppercase tracking-widest font-black">Accuracy</span>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border block w-fit ${rankColor}`}>
              {rankLabel}
            </span>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-sans">
              {lastRun.material === 'all' ? 'All Chapters Mix Finished' : `Chapter ${lastRun.chapterNum} Finished`}
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-[150px]">
              You answered {lastRun.correct} correct out of {lastRun.totalQuestions} questions.
            </p>
          </div>
        </div>

        {/* Performance summary details card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
          <h3 className="text-xs font-extrabold uppercase text-slate-404 dark:text-slate-500 tracking-wider">
            Performance Statistics
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs font-bold">
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-xl shrink-0">
                <Check size={16} />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-medium">Correct</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 font-sans">{lastRun.correct}</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-rose-100 dark:bg-rose-950/40 text-rose-500 rounded-xl shrink-0">
                <X size={16} />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-medium">Incorrect</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 font-sans">{lastRun.wrong}</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl shrink-0">
                <HelpCircle size={16} />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-medium">Unanswered</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 font-sans">{lastRun.unanswered}</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-500 rounded-xl shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-medium">Time Taken</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 font-sans">{formatDuration(lastRun.timeTaken)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => setViewingHistoryTab(true)}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-700 hover:to-cyan-900 text-white text-sm font-bold uppercase tracking-wider rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-all"
            style={{ minHeight: '52px' }}
          >
            <ClipboardList size={18} /> Review Exam Answers
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={retakeExam}
              className="py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase rounded-xl cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all"
              style={{ minHeight: '48px' }}
            >
              <RotateCcw size={14} /> Retake Exam
            </button>
            <button
              onClick={exitExam}
              className="py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase rounded-xl cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all"
              style={{ minHeight: '48px' }}
            >
              <Home size={14} /> Exit Center
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};