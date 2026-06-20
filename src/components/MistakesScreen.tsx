import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getChaptersByMaterial } from '../utils/chapters';
import {
  ArrowLeft,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Play,
  Award,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Sliders
} from 'lucide-react';

export const MistakesScreen: React.FC = () => {
  const {
    questions,
    progress,
    recordAttempt,
    removeMistake,
  } = useApp();

  // Dialog configurations
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [selectedCount, setSelectedCount] = useState<number>(5);
  const [selectedMode, setSelectedMode] = useState<'flashcard' | 'quiz' | 'exam'>('quiz');
  const [customCount, setCustomCount] = useState<string>('');

  // Running states
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [practiceMode, setPracticeMode] = useState<'flashcard' | 'quiz' | 'exam' | null>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  // Choice evaluation states (Quiz & Flashcard)
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState<boolean>(false);
  
  // Flashcard Flip state
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  
  // Exam timer and response states
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examTimeLeft, setExamTimeLeft] = useState<number>(0);
  const [examTimeLimit, setExamTimeLimit] = useState<number>(0);
  const [examSubmitted, setExamSubmitted] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  const mistakesQuestions = questions.filter(q => progress.mistakes.includes(q.uniqueId));
  const totalMistakes = mistakesQuestions.length;

  // Auto-clamp select count based on total mistakes available
  useEffect(() => {
    if (totalMistakes > 0 && selectedCount > totalMistakes) {
      setSelectedCount(totalMistakes);
    }
  }, [totalMistakes]);

  // Exam timer effect
  useEffect(() => {
    if (practiceMode !== 'exam' || !isPracticing || examSubmitted) return;
    if (examTimeLeft <= 0) {
      handleExamSubmit();
      alert('Time is up! Submitting exam.');
      return;
    }
    const timer = setInterval(() => {
      setExamTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [practiceMode, isPracticing, examSubmitted, examTimeLeft]);

  const handleStartPractice = (count: number, mode: 'flashcard' | 'quiz' | 'exam') => {
    if (totalMistakes > 0) {
      const finalCount = Math.max(1, Math.min(count, totalMistakes));
      // Shuffle mistake questions for a fresh learning session
      const shuffled = [...mistakesQuestions].sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, finalCount);

      setPracticeQuestions(selectedQuestions);
      setPracticeMode(mode);
      setIsPracticing(true);
      setCurrentIndex(0);
      setSelectedOption(null);
      setHasChecked(false);
      setIsFlipped(false);
      setExamAnswers({});
      setExamSubmitted(false);
      setShowConfigModal(false);

      if (mode === 'exam') {
        const timeLimit = finalCount * 60; // 1 minute per question
        setExamTimeLeft(timeLimit);
        setExamTimeLimit(timeLimit);
      }
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
    const currentQ = practiceQuestions[currentIndex];
    const isCorrect = selectedOption === currentQ.correct_answer;
    recordAttempt(currentQ.uniqueId, isCorrect);
  };

  const handleContinue = () => {
    setSelectedOption(null);
    setHasChecked(false);
    if (currentIndex >= practiceQuestions.length - 1) {
      setIsPracticing(false);
      setPracticeMode(null);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleExitPractice = () => {
    if (window.confirm('Are you sure you want to quit this practice session?')) {
      setIsPracticing(false);
      setPracticeMode(null);
    }
  };

  const handleExamSubmit = () => {
    setExamSubmitted(true);
    setShowSubmitModal(false);

    // Call recordAttempt for each question to save results and resolve correct ones
    practiceQuestions.forEach((q) => {
      const ans = examAnswers[q.uniqueId];
      const isCorrect = ans === q.correct_answer;
      recordAttempt(q.uniqueId, isCorrect);
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ==================== RENDERING LOGIC ====================

  // A. QUIZ PRACTICE VIEW
  if (isPracticing && practiceMode === 'quiz' && practiceQuestions[currentIndex]) {
    const currentMistake = practiceQuestions[currentIndex];
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
            <span>Quiz {currentIndex + 1} of {practiceQuestions.length}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 mt-1">
            <div
              className="bg-rose-500 h-full transition-all duration-200"
              style={{ width: `${((currentIndex + 1) / practiceQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 px-4 py-4 overflow-y-auto flex flex-col justify-center">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
            <div className="flex justify-between items-center text-xs font-extrabold text-rose-500 tracking-wider">
              <span>QUIZ REATTEMPT</span>
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
                  className={`w-full px-4 py-3 rounded-xl border text-left text-sm font-semibold transition-all flex items-start gap-2.5 cursor-pointer leading-normal ${getOptionStyle(
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

        <footer className="px-4 grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              if (currentIndex > 0) {
                setCurrentIndex(prev => prev - 1);
                setSelectedOption(null);
                setHasChecked(false);
              }
            }}
            disabled={currentIndex === 0}
            className={`py-3.5 rounded-2xl border text-center font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-1 min-h-[48px] ${
              currentIndex === 0
                ? 'border-slate-200 dark:border-slate-800 text-slate-350 dark:text-slate-750 cursor-not-allowed opacity-50'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer active:scale-95 transition-all'
            }`}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          {hasChecked ? (
            <button
              onClick={handleContinue}
              className="py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-2xl text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md min-h-[48px]"
            >
              {currentIndex === practiceQuestions.length - 1 ? 'Finish Practice' : 'Next Question'} <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleCheckAnswer}
              disabled={!selectedOption}
              className={`py-3.5 font-bold rounded-2xl text-sm uppercase tracking-wider shadow-md text-center cursor-pointer active:scale-[0.98] transition-all min-h-[48px] ${
                selectedOption
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-650 cursor-not-allowed'
              }`}
            >
              Check Answer
            </button>
          )}
        </footer>
      </div>
    );
  }

  // B. FLASHCARD PRACTICE VIEW
  if (isPracticing && practiceMode === 'flashcard' && practiceQuestions[currentIndex]) {
    const currentMistake = practiceQuestions[currentIndex];
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

    const cardBorderColor = isCorrectChoice ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-rose-500 bg-rose-50 text-rose-800';
    const chapterInfo = getChaptersByMaterial(currentMistake.material).find(
      c => c.id === currentMistake.chapterId
    );

    const handleRevealFlashcard = () => {
      if (!selectedOption) {
        alert('Please select an option first!');
        return;
      }
      setHasChecked(true);
      setIsFlipped(true);
      recordAttempt(currentMistake.uniqueId, selectedOption === currentMistake.correct_answer);
    };

    const handleNextFlashcard = () => {
      if (currentIndex < practiceQuestions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setHasChecked(false);
        setIsFlipped(false);
      }
    };

    const handlePrevFlashcard = () => {
      if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        setSelectedOption(null);
        setHasChecked(false);
        setIsFlipped(false);
      }
    };

    return (
      <div className="flex-1 flex flex-col justify-between overflow-hidden pb-6 safe-padding-bottom">
        <div>
          <div className="px-4 pt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
            <button
              onClick={handleExitPractice}
              className="flex items-center gap-1 text-slate-500 hover:text-slate-700 cursor-pointer font-bold"
            >
              <ArrowLeft size={14} /> Exit Flashcards
            </button>
            <span>Flashcard {currentIndex + 1} of {practiceQuestions.length}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 mt-1">
            <div
              className="bg-cyan-600 dark:bg-cyan-500 h-full transition-all duration-200"
              style={{ width: `${((currentIndex + 1) / practiceQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 px-4 py-4 overflow-y-auto flex items-center">
          <div className="w-full perspective-1000 min-h-[320px] h-[75svh] max-h-[460px] relative">
            <div className={`w-full h-full duration-500 preserve-3d relative rounded-3xl shadow-premium ${isFlipped ? 'rotate-y-180' : ''}`}>
              
              {/* Front Face */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between overflow-y-auto">
                <div>
                  <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-550 uppercase tracking-widest font-bold">
                    <span>MISTAKE FLASHCARD</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{currentMistake.material.toUpperCase()} • Ch {chapterInfo?.num}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-3 leading-relaxed">
                    {currentMistake.question}
                  </h3>
                </div>

                <div className="mt-4 space-y-2.5">
                  {reattemptOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectOption(opt.key)}
                      className={`w-full px-4 py-3 rounded-xl border text-left text-sm font-semibold transition-all flex items-start gap-2.5 cursor-pointer leading-normal ${getOptionStyle(opt.key)}`}
                      style={{ minHeight: '52px' }}
                    >
                      <span className="flex items-center justify-center w-6 h-6 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 shrink-0 font-extrabold text-slate-500 dark:text-slate-400">
                        {opt.key}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                    </button>
                  ))}
                </div>

                {!hasChecked && (
                  <button
                    onClick={handleRevealFlashcard}
                    disabled={!selectedOption}
                    className={`w-full py-4 mt-4 font-bold rounded-2xl text-center shadow-md active:scale-[0.98] transition-all cursor-pointer text-sm tracking-wider uppercase ${
                      selectedOption
                        ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-655 cursor-not-allowed'
                    }`}
                    style={{ minHeight: '52px' }}
                  >
                    Reveal Answer
                  </button>
                )}
              </div>

              {/* Back Face */}
              <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl border p-5 flex flex-col justify-between overflow-y-auto bg-white dark:bg-slate-900 ${cardBorderColor} border-transparent`}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs uppercase tracking-widest font-extrabold opacity-85">
                    <span className="flex items-center gap-1 text-slate-800 dark:text-slate-200">
                      {isCorrectChoice ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-rose-500" />}
                      {isCorrectChoice ? 'Correct!' : 'Incorrect'}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 text-slate-800 dark:text-slate-200 font-sans">
                    <div className="text-sm font-semibold flex flex-col gap-1.5">
                      <p className="flex items-center gap-1.5">
                        <span className="opacity-75">Your Answer:</span>
                        <span className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-xs font-bold">{selectedOption}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className="opacity-75">Correct Answer:</span>
                        <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-lg text-xs font-black">{currentMistake.correct_answer}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-slate-700 dark:text-slate-350">
                    <h4 className="text-xs uppercase tracking-wider font-extrabold opacity-75">Explanation</h4>
                    <p className="text-xs leading-relaxed font-medium">
                      {currentMistake.explanation || 'No explanation provided.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsFlipped(false)}
                  className="w-full py-3 mt-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-250 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs uppercase tracking-widest text-center cursor-pointer"
                >
                  Show Card Front
                </button>
              </div>

            </div>
          </div>
        </div>

        <footer className="px-4 grid grid-cols-2 gap-4">
          <button
            onClick={handlePrevFlashcard}
            disabled={currentIndex === 0}
            className={`py-3.5 rounded-2xl border text-center font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-1 min-h-[48px] ${
              currentIndex === 0
                ? 'border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-750 cursor-not-allowed opacity-50'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer active:scale-95 transition-all'
            }`}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          {currentIndex === practiceQuestions.length - 1 ? (
            <button
              onClick={() => {
                setIsPracticing(false);
                setPracticeMode(null);
              }}
              className="py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-2xl text-sm uppercase tracking-wider flex items-center justify-center gap-1 min-h-[48px] cursor-pointer active:scale-95 transition-all"
            >
              Finish Review
            </button>
          ) : (
            <button
              onClick={handleNextFlashcard}
              className="py-3.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-sm uppercase tracking-wider flex items-center justify-center gap-1 min-h-[48px] cursor-pointer active:scale-95 transition-all"
            >
              Next <ChevronRight size={16} />
            </button>
          )}
        </footer>
      </div>
    );
  }

  // C. EXAM PRACTICE VIEW
  if (isPracticing && practiceMode === 'exam' && practiceQuestions.length > 0) {
    const currentQuestion = practiceQuestions[currentIndex];

    if (examSubmitted) {
      let correctCount = 0;
      let wrongCount = 0;
      let unansweredCount = 0;

      practiceQuestions.forEach((q) => {
        const ans = examAnswers[q.uniqueId];
        if (!ans) {
          unansweredCount++;
        } else if (ans === q.correct_answer) {
          correctCount++;
        } else {
          wrongCount++;
        }
      });

      const accuracyRate = practiceQuestions.length > 0
        ? Math.round((correctCount / practiceQuestions.length) * 100)
        : 0;

      const timeSpent = examTimeLimit - examTimeLeft;

      return (
        <div className="flex-1 flex flex-col justify-between overflow-hidden pb-6 safe-padding-bottom">
          <div>
            <div className="px-4 pt-4 pb-2 border-b border-slate-205 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm">
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Exam Results</h2>
              <span className="text-[10px] bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-400 px-2 py-0.5 rounded-lg font-black uppercase">
                Mistakes Exam
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            <div className="bg-gradient-to-br from-slate-800 to-slate-950 dark:from-slate-900/60 dark:to-slate-950/90 rounded-3xl p-5 text-white shadow-premium text-center space-y-3 relative overflow-hidden">
              <h3 className="text-xs uppercase tracking-widest text-slate-400 font-extrabold">Final Score</h3>
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-cyan-500 bg-white/5 shadow-inner">
                <span className="text-3xl font-black">{correctCount}</span>
                <span className="text-sm text-slate-400 font-bold">/{practiceQuestions.length}</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-cyan-400 uppercase tracking-wider">{accuracyRate}% Accuracy</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Time Taken: {formatTime(timeSpent)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-black">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
                <span className="block text-emerald-600 dark:text-emerald-400 text-lg font-sans">{correctCount}</span>
                <span className="text-[9px] text-slate-400 font-medium">Correct</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
                <span className="block text-rose-500 text-lg font-sans">{wrongCount}</span>
                <span className="text-[9px] text-slate-400 font-medium">Wrong</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
                <span className="block text-slate-500 dark:text-slate-400 text-lg font-sans">{unansweredCount}</span>
                <span className="text-[9px] text-slate-400 font-medium">Skipped</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Question Review</h4>
              <div className="space-y-4">
                {practiceQuestions.map((q, idx) => {
                  const ans = examAnswers[q.uniqueId];
                  const chInfo = getChaptersByMaterial(q.material).find(c => c.id === q.chapterId);
                  const isCorrect = ans === q.correct_answer;
                  const isUnanswered = !ans;

                  return (
                    <div key={q.uniqueId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-premium space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                        <span>Q{idx + 1} • {q.material.toUpperCase()} Ch {chInfo?.num}</span>
                        {isUnanswered ? (
                          <span className="text-slate-500 bg-slate-105 dark:bg-slate-800 px-2 py-0.5 rounded-lg">Unanswered</span>
                        ) : isCorrect ? (
                          <span className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg font-black">Correct</span>
                        ) : (
                          <span className="text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg font-black">Wrong</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-normal">{q.question}</p>

                      <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 text-xs font-bold space-y-1.5 border border-slate-150 dark:border-slate-850">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Correct Answer:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{q.correct_answer}) {q[`option_${q.correct_answer.toLowerCase()}` as keyof typeof q]}</span>
                        </div>
                        {!isUnanswered && !isCorrect && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Your Answer:</span>
                            <span className="text-rose-500 font-extrabold">{ans}) {q[`option_${ans.toLowerCase()}` as keyof typeof q]}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-955/40 border border-slate-100 dark:border-slate-850 rounded-xl p-3 text-xs leading-relaxed text-slate-650 dark:text-slate-450 font-medium">
                        <strong className="text-[10px] text-slate-400 uppercase font-black block tracking-wider mb-1">Explanation</strong>
                        {q.explanation || 'No explanation provided.'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <footer className="px-4">
            <button
              onClick={() => {
                setIsPracticing(false);
                setPracticeMode(null);
              }}
              className="w-full py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-2xl text-sm uppercase tracking-wider shadow-md cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
              style={{ minHeight: '52px' }}
            >
              Exit & Return to Mistakes
            </button>
          </footer>
        </div>
      );
    }

    const reattemptOptions = [
      { key: 'A', text: currentQuestion.option_a },
      { key: 'B', text: currentQuestion.option_b },
      { key: 'C', text: currentQuestion.option_c },
      { key: 'D', text: currentQuestion.option_d },
    ];
    const selectedAns = examAnswers[currentQuestion.uniqueId] || null;
    const chInfo = getChaptersByMaterial(currentQuestion.material).find(
      c => c.id === currentQuestion.chapterId
    );

    return (
      <div className="flex-1 flex flex-col justify-between overflow-hidden pb-6 safe-padding-bottom">
        <div>
          <div className="px-4 pt-3 flex items-center justify-between text-xs font-semibold text-slate-550">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-0.5 text-slate-500 hover:text-slate-700 cursor-pointer font-extrabold"
            >
              <ArrowLeft size={14} /> Quit Exam
            </button>
            <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
              <Clock size={14} className="text-cyan-600" />
              <span className="font-mono">{formatTime(examTimeLeft)}</span>
            </div>
            <span>Question {currentIndex + 1} of {practiceQuestions.length}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 mt-1">
            <div
              className="bg-cyan-650 h-full transition-all duration-200 animate-pulse"
              style={{ width: `${((currentIndex + 1) / practiceQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 px-4 py-4 overflow-y-auto flex flex-col justify-center">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-premium space-y-4">
            <div className="flex justify-between items-center text-xs font-extrabold text-cyan-600 tracking-wider">
              <span>MISTAKES EXAM MODE</span>
              <span className="uppercase text-slate-400 dark:text-slate-550 text-[10px]">
                {currentQuestion.material.toUpperCase()} • Ch {chInfo?.num}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
              {currentQuestion.question}
            </h3>

            <div className="space-y-2.5">
              {reattemptOptions.map((opt) => {
                const isActive = selectedAns === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setExamAnswers(prev => ({ ...prev, [currentQuestion.uniqueId]: opt.key }));
                    }}
                    className={`w-full px-4 py-3 rounded-xl border text-left text-sm font-semibold transition-all flex items-start gap-2.5 cursor-pointer leading-normal ${
                      isActive
                        ? 'border-cyan-600 bg-cyan-55/20 text-cyan-800 dark:text-cyan-300'
                        : 'border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                    }`}
                    style={{ minHeight: '52px' }}
                  >
                    <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-xs shrink-0 font-extrabold ${
                      isActive
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {opt.key}
                    </span>
                    <span className="flex-1">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="px-4 grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
            }}
            disabled={currentIndex === 0}
            className={`py-3.5 rounded-2xl border text-center font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-1 min-h-[48px] ${
              currentIndex === 0
                ? 'border-slate-200 dark:border-slate-800 text-slate-350 dark:text-slate-750 cursor-not-allowed opacity-40'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer active:scale-95 transition-all'
            }`}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          {currentIndex === practiceQuestions.length - 1 ? (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="py-3.5 bg-rose-650 hover:bg-rose-700 text-white font-bold rounded-2xl text-sm uppercase tracking-wider flex items-center justify-center gap-1 min-h-[48px] cursor-pointer active:scale-95 transition-all"
            >
              Submit Exam
            </button>
          ) : (
            <button
              onClick={() => {
                if (currentIndex < practiceQuestions.length - 1) setCurrentIndex(prev => prev + 1);
              }}
              className="py-3.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-sm uppercase tracking-wider flex items-center justify-center gap-1 min-h-[48px] cursor-pointer active:scale-95 transition-all"
            >
              Next <ChevronRight size={16} />
            </button>
          )}
        </footer>

        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 text-center shadow-2xl">
              <AlertTriangle className="mx-auto text-rose-500" size={48} />
              <h4 className="text-base font-extrabold text-slate-850 dark:text-slate-100 font-sans">Submit Practice Exam?</h4>
              <p className="text-xs text-slate-450 dark:text-slate-500 leading-relaxed font-semibold">
                You have answered {Object.keys(examAnswers).length} of {practiceQuestions.length} questions. Correct answers will be automatically resolved from mistakes.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase rounded-xl tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExamSubmit}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase rounded-xl tracking-wider cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // D. DEFAULT LIST OF MISTAKES VIEW
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
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              onClick={() => {
                setSelectedCount(5);
                setSelectedMode('quiz');
                setShowConfigModal(true);
              }}
              className="py-3.5 bg-white text-rose-700 hover:bg-rose-50 font-bold rounded-2xl text-xs uppercase tracking-wider text-center cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all font-sans"
              style={{ color: '#be123c' }}
            >
              <Play size={14} fill="currentColor" /> Practice 5 Mistakes
            </button>
            <button
              onClick={() => {
                setSelectedCount(totalMistakes);
                setSelectedMode('quiz');
                setShowConfigModal(true);
              }}
              className="py-3.5 bg-rose-800 text-white hover:bg-rose-900 font-bold rounded-2xl text-xs uppercase tracking-wider text-center cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all font-sans border border-rose-900"
            >
              <Sliders size={14} /> Custom Practice
            </button>
          </div>
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
            <h4 className="text-sm font-bold text-slate-850 dark:text-slate-300 font-sans">Clean slate!</h4>
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
                  <div className="bg-slate-50 dark:bg-slate-955 rounded-xl p-3 text-xs flex justify-between items-center font-bold border border-slate-100 dark:border-slate-850">
                    <span className="text-slate-400 font-bold">Correct answer:</span>
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

      {/* Config Practice Modal Popup */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 rounded-lg cursor-pointer"
              title="Close modal"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100 flex items-center justify-center gap-1.5 font-sans">
                <Sliders size={18} className="text-rose-500 animate-pulse" /> Practice Setup
              </h3>
              <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold leading-normal">
                Configure your custom practice session ({totalMistakes} mistakes available).
              </p>
            </div>

            {/* Size Selector */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-black">1. Select Question Count</label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 20, 'All'].map((val) => {
                  const numVal = val === 'All' ? totalMistakes : (val as number);
                  const isAvailable = totalMistakes >= numVal || (val === 'All');
                  let isSelected = selectedCount === numVal;
                  if (val === 'All' && selectedCount === totalMistakes) {
                    isSelected = true;
                  }
                  
                  return (
                    <button
                      key={val}
                      disabled={!isAvailable}
                      onClick={() => {
                        setSelectedCount(numVal);
                        setCustomCount('');
                      }}
                      className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-500 text-white shadow-sm'
                          : isAvailable
                          ? 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          : 'opacity-30 cursor-not-allowed text-slate-400 dark:text-slate-700'
                      }`}
                    >
                      {val === 'All' ? `All (${totalMistakes})` : val}
                    </button>
                  );
                })}
              </div>
              
              {/* Custom Selector Input */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-400 font-extrabold whitespace-nowrap">Custom Size:</span>
                <input
                  type="number"
                  min={1}
                  max={totalMistakes}
                  placeholder={`1 - ${totalMistakes}`}
                  value={customCount}
                  onChange={(e) => {
                    setCustomCount(e.target.value);
                    const parsed = parseInt(e.target.value);
                    if (parsed >= 1 && parsed <= totalMistakes) {
                      setSelectedCount(parsed);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-300"
                />
              </div>
            </div>

            {/* Mode Selector */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-black">2. Choose Study Mode</label>
              <div className="flex flex-col gap-2">
                {[
                  {
                    id: 'flashcard',
                    name: '📖 Flashcard Mode',
                    desc: 'Study with interactive flipping cards.',
                    icon: <BookOpen size={16} className="text-cyan-500" />,
                  },
                  {
                    id: 'quiz',
                    name: '📝 Quiz Mode',
                    desc: 'Answer and check instantly. Correct cards resolved.',
                    icon: <CheckCircle2 size={16} className="text-emerald-500" />,
                  },
                  {
                    id: 'exam',
                    name: '⏱️ Exam Mode',
                    desc: 'Simulated timed practice exam. Score summary at the end.',
                    icon: <Clock size={16} className="text-rose-500" />,
                  },
                ].map((mode) => {
                  const isSelected = selectedMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id as any)}
                      className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-350 bg-slate-50/30 dark:bg-slate-900/50'
                      }`}
                    >
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm mt-0.5">
                        {mode.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-extrabold text-slate-850 dark:text-slate-200">{mode.name}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal font-semibold mt-0.5">{mode.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={() => handleStartPractice(selectedCount, selectedMode)}
              className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider shadow-md text-center cursor-pointer active:scale-95 transition-all"
              style={{ minHeight: '52px' }}
            >
              Start Practice ({selectedCount} Questions)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};