import React from 'react';
import { useApp } from '../context/AppContext';
import { GPOE_CHAPTERS, ICA_CHAPTERS } from '../utils/chapters';
import { BookOpen } from 'lucide-react';

export const ProgressScreen: React.FC = () => {
  const { questions, progress, navigate, setActiveMaterial, setActiveChapterId, setStudyQuestionIndex } = useApp();

  const totalQuestions = questions.length || 3750;
  const attemptedQuestions = Object.keys(progress.attempts).length;
  const correctQuestions = Object.values(progress.attempts).filter(a => a.correct).length;
  const remainingQuestions = Math.max(0, totalQuestions - attemptedQuestions);

  // Overall Statistics
  const overallAccuracy = attemptedQuestions > 0
    ? Math.round((correctQuestions / attemptedQuestions) * 100)
    : 0;

  const completionPercent = totalQuestions > 0
    ? Math.round((attemptedQuestions / totalQuestions) * 100)
    : 0;

  // Exam Readiness Score calculation
  // Formula: Readiness = (Completion % * 0.4) + (Accuracy % * 0.6)
  const readinessScore = Math.round((completionPercent * 0.4) + (overallAccuracy * 0.6));

  const getReadinessStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', colorClass: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' };
    if (score >= 60) return { label: 'Good', colorClass: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/20' };
    if (score >= 45) return { label: 'Average', colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' };
    return { label: 'Needs Improvement', colorClass: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' };
  };

  const status = getReadinessStatus(readinessScore);

  // Material breakdowns
  const icaQuestions = questions.filter(q => q.material === 'ica');
  const icaAttempted = icaQuestions.filter(q => progress.attempts[q.uniqueId] !== undefined).length;
  const icaCorrect = icaQuestions.filter(q => progress.attempts[q.uniqueId]?.correct).length;
  const icaAccuracy = icaAttempted > 0 ? Math.round((icaCorrect / icaAttempted) * 100) : 0;
  const icaCompletion = icaQuestions.length > 0 ? Math.round((icaAttempted / icaQuestions.length) * 100) : 0;

  const gpoeQuestions = questions.filter(q => q.material === 'gpoe');
  const gpoeAttempted = gpoeQuestions.filter(q => progress.attempts[q.uniqueId] !== undefined).length;
  const gpoeCorrect = gpoeQuestions.filter(q => progress.attempts[q.uniqueId]?.correct).length;
  const gpoeAccuracy = gpoeAttempted > 0 ? Math.round((gpoeCorrect / gpoeAttempted) * 100) : 0;
  const gpoeCompletion = gpoeQuestions.length > 0 ? Math.round((gpoeAttempted / gpoeQuestions.length) * 100) : 0;

  // Weakest Chapters (attempted >= 5 and accuracy < 70%)
  const weakChapters: { id: string; num: number; title: string; material: 'ica' | 'gpoe'; accuracy: number }[] = [];
  const allChapters = [...ICA_CHAPTERS, ...GPOE_CHAPTERS];

  allChapters.forEach(ch => {
    const chQuestions = questions.filter(q => q.material === ch.material && q.chapterId === ch.id);
    if (chQuestions.length > 0) {
      const chAttempted = chQuestions.filter(q => progress.attempts[q.uniqueId] !== undefined).length;
      if (chAttempted >= 5) {
        const chCorrect = chQuestions.filter(q => progress.attempts[q.uniqueId]?.correct).length;
        const chAccuracy = Math.round((chCorrect / chAttempted) * 100);
        if (chAccuracy < 70) {
          weakChapters.push({
            id: ch.id,
            num: ch.num,
            title: ch.title,
            material: ch.material,
            accuracy: chAccuracy
          });
        }
      }
    }
  });

  // Sort Weak Chapters by accuracy ascending (weakest first) and take top 3
  const topWeakChapters = weakChapters.sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);

  const startQuickRevise = (mat: 'ica' | 'gpoe', chId: string) => {
    setActiveMaterial(mat);
    setActiveChapterId(chId);
    setStudyQuestionIndex(0);
    navigate('study');
  };

  // Extract weekly analytics for the last 7 active logs
  const logsList = Object.values(progress.dailyLogs || {});
  const last7Logs = logsList
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7);

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 space-y-6 bg-slate-50 dark:bg-slate-950/40">
      {/* Header */}
      <div>
        <h2 className="text-xs font-black uppercase text-cyan-600 dark:text-cyan-400 tracking-wider">JO Sphere Analytics</h2>
        <p className="text-2xl font-black text-slate-800 dark:text-slate-100 font-sans mt-0.5">Learn • Revise • Succeed</p>
      </div>

      {/* 1. Exam Readiness Card */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4 text-center">
        <div className="flex items-center justify-between text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          <span>Readiness Check</span>
          <span className="text-[10px] text-cyan-600">Simulated Rating</span>
        </div>
        
        {/* Visual score dial */}
        <div className="relative inline-flex items-center justify-center p-2 mt-2">
          {/* SVG Circular Dial */}
          <svg className="w-28 h-28 transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="48"
              className="stroke-slate-100 dark:stroke-slate-800 fill-none"
              strokeWidth="8"
            />
            <circle
              cx="56"
              cy="56"
              r="48"
              className="stroke-cyan-500 fill-none transition-all duration-1000 ease-out"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 48}
              strokeDashoffset={(2 * Math.PI * 48) * (1 - readinessScore / 100)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center mt-0.5">
            <span className="text-2xl font-black text-slate-850 dark:text-slate-150 font-sans leading-none">{readinessScore}%</span>
            <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">Ready</span>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${status.colorClass}`}>
            {status.label}
          </span>
          <p className="text-[10px] text-slate-400 leading-normal max-w-xs mx-auto font-medium">
            Calculated dynamically from your overall question bank completion ({completionPercent}%) and MCQ practice accuracy ({overallAccuracy}%).
          </p>
        </div>
      </section>

      {/* 2. Core Stats Grid */}
      <section className="grid grid-cols-2 gap-3 text-center text-xs font-black">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="block text-cyan-600 dark:text-cyan-400 text-lg font-sans">{overallAccuracy}%</span>
          <span className="text-[9px] text-slate-400 font-medium">Overall Accuracy</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="block text-emerald-600 dark:text-emerald-400 text-lg font-sans">{completionPercent}%</span>
          <span className="text-[9px] text-slate-400 font-medium">App Completion</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="block text-slate-800 dark:text-slate-150 text-lg font-sans">{attemptedQuestions}</span>
          <span className="text-[9px] text-slate-400 font-medium">Attempted Cards</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="block text-rose-500 text-lg font-sans">{remainingQuestions}</span>
          <span className="text-[9px] text-slate-400 font-medium">Remaining Cards</span>
        </div>
      </section>

      {/* 3. Materials Progress Breakdown */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Material Progress Breakdown</h3>
        
        {/* ICA */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-250">
            <span className="flex items-center gap-1"><BookOpen size={14} className="text-cyan-500" /> ICA Study Material</span>
            <span className="text-[10px] text-slate-400">{icaCompletion}% Completed • {icaAccuracy}% Acc</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-850">
            <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${icaCompletion}%` }} />
          </div>
        </div>

        {/* GPOE */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-250">
            <span className="flex items-center gap-1"><BookOpen size={14} className="text-emerald-500" /> GPOE Study Material</span>
            <span className="text-[10px] text-slate-400">{gpoeCompletion}% Completed • {gpoeAccuracy}% Acc</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-850">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${gpoeCompletion}%` }} />
          </div>
        </div>
      </section>

      {/* 4. Custom Weekly Study Volume Graph */}
      {last7Logs.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Daily Study Volume (Questions)</h3>
          
          <div className="h-28 w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-900 rounded-xl flex items-end justify-around p-3 relative">
            {last7Logs.map((log, idx) => {
              // Scale height based on max attempted volume (clamped to prevent overflow)
              const maxVal = Math.max(...last7Logs.map(l => l.questionsAttempted), 1);
              const heightPercent = (log.questionsAttempted / maxVal) * 100;
              const formattedDate = new Date(log.date).toLocaleDateString(undefined, { weekday: 'short' });
              
              return (
                <div key={log.date || idx} className="flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <span className="absolute -top-6 text-[8px] bg-slate-800 text-white px-1.5 py-0.5 rounded font-black opacity-0 group-hover:opacity-100 transition-opacity">
                    {log.questionsAttempted} Qs
                  </span>
                  {/* Bar */}
                  <div
                    className="w-4.5 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-md transition-all duration-500"
                    style={{ height: `${heightPercent * 0.6}px` }}
                  />
                  <span className="text-[8px] text-slate-400 font-black uppercase">{formattedDate}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Weakest Chapters */}
      {topWeakChapters.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">3. Weak Chapters (Needs Review)</h3>
          <div className="space-y-2">
            {topWeakChapters.map(ch => (
              <div
                key={`${ch.material}_${ch.id}`}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="text-[8px] bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-100 dark:border-rose-900 px-1.5 py-0.5 rounded uppercase font-black">
                    {ch.accuracy}% Accuracy
                  </span>
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-150 leading-snug pt-0.5 font-sans">
                    Ch {ch.num}: {ch.title}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-medium">
                    {ch.material === 'ica' ? 'ICA' : 'GPOE'} Engineering Card
                  </p>
                </div>
                
                <button
                  onClick={() => startQuickRevise(ch.material, ch.id)}
                  className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-[10px] uppercase rounded-xl tracking-wider active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  Quick Revise
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
