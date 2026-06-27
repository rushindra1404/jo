import React from 'react';

interface DashboardChartsProps {
  overallAccuracy: number;
  icaProgress: number;
  gpoeProgress: number;
  weakCount: number;
  strongCount: number;
  totalChapters: number;
  attemptedPercent: number;
  historyCheckpoints: { label: string; value: number }[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  overallAccuracy,
  icaProgress,
  gpoeProgress,
  weakCount,
  strongCount,
  totalChapters,
  attemptedPercent,
  historyCheckpoints,
}) => {
  const moderateCount = Math.max(0, totalChapters - (weakCount + strongCount));

  // --- SVG 1: Accuracy Trend Chart ---
  const renderAccuracyTrend = () => {
    const data = historyCheckpoints.length >= 2 ? historyCheckpoints : [
      { label: 'Check 1', value: 50 },
      { label: 'Check 2', value: 65 },
      { label: 'Check 3', value: 60 },
      { label: 'Check 4', value: 75 },
      { label: 'Check 5', value: overallAccuracy || 80 },
    ];

    const width = 360;
    const height = 140;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((pt, idx) => {
      const x = padding + (idx / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - (pt.value / 100) * chartHeight;
      return { x, y, value: pt.value, label: pt.label };
    });

    const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

    const areaPath = `
      ${linePath} 
      L ${points[points.length - 1].x} ${height - padding} 
      L ${points[0].x} ${height - padding} 
      Z
    `;

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-3.5">
        <h4 className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
          Accuracy Trend
        </h4>
        <div className="relative w-full h-[140px] flex items-center justify-center">
          <svg viewBox="0 0 360 140" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <line x1={20} y1={20} x2={340} y2={20} stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth={1} strokeDasharray="4 4" />
            <line x1={20} y1={70} x2={340} y2={70} stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth={1} strokeDasharray="4 4" />
            <line x1={20} y1={120} x2={340} y2={120} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth={1} />
            <path d={areaPath} fill="url(#trendGradient)" />
            <path d={linePath} fill="none" stroke="#0ea5e9" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={5} fill="#0ea5e9" stroke="#ffffff" strokeWidth={2} className="dark:stroke-slate-900 shadow-sm" />
                <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-[10px] font-black fill-slate-700 dark:fill-slate-300 font-sans">
                  {p.value}%
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  // --- SVG 2: Material Performance ---
  const renderMaterialPerformance = () => {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
        <h4 className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
          Material Performance
        </h4>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                ICA Progress
              </span>
              <span className="font-extrabold text-slate-800 dark:text-slate-100">
                {icaProgress}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-950 h-5 rounded-xl overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
              <div className="bg-emerald-500 h-full rounded-lg transition-all duration-500" style={{ width: `${icaProgress}%` }} />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                GPOE Progress
              </span>
              <span className="font-extrabold text-slate-800 dark:text-slate-100">
                {gpoeProgress}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-950 h-5 rounded-xl overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
              <div className="bg-indigo-500 h-full rounded-lg transition-all duration-500" style={{ width: `${gpoeProgress}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- SVG 3: Chapter Performance Distribution ---
  const renderChapterPerformance = () => {
    const data = [
      { label: 'Weak', count: weakCount, color: '#f43f5e' },
      { label: 'Moderate', count: moderateCount, color: '#eab308' },
      { label: 'Strong', count: strongCount, color: '#10b981' },
    ];

    const maxCount = Math.max(1, ...data.map(d => d.count));
    const width = 360;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const barWidth = 40;
    const gap = (chartWidth - barWidth * data.length) / (data.length - 1);

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-3">
        <h4 className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
          Chapter Performance Distribution
        </h4>
        <div className="relative w-full h-[140px] flex items-center justify-center">
          <svg viewBox="0 0 360 140" className="w-full h-full overflow-visible">
            <line x1={20} y1={120} x2={340} y2={120} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth={1} />
            {data.map((item, idx) => {
              const barHeight = (item.count / maxCount) * 90;
              const x = padding + idx * (barWidth + gap) + gap / 4;
              const y = 120 - barHeight;
              return (
                <g key={idx}>
                  <rect x={x} y={y} width={barWidth} height={Math.max(4, barHeight)} rx={6} fill={item.color} />
                  <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" className="text-[10px] font-black fill-slate-700 dark:fill-slate-300 font-sans">
                    {item.count}
                  </text>
                  <text x={x + barWidth / 2} y={134} textAnchor="middle" className="text-[10px] font-bold fill-slate-400 dark:fill-slate-550 font-sans">
                    {item.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  // --- SVG 4: Completion Curve ---
  const renderCompletionCurve = () => {
    const curvePoints = [
      { x: 0, y: 0 },
      { x: 0.25, y: Math.round(attemptedPercent * 0.15) },
      { x: 0.50, y: Math.round(attemptedPercent * 0.45) },
      { x: 0.75, y: Math.round(attemptedPercent * 0.75) },
      { x: 1.00, y: attemptedPercent },
    ].map(pt => ({
      x: 15 + pt.x * 330,
      y: 105 - (pt.y / 100) * 90,
      value: pt.y,
    }));

    const linePath = curvePoints.map((p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

    const areaPath = `
      ${linePath} 
      L ${curvePoints[curvePoints.length - 1].x} 105 
      L ${curvePoints[0].x} 105 
      Z
    `;

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-3.5">
        <h4 className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
          Completion Curve
        </h4>
        <div className="relative w-full h-[120px] flex items-center justify-center">
          <svg viewBox="0 0 360 120" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="compGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <line x1={15} y1={105} x2={345} y2={105} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth={1} />
            <path d={areaPath} fill="url(#compGradient)" />
            <path d={linePath} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" />
            <g>
              <circle cx={curvePoints[curvePoints.length - 1].x} cy={curvePoints[curvePoints.length - 1].y} r={5} fill="#10b981" stroke="#ffffff" strokeWidth={2} className="dark:stroke-slate-900 shadow-sm" />
              <text x={curvePoints[curvePoints.length - 1].x - 10} y={curvePoints[curvePoints.length - 1].y - 8} className="text-[10px] font-black fill-slate-700 dark:fill-slate-300 font-sans text-right" textAnchor="end">
                {attemptedPercent}% Completed
              </text>
            </g>
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-4 pt-1">
      {renderAccuracyTrend()}
      {renderMaterialPerformance()}
      {renderChapterPerformance()}
      {renderCompletionCurve()}
    </div>
  );
};