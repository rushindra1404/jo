import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, ChevronLeft, ChevronRight, BarChart2, Info, Check, X, Clock, HelpCircle, XCircle } from 'lucide-react';
import type { DailyActivityLog } from '../types';

export const ActivityCalendar: React.FC = () => {
  const { progress } = useApp();
  const logs = progress.dailyLogs || {};

  // Calendar Date selectors
  const [selectedMonth, setSelectedMonth] = useState<number>(5); // Default to June (5)
  const [selectedYear] = useState<number>(2026); // Default to 2026
  const [activeDetailLog, setActiveDetailLog] = useState<DailyActivityLog | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Shading helper based on intensity of questions attempted
  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400';
    if (count <= 20) return 'bg-emerald-100 dark:bg-emerald-955/40 text-emerald-800 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900';
    if (count <= 50) return 'bg-emerald-300 dark:bg-emerald-850/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
    if (count <= 100) return 'bg-emerald-500 text-white border border-emerald-600';
    return 'bg-emerald-700 text-emerald-100 border border-emerald-800';
  };

  // Generate calendar grid dates for June (5) or May (4) 2026
  const generateGrid = () => {
    const daysInMonth = selectedMonth === 5 ? 30 : 31;
    const startDayOffset = selectedMonth === 5 ? 1 : 5; // Monday for June, Friday for May
    const grid: (DailyActivityLog | null)[] = [];

    for (let i = 0; i < startDayOffset; i++) {
      grid.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const log = logs[dateStr] || {
        date: dateStr,
        questionsAttempted: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        accuracy: 0,
        studyTimeMinutes: 0,
        material: 'None',
        chapter: 'None',
      };
      grid.push(log);
    }
    return grid;
  };

  const daysGrid = generateGrid();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => {
    if (selectedMonth === 5) setSelectedMonth(4);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 4) setSelectedMonth(5);
  };

  const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const currentMonthLogs = Object.values(logs).filter(log => log.date.startsWith(monthPrefix));
  const activeLogs = currentMonthLogs.filter(log => log.questionsAttempted > 0);

  const mostActiveDayLog = activeLogs.length > 0
    ? [...activeLogs].sort((a, b) => b.questionsAttempted - a.questionsAttempted)[0]
    : null;

  const totalQuestionsMonth = activeLogs.reduce((acc, curr) => acc + curr.questionsAttempted, 0);
  const totalCorrectMonth = activeLogs.reduce((acc, curr) => acc + curr.correctAnswers, 0);
  const avgAccuracyMonth = activeLogs.length > 0
    ? Math.round((totalCorrectMonth / totalQuestionsMonth) * 100)
    : 0;

  const consistencyRate = Math.round((activeLogs.length / (selectedMonth === 5 ? 20 : 31)) * 100);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
      
      {/* Calendar Header with Controls */}
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-xs font-extrabold uppercase text-slate-404 dark:text-slate-500 tracking-wider flex items-center gap-1.5">
          <Calendar size={14} className="text-cyan-600 dark:text-cyan-400" /> Activity Calendar
        </h3>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            disabled={selectedMonth === 4}
            className="p-1 rounded-lg text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-202 min-w-[90px] text-center">
            {monthNames[selectedMonth]} {selectedYear}
          </span>
          <button
            onClick={handleNextMonth}
            disabled={selectedMonth === 5}
            className="p-1 rounded-lg text-slate-400 active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Grid container */}
      <div className="space-y-3">
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-black uppercase text-slate-404 tracking-wider">
          {weekDays.map(d => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {daysGrid.map((dayLog, idx) => {
            if (dayLog === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const dayNum = parseInt(dayLog.date.split('-')[2]);
            const isToday = dayLog.date === new Date().toISOString().split('T')[0];
            const hasActivity = dayLog.questionsAttempted > 0;

            return (
              <button
                key={dayLog.date}
                onClick={() => setActiveDetailLog(dayLog)}
                className={`aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all active:scale-90 cursor-pointer relative ${getIntensityClass(dayLog.questionsAttempted)} ${
                  isToday ? 'ring-2 ring-cyan-600 ring-offset-2 dark:ring-offset-slate-900' : ''
                }`}
                title={`${dayLog.date}: ${dayLog.questionsAttempted} attempts`}
              >
                {dayNum}
                {hasActivity && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white dark:bg-emerald-300 opacity-60" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[9px] font-extrabold text-slate-404 uppercase pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>Less Active</span>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-3.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            <div className="w-3.5 h-3.5 rounded bg-emerald-100 dark:bg-emerald-955/40" />
            <div className="w-3.5 h-3.5 rounded bg-emerald-300 dark:bg-emerald-850/60" />
            <div className="w-3.5 h-3.5 rounded bg-emerald-500" />
            <div className="w-3.5 h-3.5 rounded bg-emerald-700" />
          </div>
          <span>More Active</span>
        </div>
      </div>

      {/* Calendar Metrics Summary */}
      <div className="bg-slate-50 dark:bg-slate-955 rounded-2xl p-4 space-y-3 text-xs font-semibold">
        <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-slate-404 tracking-wider">
          <span>Calendar Analytics</span>
          <BarChart2 size={12} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-404 block font-medium">Most Active Day</span>
            <span className="font-bold text-slate-800 dark:text-slate-202">
              {mostActiveDayLog
                ? `${new Date(mostActiveDayLog.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} (${mostActiveDayLog.questionsAttempted} q)`
                : 'None'}
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-404 block font-medium">Study Frequency</span>
            <span className="font-bold text-slate-800 dark:text-slate-202">
              {consistencyRate}% of days
            </span>
          </div>
          <div className="space-y-0.5 border-t border-slate-200 dark:border-slate-800 pt-2">
            <span className="text-[10px] text-slate-404 block font-medium">Questions Attempted</span>
            <span className="font-bold text-slate-800 dark:text-slate-202">
              {totalQuestionsMonth} questions
            </span>
          </div>
          <div className="space-y-0.5 border-t border-slate-200 dark:border-slate-800 pt-2">
            <span className="text-[10px] text-slate-404 block font-medium">Average Accuracy</span>
            <span className="font-bold text-slate-800 dark:text-slate-202">
              {avgAccuracyMonth}%
            </span>
          </div>
        </div>
      </div>

      {/* Details modal overlay */}
      {activeDetailLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            <button
              onClick={() => setActiveDetailLog(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
              aria-label="Close details"
            >
              <X size={18} />
            </button>

            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-[9px] font-black uppercase text-cyan-600 dark:text-cyan-400 tracking-wider">Daily Practice Metrics</span>
              <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 font-sans">
                {new Date(activeDetailLog.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h4>
            </div>

            <div className="py-4 space-y-4">
              {activeDetailLog.questionsAttempted > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-2xl">
                      <span className="text-[10px] text-slate-404 font-bold block uppercase tracking-wider">Questions</span>
                      <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-sans">{activeDetailLog.questionsAttempted}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-955 p-3 rounded-2xl">
                      <span className="text-[10px] text-slate-404 font-bold block uppercase tracking-wider">Accuracy</span>
                      <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-sans">{activeDetailLog.accuracy}%</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-355">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 px-3 py-2 rounded-xl">
                      <span className="text-slate-404 flex items-center gap-1"><Check size={14} className="text-emerald-500" /> Correct Answers:</span>
                      <span className="font-extrabold text-slate-850 dark:text-slate-100">{activeDetailLog.correctAnswers}</span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 px-3 py-2 rounded-xl">
                      <span className="text-slate-404 flex items-center gap-1"><XCircle size={14} className="text-rose-500" /> Wrong Answers:</span>
                      <span className="font-extrabold text-slate-850 dark:text-slate-100">{activeDetailLog.wrongAnswers}</span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 px-3 py-2 rounded-xl">
                      <span className="text-slate-404 flex items-center gap-1"><Clock size={14} className="text-indigo-500" /> Study Duration:</span>
                      <span className="font-extrabold text-slate-850 dark:text-slate-100">{activeDetailLog.studyTimeMinutes} Minutes</span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 px-3 py-2 rounded-xl">
                      <span className="text-slate-404 flex items-center gap-1"><HelpCircle size={14} className="text-amber-500" /> Active Material:</span>
                      <span className="font-extrabold text-slate-805 dark:text-slate-100">{activeDetailLog.material}</span>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-955 px-3 py-2 rounded-xl">
                      <span className="text-slate-404 flex items-center gap-1"><Info size={14} className="text-cyan-500" /> Study Topic:</span>
                      <span className="font-extrabold text-slate-805 dark:text-slate-100 truncate max-w-[150px]">{activeDetailLog.chapter}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-slate-400 dark:text-slate-600 space-y-2">
                  <div className="mx-auto w-12 h-12 bg-slate-50 dark:bg-slate-955 rounded-full flex items-center justify-center text-slate-300">
                    <Calendar size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-404">No activity recorded</h4>
                  <p className="text-xs max-w-xs mx-auto">You did not attempt any practice exam questions or flashcards on this day.</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveDetailLog(null)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-202 text-xs font-bold uppercase rounded-xl tracking-wider text-center cursor-pointer active:scale-95 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};