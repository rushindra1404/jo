import React from 'react';
import { useApp } from '../context/AppContext';
import { Zap, Award, Calendar, Percent } from 'lucide-react';

export const StudyStreakCard: React.FC = () => {
  const { progress } = useApp();
  const stats = progress.sessionStats;
  const logs = progress.dailyLogs || {};

  // Streak details
  const currentStreak = stats.streakDays || 0;
  const bestStreak = stats.longestStreak || 0;

  // Calculate study days in the current month (June 2026)
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed, June is 5
  
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  
  const currentMonthLogs = Object.keys(logs).filter(dateStr => 
    dateStr.startsWith(monthPrefix)
  );

  const studyDaysThisMonth = currentMonthLogs.filter(dateStr => 
    logs[dateStr].questionsAttempted > 0
  ).length;

  const totalDaysPassedThisMonth = today.getDate(); // e.g. 20th day of June

  // Consistency Score calculation
  const consistencyScore = totalDaysPassedThisMonth > 0
    ? Math.round((studyDaysThisMonth / totalDaysPassedThisMonth) * 100)
    : 0;

  let consistencyStatus = 'Needs Improvement';
  let statusColor = 'text-rose-500 bg-rose-50 dark:bg-rose-955/20';
  if (consistencyScore >= 85) {
    consistencyStatus = 'Excellent';
    statusColor = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-955/20';
  } else if (consistencyScore >= 70) {
    consistencyStatus = 'Good';
    statusColor = 'text-yellow-600 bg-yellow-50 dark:bg-yellow-955/20';
  } else if (consistencyScore >= 50) {
    consistencyStatus = 'Average';
    statusColor = 'text-orange-500 bg-orange-50 dark:bg-orange-955/20';
  }

  const totalStudyDays = Object.values(logs).filter(log => log.questionsAttempted > 0).length;

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, consistencyScore) / 100) * circumference;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-5">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
        <h3 className="text-xs font-extrabold uppercase text-slate-404 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
          <Zap size={14} className="text-orange-500 fill-orange-500" /> Study Streak Analytics
        </h3>
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${statusColor}`}>
          {consistencyStatus}
        </span>
      </div>

      {/* Circle progress and stats */}
      <div className="flex items-center justify-between gap-4">
        
        {/* SVG Circle Progress */}
        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="currentColor"
              className="text-slate-100 dark:text-slate-800"
              strokeWidth={6}
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="#e11d48" // Rose color
              strokeWidth={6}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-base font-black text-rose-500 font-sans">{currentStreak}d</span>
            <span className="text-[7px] text-slate-404 uppercase tracking-widest font-black">Streak</span>
          </div>
        </div>

        {/* 2x2 Grid Stats */}
        <div className="flex-1 grid grid-cols-2 gap-2 text-xs font-bold">
          
          <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-xl flex items-center gap-2">
            <div className="p-1.5 bg-orange-50 dark:bg-orange-955/20 text-orange-500 rounded-lg shrink-0">
              <Zap size={14} fill="currentColor" />
            </div>
            <div>
              <span className="text-[9px] text-slate-404 font-medium block uppercase tracking-wider">Current</span>
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 font-sans">{currentStreak} Days</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-xl flex items-center gap-2">
            <div className="p-1.5 bg-yellow-50 dark:bg-yellow-955/20 text-yellow-500 rounded-lg shrink-0">
              <Award size={14} />
            </div>
            <div>
              <span className="text-[9px] text-slate-404 font-medium block uppercase tracking-wider">Best Streak</span>
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 font-sans">{bestStreak} Days</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-xl flex items-center gap-2">
            <div className="p-1.5 bg-cyan-50 dark:bg-cyan-955/20 text-cyan-500 rounded-lg shrink-0">
              <Calendar size={14} />
            </div>
            <div>
              <span className="text-[9px] text-slate-404 font-medium block uppercase tracking-wider">This Month</span>
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 font-sans">{studyDaysThisMonth} Days</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-xl flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-500 rounded-lg shrink-0">
              <Percent size={14} />
            </div>
            <div>
              <span className="text-[9px] text-slate-404 font-medium block uppercase tracking-wider">Consistency</span>
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 font-sans">{consistencyScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="grid grid-cols-2 gap-3 pt-3.5 border-t border-slate-150 dark:border-slate-850 text-xs font-semibold leading-relaxed">
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 p-2 rounded-xl">
          <span className="text-slate-404 font-medium">Total Study Days:</span>
          <span className="text-slate-800 dark:text-slate-202 font-extrabold">{totalStudyDays}</span>
        </div>
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 p-2 rounded-xl">
          <span className="text-slate-404 font-medium">Monthly Active Ratio:</span>
          <span className="text-slate-800 dark:text-slate-202 font-extrabold">{studyDaysThisMonth}/{totalDaysPassedThisMonth}</span>
        </div>
      </div>

    </div>
  );
};