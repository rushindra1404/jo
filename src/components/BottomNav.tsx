import React from 'react';
import { useApp } from '../context/AppContext';
import { useExamStore } from '../store/examStore';
import { Home, BookOpen, ClipboardList, BarChart3, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export const BottomNav: React.FC = () => {
  const { activeRoute, navigate } = useApp();
  const examMode = useExamStore(state => state.examMode);

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'home', label: 'Learn', icon: BookOpen },
    { id: 'exam', label: 'Exam', icon: ClipboardList },
    { id: 'progress-mistakes', label: 'Progress', icon: BarChart3 },
    { id: 'more', label: 'More', icon: Settings },
  ];

  // Hide bottom nav inside active study sessions, PDF readers, and flashcard practice sessions to maximize screen real estate
  const isExamRunning = activeRoute === 'exam' && examMode === 'running';
  const hideBottomNav = ['study', 'random-revision', 'pdf-viewer', 'flashcards-practice'].includes(activeRoute) || isExamRunning;

  if (hideBottomNav) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 safe-padding-bottom transition-colors duration-300 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full text-[9px] font-black uppercase tracking-wider transition-all relative cursor-pointer ${
                isActive
                  ? 'text-teal-600 dark:text-teal-400 font-black'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-655 dark:hover:text-slate-300'
              }`}
              aria-label={item.label}
            >
              <div className="relative py-1.5 px-5 rounded-full flex items-center justify-center min-h-[32px] overflow-visible">
                {isActive && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute inset-0 bg-teal-50 dark:bg-teal-950/40 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon size={20} className="relative z-10" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="mt-1 relative z-10 text-[8px] tracking-widest font-black uppercase scale-90">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
