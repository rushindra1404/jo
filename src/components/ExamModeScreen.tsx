import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Award, ChevronLeft, ChevronRight, ArrowLeft, Check, X, AlertTriangle, RotateCcw, Home } from 'lucide-react';

export const ExamModeScreen: React.FC = () => {
  const {
    activeMaterial,
    examQuestions,
    examCurrentIndex,
    setExamCurrentIndex,
    examAnswers,
    examMode,
    setExamMode,
    startExam,
    submitExamAnswer,
    recordAttempt,
    addRecentActivity,
    navigate,
  } = useApp();

  const [selectedMaterial, setSelectedMaterial] = useState<'all' | 'ica' | 'gpoe'>('all');
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [reviewMode, setReviewMode] = useState<boolean>(false);

  const totalQuestions = examQuestions.length;
  const answeredCount = Object.keys(examAnswers).length;

  const calculateResults = () => {
    let correct = 0;
    examQuestions.forEach((q) => {
      if (examAnswers[q.uniqueId] === q.correct_answer) {
        correct++;
      }
    });
    const incorrect = totalQuestions - correct;
    const accuracy = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
    return { correct, incorrect, accuracy };
  };

  const handleStartExam = () => {
    startExam(selectedMaterial, questionCount);
  };

  const handleSelectOption = (option: string) => {
    const currentQ = examQuestions[examCurrentIndex];
    submitExamAnswer(currentQ.uniqueId, option);
  };

  const handleNext = () => {
    if (examCurrentIndex < totalQuestions - 1) {
      setExamCurrentIndex(examCurrentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (examCurrentIndex > 0) {
      setExamCurrentIndex(examCurrentIndex - 1);
    }
  };

  const handleSubmitExam = () => {
    const unanswered = totalQuestions - answeredCount;
    const confirmMsg = unanswered > 0
      ? `You have ${unanswered} unanswered questions. Are you sure you want to submit the exam?`
      : 'Are you sure you want to finish and submit the exam?';

    if (window.confirm(confirmMsg)) {
      setExamMode('result');
      const { correct, accuracy } = calculateResults();

      // Record attempts locally
      examQuestions.forEach((q) => {
        const ans = examAnswers[q.uniqueId];
        if (ans) {
          recordAttempt(q.uniqueId, ans === q.correct_answer);
        }
      });

      addRecentActivity(
        'exam',
        activeMaterial || 'ica',
        'Completed Practice Test',
        `Score: ${correct}/${totalQuestions} (${accuracy}% Accuracy)`
      );
    }
  };

  const handleRetakeExam = () => {
    setReviewMode(false);
    startExam(selectedMaterial, questionCount);
  };

  const handleExitHome = () => {
    setExamMode('setup');
    navigate('home');
  };

  if (examMode === 'setup') {
    return (
      <div className="flex-1 overflow-y-auto px-4 pb-20 pt-6 space-y-6">
        <div className="text-center max-w-sm mx-auto space-y-2">
          <div className="mx-auto w-14 h-14 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-2xl flex items-center justify-center shadow-md">
            <Award size={30} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Practice Exam Center</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Simulate real exam conditions. Answers are not revealed until submission, and questions are randomly selected.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-550 tracking-wider">
              Study Material
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['all', 'ica', 'gpoe'] as const).map((mat) => (
                <button
                  key={mat}
                  onClick={() => setSelectedMaterial(mat)}
                  className={`py-3 px-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                    selectedMaterial === mat
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {mat === 'all' ? 'Full Mix' : mat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase text-slate-400 dark:text-slate-555 tracking-wider">
              Number of Questions
            </label>
            <div className="grid grid-cols-4 gap-2">
              {([10, 25, 50, -1] as const).map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => setQuestionCount(cnt)}
                  className={`py-3 px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    questionCount === cnt
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cnt === -1 ? 'All' : cnt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleStartExam}
          className="w-full py-4 bg-cyan-600 text-white hover:bg-cyan-700 text-sm font-bold uppercase tracking-wider rounded-2xl shadow-md cursor-pointer active:scale-[0.98] transition-all"
        >
          Start Practice Exam
        </button>
      </div>
    );
  }

  if (examMode === 'running') {
    const currentQuestion = examQuestions[examCurrentIndex];
    if (!currentQuestion) return null;

    const userChoice = examAnswers[currentQuestion.uniqueId];

    const examOptions = [
      { key: 'A', text: currentQuestion.option_a },
      { key: 'B', text: currentQuestion.option_b },
      { key: 'C', text: currentQuestion.option_c },
      { key: 'D', text: currentQuestion.option_d },
    ];

    return (
      <div className="flex-1 flex flex-col justify-between overflow-hidden pb-6 safe-padding-bottom">
        <div>
          <div className="px-4 pt-3 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Practice Exam ({selectedMaterial.toUpperCase()})</span>
            <span>{examCurrentIndex + 1} of {totalQuestions}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 mt-1">
            <div
              className="bg-cyan-600 h-full transition-all duration-200"
              style={{ width: `${((examCurrentIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 px-4 py-4 overflow-y-auto flex flex-col justify-between">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
            <span className="text-xs uppercase font-extrabold text-slate-400 dark:text-slate-550 tracking-wider">
              Question {examCurrentIndex + 1}
            </span>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
              {currentQuestion.question}
            </h3>
            <div className="space-y-2.5 pt-2">
              {examOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleSelectOption(opt.key)}
                  className={`w-full px-4 py-3.5 rounded-xl border text-left text-sm font-semibold transition-all flex items-start gap-3 cursor-pointer ${
                    userChoice === opt.key
                      ? 'border-cyan-600 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-800 dark:text-cyan-300'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                  }`}
                  style={{ minHeight: '52px' }}
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 shrink-0 font-extrabold text-slate-500 dark:text-slate-400">
                    {opt.key}
                  </span>
                  <span className="flex-1 leading-normal">{opt.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs px-2 text-slate-400 dark:text-slate-500 font-semibold">
            <span>Progress: {answeredCount} answered</span>
            {examCurrentIndex === totalQuestions - 1 && (
              <button
                onClick={handleSubmitExam}
                className="py-1.5 px-3 bg-rose-600 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-rose-700"
              >
                Finish Exam
              </button>
            )}
          </div>
        </div>

        <footer className="px-4 grid grid-cols-2 gap-4">
          <button
            onClick={handlePrev}
            disabled={examCurrentIndex === 0}
            className={`py-3.5 rounded-2xl border text-center font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-1 min-h-[48px] ${
              examCurrentIndex === 0
                ? 'border-slate-200 dark:border-slate-850 text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer'
            }`}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          {examCurrentIndex === totalQuestions - 1 ? (
            <button
              onClick={handleSubmitExam}
              className="py-3.5 bg-rose-600 text-white hover:bg-rose-700 rounded-2xl text-center font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-1 min-h-[48px] cursor-pointer"
            >
              Submit Exam
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="py-3.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800 rounded-2xl text-center font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-1 min-h-[48px] cursor-pointer"
            >
              Next <ChevronRight size={16} />
            </button>
          )}
        </footer>
      </div>
    );
  }

  if (examMode === 'result') {
    const { correct, incorrect, accuracy } = calculateResults();

    if (reviewMode) {
      return (
        <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              onClick={() => setReviewMode(false)}
              className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Review Exam Answers</h3>
          </div>

          <div className="space-y-4">
            {examQuestions.map((q, idx) => {
              const ans = examAnswers[q.uniqueId];
              const isCorrect = ans === q.correct_answer;
              return (
                <div
                  key={q.uniqueId}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 space-y-3 shadow-premium ${
                    isCorrect ? 'border-emerald-250 dark:border-emerald-950/60' : 'border-rose-250 dark:border-rose-950/60'
                  }`}
                >
                  <div className="flex justify-between items-start text-xs font-bold">
                    <span className="text-slate-400 font-bold">Question {idx + 1}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider text-[10px] ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-450'
                      }`}
                    >
                      {isCorrect ? <Check size={10} /> : <X size={10} />}
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                    {q.question}
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 text-xs space-y-1.5 font-semibold">
                    <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <span className="text-slate-400">Your Answer:</span>
                      <span className={isCorrect ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>
                        {ans ? `${ans}) ${q[`option_${ans.toLowerCase()}` as keyof typeof q]}` : 'Unanswered'}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400">Correct Answer:</span>
                        <span className="text-emerald-600 font-bold">
                          {q.correct_answer}) {q[`option_${q.correct_answer.toLowerCase()}` as keyof typeof q]}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="text-xs border-t border-slate-100 dark:border-slate-800 pt-2.5 space-y-1 font-medium text-slate-700 dark:text-slate-350">
                    <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">
                      Explanation:
                    </span>
                    <p className="text-slate-650 dark:text-slate-400 leading-normal font-medium">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setReviewMode(false)}
            className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
          >
            Back to Summary
          </button>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto px-4 pb-20 pt-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-cyan-500 to-teal-500 text-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-6">
            <Award size={36} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 pt-2">Test Completed!</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Here is your summary breakdown score.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-5 text-center">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Accuracy Percentage
            </span>
            <p className="text-5xl font-black text-cyan-600 dark:text-cyan-400">{accuracy}%</p>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <div>
              <span className="block text-xl font-bold text-slate-800 dark:text-slate-100">{correct}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Correct</span>
            </div>
            <div className="border-x border-slate-100 dark:border-slate-800">
              <span className="block text-xl font-bold text-slate-800 dark:text-slate-100">{incorrect}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Incorrect</span>
            </div>
            <div>
              <span className="block text-xl font-bold text-slate-800 dark:text-slate-100">{totalQuestions}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setReviewMode(true)}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold uppercase tracking-wider rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            style={{ minHeight: '52px' }}
          >
            <AlertTriangle size={18} /> Review Mistakes
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleRetakeExam}
              className="py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase rounded-xl cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all"
              style={{ minHeight: '48px' }}
            >
              <RotateCcw size={14} /> Retake Test
            </button>
            <button
              onClick={handleExitHome}
              className="py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase rounded-xl cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all"
              style={{ minHeight: '48px' }}
            >
              <Home size={14} /> Exit Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};