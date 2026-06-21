import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getChaptersByMaterial } from '../utils/chapters';
import {
  Bookmark,
  AlertTriangle,
  Clock,
  Sun,
  Moon,
  Info,
  ChevronRight,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import type { FontSizeOption } from '../types';
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
  } = useApp();
  const { user } = useAuth();

  const [activeSubView, setActiveSubView] = useState<'review-later' | 'about' | null>(null);

  const totalMistakes = progress.mistakes.length;
  const totalBookmarks = progress.bookmarks.length;
  const totalReviewLater = (progress.reviewLater || []).length;

  const fontSizes: { value: FontSizeOption; label: string; desc: string }[] = [
    { value: 'small', label: 'Small', desc: 'Compact view' },
    { value: 'medium', label: 'Medium', desc: 'Default text size' },
    { value: 'large', label: 'Large', desc: 'Larger text for readability' },
    { value: 'xlarge', label: 'Extra Large', desc: 'Maximum reading size' }
  ];

  const handleToggleTheme = () => {
    updateSettings({ darkMode: !settings.darkMode });
  };

  const handleToggleContrast = () => {
    updateSettings({ highContrast: !settings.highContrast });
  };

  // Review Later Sub-view list
  const reviewLaterQuestions = questions.filter(q =>
    (progress.reviewLater || []).includes(q.uniqueId)
  );

  if (activeSubView === 'review-later') {
    return (
      <div className="flex-1 flex flex-col justify-between overflow-hidden pb-6 safe-padding-bottom bg-transparent">
        <div>
          <div className="px-4 pt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
            <button
              onClick={() => setActiveSubView(null)}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer font-extrabold"
            >
              <ArrowLeft size={14} /> Back to More
            </button>
            <span className="font-bold text-slate-450">Review Later ({totalReviewLater})</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 mt-1" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {reviewLaterQuestions.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-2 bg-white dark:bg-slate-900 shadow-sm max-w-xs mx-auto mt-10">
              <Clock className="mx-auto text-slate-350 dark:text-slate-500" size={32} />
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase">Queue is Empty</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                You can flag any question for "Review Later" inside MCQ practice screens to see them compiled here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviewLaterQuestions.map((q) => {
                const ch = getChaptersByMaterial(q.material).find(c => c.id === q.chapterId);
                return (
                  <div
                    key={q.uniqueId}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-start text-[10px] font-black uppercase text-slate-400">
                      <span>{q.material.toUpperCase()} • Ch {ch?.num}</span>
                      <button
                        onClick={() => toggleReviewLater(q.uniqueId)}
                        className="p-1 text-slate-450 hover:text-rose-500 transition-all cursor-pointer"
                        title="Remove flag"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-normal">
                      {q.question}
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 text-[11px] font-bold border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400 font-bold">Correct option:</span>
                      <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 rounded-lg">
                        {q.correct_answer}) {q[`option_${q.correct_answer.toLowerCase()}` as keyof typeof q]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <footer className="px-4">
          <button
            onClick={() => setActiveSubView(null)}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-2xl text-sm uppercase tracking-wider shadow-md cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
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
          <div className="px-4 pt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
            <button
              onClick={() => setActiveSubView(null)}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer font-extrabold"
            >
              <ArrowLeft size={14} /> Back to Settings
            </button>
            <span className="font-bold text-slate-450">About App</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 mt-1" />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center justify-center space-y-6 text-center">
          {/* Logo */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-teal-500 rounded-3xl blur opacity-25" />
            <div className="relative w-28 h-28 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl flex items-center justify-center shadow-lg p-4">
              <img src={logo} alt="JO Sphere Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 font-sans leading-none">JO Sphere</h3>
            <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest leading-none pt-0.5">Learn • Revise • Succeed</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-2">Version 1.2.0</p>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs font-medium">
            JO Sphere is a mobile-first learning, revision, and exam preparation platform designed to help learners study smarter, revise efficiently, and achieve success.
          </p>
        </div>

        <footer className="px-4">
          <button
            onClick={() => setActiveSubView(null)}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-2xl text-sm uppercase tracking-wider shadow-md cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
            style={{ minHeight: '52px' }}
          >
            Go Back
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 space-y-6 bg-transparent">
      {/* Header with Logo */}
      <div className="flex flex-col items-center text-center space-y-4 py-2">
        <div className="w-16 h-16 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-2.5 shadow-md flex items-center justify-center">
          <img src={logo} alt="JO Sphere Logo" className="w-full h-full object-contain" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-850 dark:text-slate-100 font-sans leading-none">JO Sphere Settings</h2>
          <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-black uppercase tracking-widest leading-none pt-0.5">Learn • Revise • Succeed</p>
        </div>
      </div>

      {/* User Profile Card */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-11 h-11 rounded-full border border-cyan-500/20 object-cover"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-cyan-600 dark:bg-cyan-900 text-white flex items-center justify-center font-bold text-sm uppercase">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div>
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-150 leading-none">
              {user?.displayName}
            </h3>
            <p className="text-[9px] text-slate-400 font-semibold mt-1.5 leading-none">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => setProfileDrawerOpen(true)}
          className="px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[9px] uppercase rounded-xl tracking-wider active:scale-95 transition-all shadow-sm border border-slate-200 dark:border-slate-850 cursor-pointer"
        >
          Manage
        </button>
      </section>

      {/* 1. Revision Queues Shortcuts */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">1. Study Queues</h3>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
          
          {/* Mistakes Log */}
          <button
            onClick={() => navigate('mistakes')}
            className="w-full px-4 min-h-[56px] flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl">
                <AlertTriangle size={16} />
              </div>
              <div className="text-left">
                <p className="font-extrabold text-slate-800 dark:text-slate-200">Mistakes Log</p>
                <p className="text-[9px] text-slate-450 dark:text-slate-400 leading-none font-semibold mt-0.5">Incorrect answers folder</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 font-extrabold">
              <span className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-450 px-2 py-0.5 rounded-lg text-[9px] font-black">{totalMistakes}</span>
              <ChevronRight size={16} />
            </div>
          </button>

          {/* Bookmarks */}
          <button
            onClick={() => navigate('bookmarks')}
            className="w-full px-4 min-h-[56px] flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-500 dark:bg-amber-950/40 rounded-xl">
                <Bookmark size={16} />
              </div>
              <div className="text-left">
                <p className="font-extrabold text-slate-800 dark:text-slate-200">Bookmarked Cards</p>
                <p className="text-[9px] text-slate-450 dark:text-slate-400 leading-none font-semibold mt-0.5">Flagged review points</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 font-extrabold">
              <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 px-2 py-0.5 rounded-lg text-[9px] font-black">{totalBookmarks}</span>
              <ChevronRight size={16} />
            </div>
          </button>

          {/* Review Later */}
          <button
            onClick={() => setActiveSubView('review-later')}
            className="w-full px-4 min-h-[56px] flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 rounded-xl">
                <Clock size={16} />
              </div>
              <div className="text-left">
                <p className="font-extrabold text-slate-800 dark:text-slate-200">Review Later</p>
                <p className="text-[9px] text-slate-450 dark:text-slate-400 leading-none font-semibold mt-0.5">Flagged study queue</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 font-extrabold">
              <span className="bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-400 px-2 py-0.5 rounded-lg text-[9px] font-black">{totalReviewLater}</span>
              <ChevronRight size={16} />
            </div>
          </button>

        </div>
      </section>

      {/* 2. Theme & Customization Settings */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">2. Customize Interface</h3>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          
          {/* Theme Mode Selector */}
          <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
            <div>
              <p className="font-extrabold">Appearance Mode</p>
              <p className="text-[9px] text-slate-450 dark:text-slate-400 font-medium mt-0.5">Toggle light and dark themes</p>
            </div>
            <button
              onClick={handleToggleTheme}
              className="w-11 h-11 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 active:scale-95 transition-all cursor-pointer text-slate-700 dark:text-slate-300"
              title="Toggle Theme"
            >
              {settings.darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          {/* High Contrast */}
          <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div>
              <p className="font-extrabold">High Contrast Mode</p>
              <p className="text-[9px] text-slate-455 dark:text-slate-400 font-medium mt-0.5">Increases accessibility borders</p>
            </div>
            <button
              onClick={handleToggleContrast}
              className="h-11 px-4 text-xs font-black uppercase rounded-xl border transition-all cursor-pointer flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80"
            >
              {settings.highContrast ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Typography Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div>
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Typography Scale</p>
              <p className="text-[9px] text-slate-455 dark:text-slate-400 font-medium mt-0.5">Set the question reading size</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-left">
              {fontSizes.map((f) => {
                const isSelected = settings.fontSize === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => updateSettings({ fontSize: f.value })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-600 bg-cyan-50/20 dark:bg-cyan-950/20 text-cyan-800 dark:text-cyan-300'
                        : 'border-slate-150 dark:border-slate-850 hover:border-slate-350 bg-slate-50/20 dark:bg-slate-900/50'
                    }`}
                  >
                    <p className="text-xs font-extrabold">{f.label}</p>
                    <p className="text-[8px] text-slate-400 font-medium leading-none mt-0.5">{f.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* 3. Reset Options */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">3. Danger Zone</h3>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
            <div>
              <p className="font-extrabold">Reset Study Records</p>
              <p className="text-[9px] text-slate-450 dark:text-slate-400 leading-none font-semibold mt-1">Erase all scores, stats, bookmarks</p>
            </div>
            <button
              onClick={resetProgress}
              className="w-11 h-11 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-100 dark:border-rose-900 active:scale-95 transition-all cursor-pointer"
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
        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-center space-y-2 select-none cursor-pointer hover:border-cyan-500 active:scale-[0.99] transition-all flex flex-col items-center"
      >
        <Info className="text-cyan-500" size={20} />
        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-250">About JO Sphere</h4>
        <p className="text-[9px] text-slate-400 leading-relaxed font-semibold">
          Version 1.2.0 • View application info
        </p>
      </button>
    </div>
  );
};
