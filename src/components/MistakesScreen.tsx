import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getChaptersByMaterial } from '../utils/chapters';
import { ArrowLeft, Check, X, ChevronRight, AlertTriangle, Play, Award, Trash2 } from 'lucide-react';

export const MistakesScreen: React.FC = () => {
  const {
    questions,
    progress,
    recordAttempt,
    removeMistake,
  } = useApp();

  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState<boolean>(false);

  const mistakesQuestions = questions.filter(q => progress.mistakes.includes(q.uniqueId));
  const totalMistakes = mistakesQuestions.length;
  const currentMistake = mistakesQuestions[currentIndex];

  const handleStartPractice = () => {
    if (totalMistakes > 0) {
      setIsPracticing(true);
      setCurrentIndex(0);
      setSelectedOption(null);
      setHasChecked(false);
    }
  };

  const handleSelectOption = (option: string) => {
    if (!hasChecked) {
      setSelectedOption(option);
    }
  };

  const handleCheckAnswer = () => {
    if (!selectedOption) {
      alert('Please select an option first.');
      return;
    }
    setHasChecked(true);
    const isCorrect = selectedOption === currentMistake.correct_answer;
    recordAttempt(currentMistake.uniqueId, isCorrect);
  };

  const handleContinue = () => {
    setSelectedOption(null);
    setHasChecked(false);
    if (totalMistakes <= 1 || currentIndex >= totalMistakes - 1) {
      if (totalMistakes > 0) {
        setCurrentIndex(0);
      } else {
        setIsPracticing(false);
      }
    } else {
      if (selectedOption !== currentMistake?.correct_answer) {
        setCurrentIndex(prev => Math.min(prev + 1, totalMistakes - 1));
      }
    }
  };

  const handleExitPractice = () => {
    setIsPracticing(false);
  };

  if (isPracticing && currentMistake) {
    const isCorrectChoice = selectedOption === currentMistake.correct_answer;
    const reattemptOptions = [
      { key: 'A', text: currentMistake.option_a },
      { key: 'B', text: currentMistake.option_b },
      { key: 'C', text: currentMistake.option_c },
      { key: 'D', text: currentMistake.option_d },
    ];

    const getOptionStyle = (key: string) => {
      if (hasChecked) {
        if (key === currentMistake.correct_answer) {
          return 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
        }
        if (key === selectedOption && !isCorrectChoice) {
          return 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-350';
        }
        return 'border-slate-200 dark:border-slate-800 opacity-60 text-slate-500 dark:text-slate-400';
      }

      if (selectedOption === key) {
        return 'border-cyan-600 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-800 dark:text-cyan-300';
      }

      return 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200';
    };

    const chapterInfo = getChaptersByMaterial(currentMistake.material).find(
      c => c.id === currentMistake.chapterId
    );

    return (
      <div className="flex-1 flex flex-col justify-between overflow-hidden pb-6 safe-padding-bottom">
        <div>
          <div className="px-4 pt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
            <button
              onClick={handleExitPractice}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-700 cursor-pointer font-bold"
            >
              <ArrowLeft size={14} /> Exit Practice
            </button>
            <span>Mistake {currentIndex + 1} of {totalMistakes}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 mt-1">
            <div
              className="bg-rose-500 h-full transition-all duration-200"
              style={{ width: `${((currentIndex + 1) / totalMistakes) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 px-4 py-4 overflow-y-auto flex flex-col justify-between">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
            <div className="flex justify-between items-center text-xs font-extrabold text-rose-500 tracking-wider">
              <span>MISTAKE REATTEMPT</span>
              <span className="uppercase text-slate-400 dark:text-slate-550 text-[10px]">
                {currentMistake.material.toUpperCase()} • Ch {chapterInfo?.num}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
              {currentMistake.question}
            </h3>
            <div className="space-y-2.5">
              {reattemptOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleSelectOption(opt.key)}
                  className={`w-full px-4 py-3 rounded-xl border text-left text-sm font-semibold transition-all flex items-start gap-2.5 cursor-pointer ${getOptionStyle(
                    opt.key
                  )}`}
                  style={{ minHeight: '52px' }}
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 shrink-0 font-extrabold text-slate-500 dark:text-slate-400">
                    {opt.key}
                  </span>
                  <span className="flex-1 leading-normal">{opt.text}</span>
                </button>
              ))}
            </div>

            {hasChecked && (
              <div
                className={`p-4 rounded-2xl text-xs space-y-2 transition-all ${
                  isCorrectChoice
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-350'
                }`}
              >
                <div className="flex items-center gap-1 font-bold">
                  {isCorrectChoice ? <Check size={14} /> : <X size={14} />}
                  <span>
                    {isCorrectChoice ? 'Correct! Removed from Mistakes.' : 'Still Incorrect. Will remain in list.'}
                  </span>
                </div>
                <p className="leading-relaxed font-semibold">
                  <strong className="uppercase text-[9px] tracking-wider block opacity-75 mt-1">Explanation:</strong>
                  {currentMistake.explanation}
                </p>
              </div>
            )}
          </div>
        </div>

        <footer className="px-4">
          {hasChecked ? (
            <button
              onClick={handleContinue}
              className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-2xl text-sm uppercase tracking-wider shadow-md cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
              style={{ minHeight: '52px' }}
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleCheckAnswer}
              disabled={!selectedOption}
              className={`w-full py-4 font-bold rounded-2xl text-sm uppercase tracking-wider shadow-md text-center cursor-pointer active:scale-[0.98] transition-all ${
                selectedOption
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-650 cursor-not-allowed'
              }`}
              style={{ minHeight: '52px' }}
            >
              Check Answer
            </button>
          )}
        </footer>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 space-y-6">
      {/* Mistakes Log Header Card */}
      <div className="bg-gradient-to-br from-rose-500 to-rose-700 dark:from-rose-950/40 dark:to-slate-900/60 rounded-3xl p-5 text-white shadow-premium relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
          <AlertTriangle size={150} />
        </div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-rose-100 opacity-90">Mistakes log</h2>
        <p className="text-3xl font-extrabold font-sans mt-1">My Mistakes</p>
        <p className="text-xs text-rose-100 mt-2 opacity-95">
          Review and practice your incorrect questions. Correct answers remove them automatically from this log.
        </p>
        {totalMistakes > 0 ? (
          <button
            onClick={handleStartPractice}
            className="w-full py-3.5 bg-white text-rose-700 hover:bg-rose-50 font-bold rounded-2xl text-xs uppercase tracking-wider text-center mt-5 cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
            style={{ color: '#be123c' }}
          >
            <Play size={14} fill="currentColor" /> Practice {totalMistakes} Mistakes
          </button>
        ) : (
          <div className="py-2.5 px-4 bg-white/10 rounded-2xl text-xs font-bold text-center mt-5 flex items-center justify-center gap-1.5">
            <Check size={16} /> Zero mistakes logged! Excellent job.
          </div>
        )}
      </div>

      {/* List of Logged Mistakes */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase text-slate-400 tracking-wider">
          All Logged Mistakes ({totalMistakes})
        </h3>
        {totalMistakes === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700">
              <Award size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300 font-sans">Clean slate!</h4>
            <p className="text-xs text-slate-400">
              All questions you answered wrong will appear here for practice.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {mistakesQuestions.map((q) => {
              const ch = getChaptersByMaterial(q.material).find(c => c.id === q.chapterId);
              return (
                <div
                  key={q.uniqueId}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-premium space-y-3"
                >
                  <div className="flex justify-between items-start text-xs font-bold">
                    <span className="text-slate-400">
                      {q.material.toUpperCase()} • Chapter {ch?.num}
                    </span>
                    <button
                      onClick={() => removeMistake(q.uniqueId)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 active:scale-90 transition-all cursor-pointer"
                      title="Remove mistake record"
                      aria-label="Remove mistake"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                    {q.question}
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 text-xs flex justify-between items-center font-bold">
                    <span className="text-slate-400">Correct answer:</span>
                    <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-lg">
                      {q.correct_answer}) {q[`option_${q.correct_answer.toLowerCase()}` as keyof typeof q]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};