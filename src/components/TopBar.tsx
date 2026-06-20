import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Eye, Type, Sun, Moon } from 'lucide-react';
import type { FontSizeOption } from '../types';

export const TopBar: React.FC = () => {
  const {
    activeRoute,
    navigate,
    activeMaterial,
    settings,
    updateSettings,
  } = useApp();
  const { theme, toggleTheme } = useTheme();

  const [showFontMenu, setShowFontMenu] = useState(false);
  const isSubScreen = ['chapter-select', 'study', 'exam', 'random-revision'].includes(activeRoute);

  const handleBack = () => {
    if (activeRoute === 'chapter-select') {
      navigate('home');
    } else if (activeRoute === 'study') {
      navigate('chapter-select');
    } else if (activeRoute === 'exam' || activeRoute === 'random-revision') {
      if (window.confirm('Are you sure you want to exit? Your progress in this session will not be saved.')) {
        navigate('home');
      }
    } else {
      navigate('home');
    }
  };

  const getTitle = () => {
    switch (activeRoute) {
      case 'chapter-select':
        return activeMaterial === 'ica' ? 'ICA Chapters' : 'GPOE Chapters';
      case 'study':
        return 'Flashcards';
      case 'exam':
        return 'Practice Exam';
      case 'random-revision':
        return 'Random Revision';
      case 'mistakes':
        return 'My Mistakes';
      case 'bookmarks':
        return 'Bookmarks';
      case 'dashboard':
        return 'Progress Dashboard';
      case 'search':
        return 'Search Bank';
      default:
        return 'JO Sphere';
    }
  };

  const fontSizes: { value: FontSizeOption; label: string }[] = [
    { value: 'small', label: 'A-' },
    { value: 'medium', label: 'A' },
    { value: 'large', label: 'A+' },
    { value: 'xlarge', label: 'A++' },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md safe-padding-top transition-colors duration-200">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          {isSubScreen ? (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Go back"
            >
              <ArrowLeft size={22} />
            </button>
          ) : null}
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
            {getTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-1 relative">
          {/* High Contrast Toggle */}
          <button
            onClick={() => updateSettings({ highContrast: !settings.highContrast })}
            className={`p-2 rounded-xl text-slate-600 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800 min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer transition-colors ${
              settings.highContrast ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' : ''
            }`}
            title="Toggle High Contrast"
            aria-label="Toggle High Contrast"
          >
            <Eye size={20} />
          </button>

          {/* Adjust Text Size Menu Toggle */}
          <button
            onClick={() => setShowFontMenu(!showFontMenu)}
            className={`p-2 rounded-xl text-slate-600 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800 min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer transition-colors ${
              showFontMenu ? 'bg-slate-100 dark:bg-slate-800' : ''
            }`}
            title="Adjust Text Size"
            aria-label="Adjust Text Size"
          >
            <Type size={20} />
          </button>

          {showFontMenu && (
            <div className="absolute right-10 top-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-premium p-1 flex gap-1 z-50">
              {fontSizes.map((sz) => (
                <button
                  key={sz.value}
                  onClick={() => {
                    updateSettings({ fontSize: sz.value });
                    setShowFontMenu(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    settings.fontSize === sz.value
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800 min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer transition-colors tap-bounce"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? (
              <Sun size={20} className="text-amber-500 animate-pulse" />
            ) : (
              <Moon size={20} className="text-cyan-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};