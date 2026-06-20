import React from 'react';
import { useApp } from '../context/AppContext';
import { useExamStore } from '../store/examStore';
import { Home, BookOpen, ClipboardList, TrendingUp, Sliders } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeRoute, navigate } = useApp();
  const examMode = useExamStore(state => state.examMode);

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'exam-tab', label: 'Exam', icon: ClipboardList },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'more', label: 'More', icon: Sliders },
  ];

  // Hide bottom nav inside active study sessions, PDF readers, and flashcard practice sessions to maximize screen real estate
  const isExamRunning = activeRoute === 'exam' && examMode === 'running';
  const hideBottomNav = ['study', 'random-revision', 'pdf-viewer', 'flashcards-practice'].includes(activeRoute) || isExamRunning;

  if (hideBottomNav) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 safe-padding-bottom transition-colors duration-200">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full text-[10px] font-bold cursor-pointer transition-colors ${
                isActive
                  ? 'text-cyan-600 dark:text-cyan-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              aria-label={item.label}
            >
              <div className={`p-1 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-cyan-50 dark:bg-cyan-950/30 scale-105' : ''
              }`}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="mt-0.5 tracking-wider font-extrabold uppercase text-[8px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
