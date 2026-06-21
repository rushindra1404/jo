import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getChaptersByMaterial, ICA_CHAPTERS, GPOE_CHAPTERS } from '../utils/chapters';
import { getAllStudyProgress } from '../utils/indexedDB';
import type { StudyProgress } from '../utils/indexedDB';
import {
  Award,
  ChevronRight,
  Sliders,
  Play,
  BookOpen,
  FileSpreadsheet
} from 'lucide-react';
import logo from '../assets/jo logo.png';

export const DashboardScreen: React.FC = () => {
  const {
    questions,
    progress,
    navigate,
    setActiveMaterial,
    setActiveChapterId,
    setStudyQuestionIndex,
    setActivePdfMaterial,
    setActivePdfChapterId,
    setProfileDrawerOpen,
  } = useApp();
  const { user } = useAuth();

  const [continueReadingPdf, setContinueReadingPdf] = useState<StudyProgress | null>(null);

  // Load IndexedDB study library details
  useEffect(() => {
    const loadLibraryDetails = async () => {
      try {
        const progressList = await getAllStudyProgress();
        if (progressList.length > 0) {
          // Sort by timestamp descending to find latest read PDF
          const sorted = progressList.sort((a, b) => b.timestamp - a.timestamp);
          setContinueReadingPdf(sorted[0]);
        }
      } catch (err) {
        console.error('Error loading study library details in dashboard:', err);
      }
    };
    loadLibraryDetails();
  }, []);

  const getGreeting = (firstName: string) => {
    const hrs = new Date().getHours();
    if (hrs >= 5 && hrs < 12) return `Good Morning, ${firstName}`;
    if (hrs >= 12 && hrs < 17) return `Good Afternoon, ${firstName}`;
    if (hrs >= 17 && hrs < 24) return `Good Evening, ${firstName}`;
    return `Welcome Back, ${firstName}`;
  };



  // 1. Calculate General stats
  const totalQuestions = questions.length || 3750;
  const attemptedQuestions = Object.keys(progress.attempts).length;
  const correctQuestions = Object.values(progress.attempts).filter(a => a.correct).length;
  const remainingQuestions = Math.max(0, totalQuestions - attemptedQuestions);
  const overallAccuracy = attemptedQuestions > 0
    ? Math.round((correctQuestions / attemptedQuestions) * 100)
    : 0;
  const completionPercent = totalQuestions > 0
    ? Math.round((attemptedQuestions / totalQuestions) * 100)
    : 0;

  // 2. Exam Readiness Score
  const readinessScore = Math.round((completionPercent * 0.4) + (overallAccuracy * 0.6));
  const getReadinessStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', colorClass: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' };
    if (score >= 60) return { label: 'Good', colorClass: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/20' };
    if (score >= 45) return { label: 'Average', colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' };
    return { label: 'Needs Improvement', colorClass: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' };
  };
  const readinessStatus = getReadinessStatus(readinessScore);

  // 3. Continue Learning MCQ state
  const continueMCQ = progress.continueLearning;
  const getContinueLearningTitle = () => {
    if (!continueMCQ) return { material: 'ICA', chapterNum: 1, title: 'Global Steel Scenario', index: 0, total: 150 };
    const chs = getChaptersByMaterial(continueMCQ.material);
    const ch = chs.find(c => c.id === continueMCQ.chapterId);
    const totalInCh = questions.filter(q => q.material === continueMCQ.material && q.chapterId === continueMCQ.chapterId).length || 150;
    return {
      material: continueMCQ.material.toUpperCase(),
      chapterNum: ch?.num || 1,
      title: ch?.title || 'Steel Scenario',
      index: continueMCQ.questionIndex,
      total: totalInCh,
      mode: continueMCQ.mode
    };
  };
  const learnBookmark = getContinueLearningTitle();

  const handleResumeLearning = () => {
    if (!continueMCQ) {
      // Start ICA Chapter 1
      setActiveMaterial('ica');
      setActiveChapterId('chapter01');
      setStudyQuestionIndex(0);
      navigate('study');
    } else {
      setActiveMaterial(continueMCQ.material);
      setActiveChapterId(continueMCQ.chapterId);
      if (continueMCQ.mode === 'flashcard') {
        navigate('flashcards-practice');
      } else {
        setStudyQuestionIndex(continueMCQ.questionIndex);
        navigate('study');
      }
    }
  };

  // 4. Weakest Chapters calculation
  const weakChaptersList: { id: string; num: number; title: string; material: 'ica' | 'gpoe'; accuracy: number }[] = [];
  const allChapters = [...ICA_CHAPTERS, ...GPOE_CHAPTERS];

  allChapters.forEach(ch => {
    const chQuestions = questions.filter(q => q.material === ch.material && q.chapterId === ch.id);
    if (chQuestions.length > 0) {
      const chAttempted = chQuestions.filter(q => progress.attempts[q.uniqueId] !== undefined).length;
      if (chAttempted >= 5) {
        const chCorrect = chQuestions.filter(q => progress.attempts[q.uniqueId]?.correct).length;
        const chAccuracy = Math.round((chCorrect / chAttempted) * 100);
        if (chAccuracy < 70) {
          weakChaptersList.push({
            id: ch.id,
            num: ch.num,
            title: ch.title,
            material: ch.material,
            accuracy: chAccuracy
          });
        }
      }
    }
  });

  const topWeakChapters = weakChaptersList.sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);

  const startWeakChapterRevise = (mat: 'ica' | 'gpoe', chId: string) => {
    setActiveMaterial(mat);
    setActiveChapterId(chId);
    setStudyQuestionIndex(0);
    navigate('study');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 space-y-6 bg-transparent">
      
      {/* SECTION 1: Welcome Header */}
      <header className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4.5 shadow-sm gap-3">
        <div className="flex items-center gap-3">
          {/* JO Sphere Logo */}
          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-950 rounded-xl p-1.5 border border-slate-100 dark:border-slate-800 shadow-inner shrink-0 flex items-center justify-center">
            <img src={logo} alt="JO Sphere Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col space-y-0.5">
            <h2 className="text-xs font-black text-slate-800 dark:text-slate-100 font-sans leading-tight">
              {getGreeting(user?.firstName || 'User')} 👋
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
              Welcome back to JO Sphere
            </p>
            <p className="text-[8px] text-cyan-600 dark:text-cyan-400 font-extrabold uppercase tracking-widest leading-none pt-0.5">
              Learn • Revise • Succeed
            </p>
          </div>
        </div>
        
        {/* Profile Avatar Launcher */}
        <button
          onClick={() => setProfileDrawerOpen(true)}
          className="relative shrink-0 w-11 h-11 hover:scale-105 active:scale-95 transition-all cursor-pointer rounded-full"
          title="Open Profile Menu"
          aria-label="Open Profile Menu"
        >
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-full h-full rounded-full border border-cyan-500/20 shadow-sm object-cover"
            />
          ) : (
            <div className="w-full h-full bg-cyan-600 dark:bg-cyan-900 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
        </button>
      </header>

      {/* SECTION 2: Continue Learning HERO Card */}
      <section className="bg-gradient-to-br from-cyan-600 to-teal-700 dark:from-cyan-950/50 dark:to-slate-900/60 rounded-3xl p-5 text-white shadow-premium relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
          <Award size={180} />
        </div>
        
        <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-lg uppercase tracking-widest font-black">
          {learnBookmark.mode === 'flashcard' ? '📖 FLASHCARDS RESUME' : '🔄 REVISION MCQ RESUME'}
        </span>
        
        <div className="mt-3.5 space-y-1">
          <span className="text-[10px] text-cyan-200 uppercase font-black tracking-wider">
            {learnBookmark.material} Chapter {learnBookmark.chapterNum}
          </span>
          <h3 className="text-lg font-black leading-snug truncate pr-6">{learnBookmark.title}</h3>
          <p className="text-[10px] text-cyan-100 font-medium">
            {learnBookmark.mode === 'flashcard'
              ? `Card ${learnBookmark.index + 1} of ${learnBookmark.total} reviewed`
              : `Question ${learnBookmark.index + 1} of ${learnBookmark.total} reviewed`}
          </p>
        </div>

        <button
          onClick={handleResumeLearning}
          className="w-full py-3.5 bg-white text-cyan-700 hover:bg-cyan-50 font-bold rounded-2xl text-xs uppercase tracking-wider text-center mt-5 cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
          style={{ color: '#0891b2' }}
        >
          <Play size={14} fill="currentColor" /> Continue Learning
        </button>
      </section>

      {/* SECTION 3: Learning Modes */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">2. Learning Modes</h3>
        <div className="grid grid-cols-1 gap-2.5">
          
          {/* Card 1: Flashcards */}
          <button
            onClick={() => {
              navigate('flashcards-landing');
            }}
            className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 rounded-2xl flex items-center gap-3 text-left shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="p-3 bg-rose-50 text-rose-500 dark:bg-rose-950/20 rounded-2xl shrink-0">
              <BookOpen size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase">📖 Flash Cards</h4>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold leading-normal mt-0.5">Important Facts • Key Concepts • Quick Revision</p>
            </div>
          </button>

          {/* Card 2: Revision Mode */}
          <button
            onClick={() => {
              navigate('chapter-select');
            }}
            className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 rounded-2xl flex items-center gap-3 text-left shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="p-3 bg-cyan-50 text-cyan-600 dark:bg-cyan-950/20 rounded-2xl shrink-0">
              <Sliders size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase">🔄 Revision Mode</h4>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold leading-normal mt-0.5">Practice Questions • Instant Feedback • Explanations</p>
            </div>
          </button>

          {/* Card 3: Exam Mode */}
          <button
            onClick={() => navigate('exam-tab')}
            className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 rounded-2xl flex items-center gap-3 text-left shadow-sm active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="p-3 bg-slate-100 text-slate-700 dark:bg-slate-800 rounded-2xl shrink-0">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase">📝 Exam Mode</h4>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold leading-normal mt-0.5">Timed Tests • Real Exam Simulation • Results</p>
            </div>
          </button>

        </div>
      </section>

      {/* SECTION 4: Study Materials (Library card) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">📚 Study Materials</h3>
          <button
            onClick={() => navigate('study-library')}
            className="text-[10px] font-black uppercase text-cyan-600 dark:text-cyan-400 flex items-center gap-0.5 cursor-pointer"
          >
            Open Library <ChevronRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center text-xs font-bold font-sans">
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
            <span className="block text-cyan-600 font-black text-lg">16 Chapters</span>
            <span className="text-[9px] text-slate-400 font-medium uppercase">ICA Material</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-850">
            <span className="block text-emerald-600 font-black text-lg">8 Chapters</span>
            <span className="text-[9px] text-slate-400 font-medium uppercase">GPOE Material</span>
          </div>
        </div>

        {continueReadingPdf && (
          <div
            onClick={() => {
              setActivePdfMaterial(continueReadingPdf.material);
              setActivePdfChapterId(continueReadingPdf.chapterId);
              navigate('pdf-viewer');
            }}
            className="p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 rounded-2xl border border-slate-150 dark:border-slate-850 flex items-center justify-between text-left cursor-pointer active:scale-[0.99] transition-all"
          >
            <div className="space-y-1">
              <span className="text-[8px] bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-400 px-1.5 py-0.5 rounded uppercase font-black">
                📖 PDF CONTINUE READING
              </span>
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[200px] leading-snug">
                {continueReadingPdf.chapterTitle}
              </h4>
              <p className="text-[9px] text-slate-400 font-medium">
                Last page read: {continueReadingPdf.lastPageRead} of {continueReadingPdf.totalPages} ({continueReadingPdf.percentage}% completed)
              </p>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </div>
        )}
      </section>

      {/* SECTION 5: Quick Statistics */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">3. Quick Statistics</h3>
        <div className="grid grid-cols-2 gap-3 text-center text-xs font-black">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <span className="block text-cyan-600 dark:text-cyan-400 text-lg font-sans">{overallAccuracy}%</span>
            <span className="text-[9px] text-slate-400 font-medium">Overall Accuracy</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <span className="block text-emerald-600 dark:text-emerald-400 text-lg font-sans">{attemptedQuestions}</span>
            <span className="text-[9px] text-slate-400 font-medium">Attempted Cards</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <span className="block text-slate-800 dark:text-slate-100 text-lg font-sans">{remainingQuestions}</span>
            <span className="text-[9px] text-slate-400 font-medium">Remaining Cards</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <span className="block text-amber-500 text-lg font-sans">{progress.bookmarks.length}</span>
            <span className="text-[9px] text-slate-400 font-medium">Bookmarks Count</span>
          </div>
        </div>
      </section>

      {/* SECTION 6: Revision Queue */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
        <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
          Revision Queue
        </h3>
        <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-black">
          <button
            onClick={() => navigate('mistakes')}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 cursor-pointer active:scale-95 transition-all"
          >
            <span className="block text-rose-500 text-lg font-sans">{progress.mistakes.length}</span>
            <span className="text-[9px] text-slate-400 font-medium">❌ Mistakes</span>
          </button>
          <button
            onClick={() => navigate('bookmarks')}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 cursor-pointer active:scale-95 transition-all"
          >
            <span className="block text-amber-500 text-lg font-sans">{progress.bookmarks.length}</span>
            <span className="text-[9px] text-slate-400 font-medium">⭐ Bookmarks</span>
          </button>
          <button
            onClick={() => navigate('more')}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 cursor-pointer active:scale-95 transition-all"
          >
            <span className="block text-cyan-600 text-lg font-sans">{(progress.reviewLater || []).length}</span>
            <span className="text-[9px] text-slate-400 font-medium">🚩 Review Later</span>
          </button>
        </div>
      </section>

      {/* SECTION 7: Exam Readiness */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium text-center space-y-4">
        <div className="flex justify-between items-center text-xs font-extrabold text-slate-400 uppercase tracking-widest">
          <span>Simulation Rating</span>
          <span className="text-cyan-600">Exam Readiness</span>
        </div>
        
        {/* Simple visual readiness bar */}
        <div className="flex items-center gap-4 py-2">
          <div className="text-left flex-1 space-y-1">
            <span className="text-[10px] text-slate-400 font-black uppercase">Readiness Rate</span>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-200 font-sans">{readinessScore}%</p>
          </div>
          <span className={`inline-flex px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${readinessStatus.colorClass}`}>
            Status: {readinessStatus.label}
          </span>
        </div>
        
        <div className="w-full bg-slate-100 dark:bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800/80">
          <div className="bg-cyan-500 h-full rounded-full transition-all duration-300" style={{ width: `${readinessScore}%` }} />
        </div>
      </section>

      {/* SECTION 8: Weak Chapters */}
      {topWeakChapters.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">4. Weak Chapters (Needs Review)</h3>
          <div className="space-y-2">
            {topWeakChapters.map(ch => (
              <div
                key={`${ch.material}_${ch.id}`}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-[8px] bg-rose-50 dark:bg-rose-950/20 text-rose-500 border border-rose-100 dark:border-rose-900 px-1.5 py-0.5 rounded uppercase font-black">
                    {ch.accuracy}% Accuracy
                  </span>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-snug pt-0.5 font-sans">
                    Ch {ch.num}: {ch.title}
                  </h4>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                    {ch.material === 'ica' ? 'ICA' : 'GPOE'} Engineering Card
                  </p>
                </div>
                
                <button
                  onClick={() => startWeakChapterRevise(ch.material, ch.id)}
                  className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-[10px] uppercase rounded-xl tracking-wider active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  Quick Revise
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      
    </div>
  );
};