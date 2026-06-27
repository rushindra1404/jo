import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getChaptersByMaterial } from '../utils/chapters';
import {
  ChevronRight,
  Sun,
  Moon,
  Trash2,
  Bookmark,
  Clock,
  AlertTriangle,
  Info,
  ArrowLeft,
} from 'lucide-react';
import logo from '../assets/jo logo.png';

export const MoreScreen: React.FC = () => {
  const {
    progress,
    settings,
    updateSettings,
    resetProgress,
    navigate,
    toggleReviewLater,
    questions,
    setProfileDrawerOpen,
    setActiveMaterial,
    setActiveChapterId,
    setStudyQuestionIndex,
  } = useApp();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeSubView, setActiveSubView] = useState<'review-later' | 'about' | null>(null);

  const totalBookmarks = progress.bookmarks.length;
  const totalMistakes = Object.keys(progress.mistakes || {}).length;
  const totalReviewLater = (progress.reviewLater || []).length;

  const fontSizes = [
    { value: 'small', label: 'Compact', desc: 'Smaller text scale' },
    { value: 'medium', label: 'Default', desc: 'Standard reading scale' },
    { value: 'large', label: 'Spacious', desc: 'Larger text scale' },
    { value: 'xlarge', label: 'Extra Large', desc: 'Maximum reading scale' },
  ] as const;

  const handleToggleTheme = () => {
    toggleTheme();
  };

  const handleToggleContrast = () => {
    updateSettings({ highContrast: !settings.highContrast });
  };

  const handleResumeQuestion = (q: any) => {
    const chapterQuestions = questions.filter(
      item => item.material === q.material && item.chapterId === q.chapterId
    );
    const qIdx = chapterQuestions.findIndex(item => item.uniqueId === q.uniqueId);
    if (qIdx !== -1) {
      setActiveMaterial(q.material);
      setActiveChapterId(q.chapterId);
      setStudyQuestionIndex(qIdx);
      navigate('study');
    }
  };

  // Review Later Sub-view list
  const reviewLaterQuestions = questions.filter(q =>
    (progress.reviewLater || []).includes(q.uniqueId)
  );

  if (activeSubView === 'review-later') {
    return (
      <div className="flex-1 flex flex-col justify-between overflow-hidden pb-6 safe-padding-bottom bg-transparent">
        <div>
          <div className="px-6 pt-5 pb-2.5 flex items-center justify-between text-xs font-semibold text-slate-500">
            <button
              onClick={() => setActiveSubView(null)}
              className="flex items-center gap-1.5 text-slate-550 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer font-black uppercase tracking-wider text-[10px]"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <span className="font-black text-slate-450 uppercase tracking-widest text-[9px]">Review Later ({totalReviewLater})</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 mt-1" />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
          {reviewLaterQuestions.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-[28px] text-center space-y-3 bg-white dark:bg-slate-900 shadow-premium max-w-xs mx-auto mt-10">
              <Clock className="mx-auto text-slate-350 dark:text-slate-550" size={32} />
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Queue is Empty</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-405 leading-relaxed">
                You can flag any question for "Review Later" inside MCQ practice screens to see them compiled here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviewLaterQuestions.map((q) => {
                const ch = getChaptersByMaterial(q.material).find(c => c.id === q.chapterId);
                return (
                  <div
                    key={q.uniqueId}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-[24px] p-5 shadow-premium space-y-4 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <span>{q.material.toUpperCase()} • Ch {ch?.num}</span>
                      <button
                        onClick={() => toggleReviewLater(q.uniqueId)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-lg transition-all cursor-pointer"
                        title="Remove flag"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                      {q.question}
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 text-[10px] font-extrabold border border-slate-100 dark:border-slate-850 flex justify-between items-center leading-normal">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Correct Option:</span>
                      <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 rounded-lg">
                        {q.correct_answer}) {q[`option_${q.correct_answer.toLowerCase()}` as keyof typeof q]}
                      </span>
                    </div>
                    <button
                      onClick={() => handleResumeQuestion(q)}
                      className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer tap-bounce"
                    >
                      Practice Question
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <footer className="px-6 pt-2">
          <button
            onClick={() => setActiveSubView(null)}
            className="w-full py-4 bg-teal-605 hover:bg-teal-700 text-white font-extrabold rounded-2xl text-xs uppercase tracking-widest shadow-md cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5 tap-bounce"
            style={{ minHeight: '52px' }}
          >
            Go Back
          </button>
        </footer>
      </div>
    );
  }

  if (activeSubView === 'about') {
    return (
      <div className="flex-1 flex flex-col justify-between overflow-hidden pb-6 safe-padding-bottom bg-transparent">
        <div>
          <div className="px-6 pt-5 pb-2.5 flex items-center justify-between text-xs font-semibold text-slate-500">
            <button
              onClick={() => setActiveSubView(null)}
              className="flex items-center gap-1.5 text-slate-550 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer font-black uppercase tracking-wider text-[10px]"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <span className="font-black text-slate-450 uppercase tracking-widest text-[9px]">About App</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 mt-1" />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center justify-center space-y-6 text-center">
          {/* Logo */}
          <div className="relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-teal-600 to-emerald-500 rounded-[32px] blur opacity-20" />
            <div className="relative w-28 h-28 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-[32px] flex items-center justify-center shadow-lg p-4">
              <img src={logo} alt="JO Sphere Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-805 dark:text-slate-100 font-sans tracking-tight leading-none">JO Sphere</h3>
            <p className="text-[10px] font-black text-teal-600 dark:text-teal-405 uppercase tracking-widest leading-none pt-1">Learn • Revise • Succeed</p>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider pt-3 leading-none">Version 1.2.0</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide leading-none pt-0.5">Developed by JO Sphere Team</p>
          </div>

          <p className="text-xs text-slate-655 dark:text-slate-400 leading-relaxed max-w-xs font-medium font-sans">
            JO Sphere is a mobile-first learning, revision, and exam preparation platform designed to help learners study smarter, revise efficiently, and achieve success.
          </p>
        </div>

        <footer className="px-6 pt-2">
          <button
            onClick={() => setActiveSubView(null)}
            className="w-full py-4 bg-teal-605 hover:bg-teal-700 text-white font-extrabold rounded-2xl text-xs uppercase tracking-widest shadow-md cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5 tap-bounce"
            style={{ minHeight: '52px' }}
          >
            Go Back
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-24 pt-5 space-y-7 bg-transparent scrollbar-thin">
      {/* Header with Logo */}
      <div className="flex flex-col items-center text-center space-y-4 py-2">
        <div className="w-16 h-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-3 shadow-premium flex items-center justify-center">
          <img src={logo} alt="JO Sphere Logo" className="w-full h-full object-contain" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-slate-850 dark:text-slate-100 font-sans tracking-tight leading-none">Settings</h2>
          <p className="text-[9px] text-teal-600 dark:text-teal-400 font-black uppercase tracking-widest leading-none pt-0.5">Learn • Revise • Succeed</p>
        </div>
      </div>

      {/* User Profile Card */}
      <section className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-[28px] p-5 shadow-premium flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-3.5">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-11 h-11 rounded-full border border-teal-500/20 object-cover"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-teal-600 dark:bg-teal-900 text-white flex items-center justify-center font-bold text-sm uppercase">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div>
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-150 leading-none">
              {user?.displayName}
            </h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 leading-none">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => setProfileDrawerOpen(true)}
          className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-400 font-black text-[9px] uppercase rounded-xl tracking-wider active:scale-95 transition-all shadow-sm border border-teal-100/20 dark:border-teal-900/40 cursor-pointer tap-bounce"
        >
          Manage
        </button>
      </section>

      {/* 1. Revision Queues Shortcuts */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">1. Study Queues</h3>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-[28px] shadow-premium divide-y divide-slate-100 dark:divide-slate-850/80 overflow-hidden transition-all duration-300">
          
          {/* Mistakes Log */}
          <button
            onClick={() => navigate('mistakes')}
            className="w-full px-5 min-h-[64px] flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-rose-50 text-rose-600 dark:bg-rose-955/20 dark:text-rose-400 rounded-xl">
                <AlertTriangle size={16} />
              </div>
              <div className="text-left">
                <p className="font-black text-slate-800 dark:text-slate-200">Mistakes Log</p>
                <p className="text-[9px] text-slate-450 dark:text-slate-400 leading-none font-bold mt-1">Incorrect answers folder</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 font-extrabold">
              <span className="bg-rose-100 text-rose-805 dark:bg-rose-955/40 dark:text-rose-400 px-2 py-0.5 rounded-lg text-[9px] font-black">{totalMistakes}</span>
              <ChevronRight size={16} />
            </div>
          </button>

          {/* Bookmarks */}
          <button
            onClick={() => navigate('bookmarks')}
            className="w-full px-5 min-h-[64px] flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-amber-50 text-amber-500 dark:bg-amber-955/20 rounded-xl">
                <Bookmark size={16} />
              </div>
              <div className="text-left">
                <p className="font-black text-slate-800 dark:text-slate-200">Bookmarked Cards</p>
                <p className="text-[9px] text-slate-455 dark:text-slate-400 leading-none font-bold mt-1">Flagged review points</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 font-extrabold">
              <span className="bg-amber-100 text-amber-805 dark:bg-amber-955/40 dark:text-amber-400 px-2 py-0.5 rounded-lg text-[9px] font-black">{totalBookmarks}</span>
              <ChevronRight size={16} />
            </div>
          </button>

          {/* Review Later */}
          <button
            onClick={() => setActiveSubView('review-later')}
            className="w-full px-5 min-h-[64px] flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850/40 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-teal-50 text-teal-600 dark:bg-teal-950/30 rounded-xl">
                <Clock size={16} />
              </div>
              <div className="text-left">
                <p className="font-black text-slate-800 dark:text-slate-200">Review Later</p>
                <p className="text-[9px] text-slate-450 dark:text-slate-400 leading-none font-bold mt-1">Flagged study queue</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 font-extrabold">
              <span className="bg-teal-100 text-teal-805 dark:bg-teal-950/60 dark:text-teal-400 px-2 py-0.5 rounded-lg text-[9px] font-black">{totalReviewLater}</span>
              <ChevronRight size={16} />
            </div>
          </button>

        </div>
      </section>

      {/* 2. Theme & Customization Settings */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">2. Customize Interface</h3>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-[28px] p-5 shadow-premium space-y-5 transition-all duration-300">
          
          {/* Theme Mode Selector */}
          <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
            <div>
              <p className="font-black text-slate-800 dark:text-slate-200">Appearance Mode</p>
              <p className="text-[9px] text-slate-450 dark:text-slate-500 font-bold mt-1">Toggle light and dark themes</p>
            </div>
            <button
              onClick={handleToggleTheme}
              className="w-11 h-11 flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 active:scale-95 transition-all cursor-pointer text-slate-700 dark:text-slate-300 tap-bounce"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          {/* High Contrast */}
          <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200 pt-3.5 border-t border-slate-100 dark:border-slate-850/80">
            <div>
              <p className="font-black text-slate-800 dark:text-slate-200">High Contrast Mode</p>
              <p className="text-[9px] text-slate-450 dark:text-slate-500 font-bold mt-1">Increases accessibility borders</p>
            </div>
            <button
              onClick={handleToggleContrast}
              className="h-11 px-4.5 text-[10px] font-black uppercase rounded-xl border transition-all cursor-pointer flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-850 tap-bounce"
            >
              {settings.highContrast ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Typography Selector */}
          <div className="space-y-3 pt-3.5 border-t border-slate-100 dark:border-slate-855/80">
            <div>
              <p className="text-xs font-black text-slate-800 dark:text-slate-200">Typography Scale</p>
              <p className="text-[9px] text-slate-450 dark:text-slate-505 font-bold mt-1">Set the question reading size</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-left">
              {fontSizes.map((f) => {
                const isSelected = settings.fontSize === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => updateSettings({ fontSize: f.value })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer tap-bounce ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-950/20 text-teal-800 dark:text-teal-300'
                        : 'border-slate-100 dark:border-slate-850 hover:border-slate-300 bg-slate-50/20 dark:bg-slate-950/40'
                    }`}
                  >
                    <p className="text-xs font-black">{f.label}</p>
                    <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold leading-none mt-1 uppercase tracking-wider">{f.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* 3. Reset Options */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">3. Danger Zone</h3>
        <div className="bg-rose-50/50 dark:bg-rose-955/10 border border-rose-100/50 dark:border-rose-950/20 rounded-[28px] p-5 shadow-premium">
          <div className="flex justify-between items-center text-xs font-bold text-slate-805 dark:text-slate-200">
            <div>
              <p className="font-black text-rose-800 dark:text-rose-400">Reset Study Records</p>
              <p className="text-[9px] text-rose-600/70 dark:text-rose-450/70 leading-none font-bold mt-1.5">Erase all scores, stats, bookmarks</p>
            </div>
            <button
              onClick={resetProgress}
              className="w-11 h-11 flex items-center justify-center bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl border border-rose-200/55 dark:border-rose-900 active:scale-95 transition-all cursor-pointer tap-bounce"
              title="Reset progress"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* 4. About Details */}
      <button
        onClick={() => setActiveSubView('about')}
        className="w-full bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-[28px] p-5 shadow-premium text-center space-y-2 select-none cursor-pointer hover:border-teal-500 active:scale-[0.99] transition-all flex flex-col items-center tap-bounce"
      >
        <Info className="text-teal-500" size={20} />
        <h4 className="text-xs font-black text-slate-800 dark:text-slate-250 uppercase tracking-wider">About JO Sphere</h4>
        <p className="text-[9px] text-slate-400 leading-relaxed font-bold uppercase tracking-wide">
          Version 1.2.0 • View application info
        </p>
      </button>
    </div>
  );
};
