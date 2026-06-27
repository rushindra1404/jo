import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getChaptersByMaterial, GPOE_CHAPTERS } from '../utils/chapters';
import { Zap, Play, FileText, BookOpen, ListChecks } from 'lucide-react';
import { ICA_MATERIALS, GPOE_MATERIALS } from '../utils/studyMaterials';
import { getAllStudyProgress } from '../utils/indexedDB';
import type { StudyProgress } from '../utils/indexedDB';
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
    setProfileDrawerOpen
  } = useApp();
  const { user } = useAuth();

  const [continueReading, setContinueReading] = useState<StudyProgress | null>(null);

  useEffect(() => {
    const loadLibraryData = async () => {
      try {
        const progressList = await getAllStudyProgress();

        if (progressList.length > 0) {
          const sorted = [...progressList].sort((a, b) => b.timestamp - a.timestamp);
          setContinueReading(sorted[0]);
        } else {
          setContinueReading(null);
        }
      } catch (err) {
        console.error('Error fetching library stats in Dashboard:', err);
      }
    };
    loadLibraryData();
  }, []);

  const getGreeting = (firstName: string) => {
    const hrs = new Date().getHours();
    if (hrs >= 5 && hrs < 12) return `Good Morning, ${firstName}`;
    if (hrs >= 12 && hrs < 17) return `Good Afternoon, ${firstName}`;
    if (hrs >= 17 && hrs < 24) return `Good Evening, ${firstName}`;
    return `Welcome Back, ${firstName}`;
  };

  const totalQuestions = questions.length || 3750;
  const attemptedQuestions = Object.keys(progress.attempts).length;
  const correctQuestions = Object.values(progress.attempts).filter(a => a.correct).length;
  const remainingQuestions = Math.max(0, totalQuestions - attemptedQuestions);
  const overallAccuracy = attemptedQuestions > 0 ? Math.round((correctQuestions / attemptedQuestions) * 100) : 0;

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

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-24 pt-4 space-y-6 bg-transparent">
      
      {/* Section 1: Branded Welcome Header */}
      <header className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4.5 shadow-sm gap-3">
        <div className="flex items-center gap-3">
          {/* JO Sphere Logo */}
          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-955 rounded-xl p-1.5 border border-slate-100 dark:border-slate-800 shadow-inner shrink-0 flex items-center justify-center">
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

      {/* Section 2: Target Revision Banner */}
      <section className="bg-gradient-to-br from-cyan-700 to-teal-800 text-white rounded-3xl p-5 shadow-premium relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
          <Zap size={180} />
        </div>
        <div className="flex justify-between items-center text-xs font-bold text-cyan-100">
          <span className="uppercase tracking-wider">
            {progress.continueLearning ? progress.continueLearning.material.toUpperCase() : 'GPOE'} Revision Target
          </span>
          <span>
            Ch {progress.continueLearning ? getChaptersByMaterial(progress.continueLearning.material).find(e => e.id === progress.continueLearning?.chapterId)?.num : 1}
          </span>
        </div>
        <h3 className="text-sm font-extrabold line-clamp-1 mt-2">
          {progress.continueLearning ? getChaptersByMaterial(progress.continueLearning.material).find(e => e.id === progress.continueLearning?.chapterId)?.title : GPOE_CHAPTERS[0].title}
        </h3>
        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-4">
          <div className="text-[11px] text-cyan-200 font-semibold uppercase">
            Question: {progress.continueLearning ? progress.continueLearning.questionIndex + 1 : 1}
          </div>
          <button
            onClick={handleContinueLearning}
            className="py-2 px-4 bg-white text-cyan-805 hover:bg-cyan-50 font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-sm flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
          >
            <Play size={10} fill="currentColor" /> Continue
          </button>
        </div>
      </section>

      {/* Section 3: Learning Modes */}
      <section className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
          Learning Modes
        </h3>
        <div className="grid grid-cols-1 gap-3.5">
          {/* Card 1: Revision Mode */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium flex flex-col justify-between space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 rounded-2xl shrink-0">
                <Zap size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-850 dark:text-slate-100">Revision Mode</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Practice Questions with Instant Feedback. Check correct answers and detailed explanations immediately.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('chapter-select')}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
            >
              Open Revision Mode
            </button>
          </div>

          {/* Card 2: Flash Cards */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium flex flex-col justify-between space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 rounded-2xl shrink-0">
                <BookOpen size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-850 dark:text-slate-100">Flash Cards</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Important Points, Quick Revision, Bullet Notes, Definitions, Formulas, and Key Concepts.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('flashcards-landing')}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
            >
              Open Flash Cards
            </button>
          </div>

          {/* Card 3: Exam Mode */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium flex flex-col justify-between space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
                <ListChecks size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-850 dark:text-slate-100">Exam Mode</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Timed Exam simulation. Conduct real examination with full performance analysis at the end.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('exam')}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
            >
              Start Exam
            </button>
          </div>
        </div>
      </section>

      {/* Section 4: Study Materials */}
      <section className="space-y-3">
        <div>
          <h3 className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-505 tracking-wider">
            📚 Study Materials
          </h3>
          <p className="text-[10px] text-slate-450 dark:text-slate-550 font-semibold mt-0.5">
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

      {continueReading && (
        <section className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-3xl p-5 shadow-premium space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] text-purple-205 font-extrabold uppercase tracking-widest flex items-center gap-1">
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

      {/* Section 5: Quick Statistics */}
      <section className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
          Quick Statistics
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-center space-y-1 shadow-sm">
            <span className="block text-2xl font-black text-cyan-600 dark:text-cyan-400 font-sans">{overallAccuracy}%</span>
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">Overall Accuracy</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-center space-y-1 shadow-sm">
            <span className="block text-2xl font-black text-slate-800 dark:text-slate-100 font-sans">{attemptedQuestions}</span>
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">Attempted</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-center space-y-1 shadow-sm">
            <span className="block text-2xl font-black text-amber-500 font-sans">{progress.bookmarks.length}</span>
            <span className="text-[10px] text-slate-455 dark:text-slate-500 font-bold uppercase tracking-wider">Bookmarks</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-center space-y-1 shadow-sm">
            <span className="block text-2xl font-black text-slate-800 dark:text-slate-100 font-sans">{remainingQuestions}</span>
            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">Remaining</span>
          </div>
        </div>
      </section>

    </div>
  );
};