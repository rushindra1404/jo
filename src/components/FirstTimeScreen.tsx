import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Compass, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const FirstTimeScreen: React.FC = () => {
  const { user, setFirstTimeCompleted } = useAuth();
  const { navigate } = useApp();

  const handleContinue = () => {
    setFirstTimeCompleted();
    navigate('home');
  };

  const steps = [
    { title: 'Learn Chapters', desc: 'Read department revision notes, points and definitions.' },
    { title: 'Interactive Flashcards', desc: 'Drill MCQ revision blocks with real-time accuracy checks.' },
    { title: 'CBT Mock Exams', desc: 'Simulate full test runs with timed exam conditions.' },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto px-6 py-12 bg-white dark:bg-slate-900 transition-colors duration-200">
      
      {/* Welcome Message */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 my-auto text-center">
        {/* Animated Celebration Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-20 animate-pulse" />
          <div className="relative w-20 h-20 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-full flex items-center justify-center">
            <Compass className="w-10 h-10 animate-spin-slow" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 font-sans tracking-tight leading-tight">
            Welcome, {user?.firstName} 👋
          </h2>
          <p className="text-xs font-semibold text-slate-400 max-w-xs mx-auto leading-normal">
            Let's start your preparation journey.
          </p>
        </div>

        {/* Feature Overview Cards */}
        <div className="w-full max-w-xs space-y-3.5 text-left pt-2">
          {steps.map((st, idx) => (
            <div 
              key={idx} 
              className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-2xl"
            >
              <CheckCircle2 className="text-cyan-600 dark:text-cyan-400 mt-0.5 shrink-0" size={16} />
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {st.title}
                </h4>
                <p className="text-[10px] text-slate-450 leading-relaxed mt-0.5 font-medium">
                  {st.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Area */}
      <div className="w-full max-w-sm mx-auto space-y-4">
        <button
          onClick={handleContinue}
          className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-2xl text-xs uppercase tracking-widest text-center cursor-pointer shadow-md hover:shadow-lg active:scale-[0.98] transition-all min-h-[52px] flex items-center justify-center gap-1.5"
        >
          Get Started <Sparkles size={14} />
        </button>
      </div>

    </div>
  );
};
