import React from 'react';
import { useApp } from '../context/AppContext';
import { TrendingUp, Info } from 'lucide-react';

export const ActivityInsightsCard: React.FC = () => {
  const { progress } = useApp();
  const logs = progress.dailyLogs || {};

  const getInsights = () => {
    const insightsList: string[] = [];
    const logEntries = Object.values(logs);
    if (logEntries.length === 0) {
      return ['Start practicing flashcards to generate learning activity insights!'];
    }

    const today = new Date();

    // 1. Streak / Consecutive Days studied this week
    let consecutiveDays = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (logs[dateStr] && logs[dateStr].questionsAttempted > 0) {
        consecutiveDays += 1;
      }
    }
    if (consecutiveDays >= 3) {
      insightsList.push(`You studied on ${consecutiveDays} consecutive days this week. Excellent discipline!`);
    } else {
      insightsList.push(`Aim to study at least 5 minutes daily to build consistent learning habits.`);
    }

    // 2. Most Productive Day
    const sortedByAttempt = [...logEntries].sort((a, b) => b.questionsAttempted - a.questionsAttempted);
    const mostProductive = sortedByAttempt[0];
    if (mostProductive && mostProductive.questionsAttempted > 0) {
      const d = new Date(mostProductive.date);
      const dateString = d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
      insightsList.push(`Your most productive revision day was ${dateString}, completing ${mostProductive.questionsAttempted} questions.`);
    }

    // 3. Weekday vs Weekend Accuracy
    let weekendAttempted = 0;
    let weekendCorrect = 0;
    let weekdayAttempted = 0;
    let weekdayCorrect = 0;

    logEntries.forEach(log => {
      const d = new Date(log.date).getDay();
      const isWeekend = d === 0 || d === 6; // Sunday or Saturday
      if (isWeekend) {
        weekendAttempted += log.questionsAttempted;
        weekendCorrect += log.correctAnswers;
      } else {
        weekdayAttempted += log.questionsAttempted;
        weekdayCorrect += log.correctAnswers;
      }
    });

    const weekendAccuracy = weekendAttempted > 0 ? Math.round((weekendCorrect / weekendAttempted) * 100) : 0;
    const weekdayAccuracy = weekdayAttempted > 0 ? Math.round((weekdayCorrect / weekdayAttempted) * 100) : 0;

    if (weekendAttempted > 0 && weekdayAttempted > 0) {
      if (weekendAccuracy > weekdayAccuracy) {
        insightsList.push(`You answer questions most accurately on weekends (${weekendAccuracy}% vs ${weekdayAccuracy}%).`);
      } else if (weekdayAccuracy > weekendAccuracy) {
        insightsList.push(`Your accuracy peaks on weekdays (${weekdayAccuracy}% vs ${weekendAccuracy}%) when habits are structured.`);
      }
    }

    // 4. Comparison vs Last Month (May vs June)
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // June is 5
    const thisMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const lastMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    const thisMonthLogs = logEntries.filter(log => log.date.startsWith(thisMonthPrefix));
    const lastMonthLogs = logEntries.filter(log => log.date.startsWith(lastMonthPrefix));

    const thisMonthAttempted = thisMonthLogs.reduce((acc, curr) => acc + curr.questionsAttempted, 0);
    const lastMonthAttempted = lastMonthLogs.reduce((acc, curr) => acc + curr.questionsAttempted, 0);

    if (thisMonthAttempted > 0 && lastMonthAttempted > 0) {
      const volumeDiff = thisMonthAttempted - lastMonthAttempted;
      if (volumeDiff > 0) {
        insightsList.push(`You completed ${volumeDiff} more questions this month compared to last month.`);
      }

      const thisMonthActiveDays = thisMonthLogs.filter(log => log.questionsAttempted > 0).length;
      const lastMonthActiveDays = lastMonthLogs.filter(log => log.questionsAttempted > 0).length;
      const consistencyDiff = Math.round((thisMonthActiveDays / 30) * 100) - Math.round((lastMonthActiveDays / 31) * 100);
      if (consistencyDiff > 0) {
        insightsList.push(`Your study consistency score improved by ${consistencyDiff}% this month.`);
      }
    } else {
      insightsList.push('Your performance score rises with continuous practice. Review at least 20 cards daily.');
    }

    return insightsList.slice(0, 4);
  };

  const insights = getInsights();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <TrendingUp size={16} className="text-cyan-600 dark:text-cyan-400" />
        <h3 className="text-xs font-extrabold uppercase text-slate-404 dark:text-slate-500 tracking-wider">
          Advisor Insights Engine
        </h3>
      </div>

      <div className="space-y-3.5">
        {insights.map((insight, index) => (
          <div key={index} className="flex gap-3 items-start text-xs font-semibold text-slate-700 dark:text-slate-355 bg-slate-50 dark:bg-slate-955 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 leading-relaxed">
            <div className="p-1 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 rounded-lg shrink-0 mt-0.5">
              <Info size={12} />
            </div>
            <p>{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
};