import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Search, Bookmark, AlertTriangle, BarChart2 } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeRoute, navigate } = useApp();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
    { id: 'mistakes', label: 'Mistakes', icon: AlertTriangle },
    { id: 'dashboard', label: 'Stats', icon: BarChart2 },
  ];

  // Don't show bottom nav inside active study or exam sessions to maximize screen area and prevent accidental clicks
  const hideBottomNav = ['study', 'exam', 'random-revision'].includes(activeRoute);

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
              className={`flex flex-col items-center justify-center flex-1 h-full text-xs font-medium cursor-pointer transition-colors ${
                isActive
                  ? 'text-cyan-600 dark:text-cyan-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              aria-label={item.label}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-cyan-50 dark:bg-cyan-950/30 scale-105' : ''
              }`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="mt-0.5 tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
