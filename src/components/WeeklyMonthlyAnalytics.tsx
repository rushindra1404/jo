import React from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Check, X, Award, BarChart2 } from 'lucide-react';

export const WeeklyMonthlyAnalytics: React.FC = () => {
  const { progress } = useApp();
  const logs = progress.dailyLogs || {};

  // --- 1. WEEKLY STATS CALCULATOR (Last 7 Days) ---
  const today = new Date();
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    weekDates.push(d.toISOString().split('T')[0]);
  }

  let weekAttempted = 0;
  let weekCorrect = 0;
  let weekWrong = 0;
  let weekStudyDays = 0;

  weekDates.forEach((dateStr) => {
    const log = logs[dateStr];
    if (log) {
      weekAttempted += log.questionsAttempted;
      weekCorrect += log.correctAnswers;
      weekWrong += log.wrongAnswers;
      if (log.questionsAttempted > 0) {
        weekStudyDays += 1;
      }
    }
  });

  const weekAccuracy = weekAttempted > 0
    ? Math.round((weekCorrect / weekAttempted) * 100)
    : 0;

  // --- 2. MONTHLY STATS CALCULATOR (June 2026) ---
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed, June is 5
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthName = monthNames[currentMonth];
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  
  const currentMonthLogs = Object.keys(logs).filter(dateStr => 
    dateStr.startsWith(monthPrefix)
  );

  let monthAttempted = 0;
  let monthCorrect = 0;
  let monthStudyDays = 0;

  currentMonthLogs.forEach((dateStr) => {
    const log = logs[dateStr];
    if (log) {
      monthAttempted += log.questionsAttempted;
      monthCorrect += log.correctAnswers;
      if (log.questionsAttempted > 0) {
        monthStudyDays += 1;
      }
    }
  });

  const monthAccuracy = monthAttempted > 0
    ? Math.round((monthCorrect / monthAttempted) * 100)
    : 0;

  const totalDaysPassedThisMonth = today.getDate(); // e.g. 20th day of June
  const avgQuestionsPerDay = monthStudyDays > 0
    ? Math.round(monthAttempted / monthStudyDays)
    : 0;

  return (
    <div className="grid grid-cols-1 gap-4">
      
      {/* Weekly Analytics Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
        <h4 className="text-xs font-extrabold uppercase text-slate-404 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
          <BarChart2 size={14} className="text-cyan-600 dark:text-cyan-400" /> Weekly Analytics
        </h4>

        <div className="grid grid-cols-2 gap-3 text-center text-xs font-bold">
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-404 font-bold block uppercase tracking-wider">Attempted</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-sans">{weekAttempted}</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-404 font-bold block uppercase tracking-wider">Accuracy</span>
            <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-sans">{weekAccuracy}%</span>
          </div>
        </div>

        <div className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 px-3 py-2 rounded-xl">
            <span className="text-slate-400 flex items-center gap-1">
              <Check size={14} className="text-emerald-500" /> Correct:
            </span>
            <span className="font-extrabold text-slate-805 dark:text-slate-100">{weekCorrect}</span>
          </div>
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 px-3 py-2 rounded-xl">
            <span className="text-slate-400 flex items-center gap-1">
              <X size={14} className="text-rose-500" /> Wrong:
            </span>
            <span className="font-extrabold text-slate-805 dark:text-slate-100">{weekWrong}</span>
          </div>
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 px-3 py-2 rounded-xl">
            <span className="text-slate-400 flex items-center gap-1">
              <Calendar size={14} className="text-cyan-500" /> Study Days:
            </span>
            <span className="font-extrabold text-slate-805 dark:text-slate-100">{weekStudyDays} / 7 days</span>
          </div>
        </div>
      </div>

      {/* Monthly Analytics Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
        <h4 className="text-xs font-extrabold uppercase text-slate-404 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
          <Award size={14} className="text-amber-500" /> Monthly Analytics Summary
        </h4>

        <div className="grid grid-cols-2 gap-3 text-center text-xs font-bold">
          <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-404 font-bold block uppercase tracking-wider">
              {monthName} {currentYear}
            </span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-sans">{monthAttempted}</span>
            <span className="text-[8px] text-slate-404 block font-bold uppercase mt-0.5">Attempted</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-404 font-bold block uppercase tracking-wider">Avg Per Day</span>
            <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-sans">{avgQuestionsPerDay}</span>
            <span className="text-[8px] text-slate-404 block font-bold uppercase mt-0.5">Questions</span>
          </div>
        </div>

        <div className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 px-3 py-2 rounded-xl">
            <span className="text-slate-404">Total Study Days:</span>
            <span className="font-extrabold text-slate-805 dark:text-slate-100">
              {monthStudyDays} of {totalDaysPassedThisMonth} passed
            </span>
          </div>
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 px-3 py-2 rounded-xl">
            <span className="text-slate-404">Average Accuracy:</span>
            <span className="font-extrabold text-slate-805 dark:text-slate-100">{monthAccuracy}%</span>
          </div>
        </div>
      </div>

    </div>
  );
};